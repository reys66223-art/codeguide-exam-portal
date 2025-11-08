import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-middleware";
import {
    createParticipant,
    getParticipantsByExam,
    updateParticipant,
    deleteParticipant
} from "@/lib/database-utils";
import { generateParticipantPassword } from "@/lib/exam-codes";

const CreateParticipantSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    nisnId: z.string().min(4, "NISN/ID must be at least 4 characters").max(20, "NISN/ID must be less than 20 characters"),
    dateOfBirth: z.string().datetime().optional(),
    password: z.string().min(4, "Password must be at least 4 characters").max(20, "Password must be less than 20 characters").optional(),
});

const BulkCreateParticipantsSchema = z.object({
    participants: z.array(CreateParticipantSchema).min(1, "At least one participant is required").max(100, "Cannot create more than 100 participants at once"),
});

// GET - List all participants for an exam
export async function GET(
    request: NextRequest,
    { params }: { params: { examId: string } }
) {
    try {
        const user = await getCurrentUser(request);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json(
                { error: "Unauthorized. Teacher access required." },
                { status: 401 }
            );
        }

        const { examId } = params;
        const participants = await getParticipantsByExam(examId);

        return NextResponse.json({ participants });

    } catch (error) {
        console.error("Error fetching participants:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create a new participant
export async function POST(
    request: NextRequest,
    { params }: { params: { examId: string } }
) {
    try {
        const user = await getCurrentUser(request);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json(
                { error: "Unauthorized. Teacher access required." },
                { status: 401 }
            );
        }

        const { examId } = params;
        const body = await request.json();

        // Check if it's bulk creation
        if (body.participants && Array.isArray(body.participants)) {
            const validatedData = BulkCreateParticipantsSchema.parse(body);

            const createdParticipants = [];
            for (const participantData of validatedData.participants) {
                const password = participantData.password || generateParticipantPassword();

                const participant = await createParticipant({
                    examId,
                    name: participantData.name,
                    nisnId: participantData.nisnId,
                    dateOfBirth: participantData.dateOfBirth ? new Date(participantData.dateOfBirth) : undefined,
                    password: password,
                    registeredBy: user.id,
                });

                createdParticipants.push({
                    ...participant[0],
                    generatedPassword: password,
                });
            }

            return NextResponse.json({
                success: true,
                participants: createdParticipants,
                message: `Successfully created ${createdParticipants.length} participants`,
            }, { status: 201 });
        } else {
            // Single participant creation
            const validatedData = CreateParticipantSchema.parse(body);
            const password = validatedData.password || generateParticipantPassword();

            const participants = await createParticipant({
                examId,
                name: validatedData.name,
                nisnId: validatedData.nisnId,
                dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
                password: password,
                registeredBy: user.id,
            });

            return NextResponse.json({
                success: true,
                participant: {
                    ...participants[0],
                    generatedPassword: password,
                },
            }, { status: 201 });
        }

    } catch (error) {
        console.error("Error creating participant:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid input data", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
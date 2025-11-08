import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-middleware";
import { createExam, getExamsByTeacher, updateExam, deleteExam } from "@/lib/database-utils";

const CreateExamSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
    description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
    duration: z.number().int().min(1, "Duration must be at least 1 minute").max(480, "Duration must be less than 8 hours"),
    settings: z.object({
        allowReview: z.boolean().default(true),
        showResultsImmediately: z.boolean().default(true),
        questionDisplayMode: z.enum(['one_by_one', 'all_at_once']).default('one_by_one'),
        shuffleQuestions: z.boolean().default(false),
        shuffleOptions: z.boolean().default(false),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
    }).optional(),
});

const UpdateExamSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    duration: z.number().int().min(1).max(480).optional(),
    isActive: z.boolean().optional(),
    settings: z.object({
        allowReview: z.boolean(),
        showResultsImmediately: z.boolean(),
        questionDisplayMode: z.enum(['one_by_one', 'all_at_once']),
        shuffleQuestions: z.boolean(),
        shuffleOptions: z.boolean(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
    }).optional(),
});

// GET - List all exams for the current teacher
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json(
                { error: "Unauthorized. Teacher access required." },
                { status: 401 }
            );
        }

        const exams = await getExamsByTeacher(user.id);
        return NextResponse.json({ exams });

    } catch (error) {
        console.error("Error fetching exams:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create a new exam
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json(
                { error: "Unauthorized. Teacher access required." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = CreateExamSchema.parse(body);

        const examData = {
            title: validatedData.title,
            description: validatedData.description,
            duration: validatedData.duration,
            createdBy: user.id,
            settings: {
                ...validatedData.settings,
                startDate: validatedData.settings?.startDate ? new Date(validatedData.settings.startDate) : undefined,
                endDate: validatedData.settings?.endDate ? new Date(validatedData.settings.endDate) : undefined,
            },
        };

        const exams = await createExam(examData);

        return NextResponse.json({
            success: true,
            exam: exams[0],
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating exam:", error);

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
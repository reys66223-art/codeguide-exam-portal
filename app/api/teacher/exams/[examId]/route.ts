import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-middleware";
import { updateExam, deleteExam, getQuestionsByExam } from "@/lib/database-utils";

const UpdateExamSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters").optional(),
    description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
    duration: z.number().int().min(1, "Duration must be at least 1 minute").max(480, "Duration must be less than 8 hours").optional(),
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

// GET - Get exam details with questions
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

        // Get exam details (would need to implement getExamById)
        // For now, return questions
        const questions = await getQuestionsByExam(examId);

        return NextResponse.json({
            examId,
            questions,
        });

    } catch (error) {
        console.error("Error fetching exam details:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH - Update exam
export async function PATCH(
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
        const validatedData = UpdateExamSchema.parse(body);

        const updateData: any = {};
        if (validatedData.title !== undefined) updateData.title = validatedData.title;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.duration !== undefined) updateData.duration = validatedData.duration;
        if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

        if (validatedData.settings) {
            Object.assign(updateData, validatedData.settings);
            if (validatedData.settings.startDate) {
                updateData.startDate = new Date(validatedData.settings.startDate);
            }
            if (validatedData.settings.endDate) {
                updateData.endDate = new Date(validatedData.settings.endDate);
            }
        }

        const updatedExams = await updateExam(examId, updateData);

        if (!updatedExams.length) {
            return NextResponse.json(
                { error: "Exam not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            exam: updatedExams[0],
        });

    } catch (error) {
        console.error("Error updating exam:", error);

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

// DELETE - Delete exam
export async function DELETE(
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

        await deleteExam(examId);

        return NextResponse.json({
            success: true,
            message: "Exam deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting exam:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-middleware";
import { updateQuestion, deleteQuestion } from "@/lib/database-utils";

const UpdateQuestionSchema = z.object({
    content: z.string().min(1, "Question content is required").max(2000, "Question content must be less than 2000 characters").optional(),
    points: z.number().int().min(1, "Points must be at least 1").max(100, "Points must be less than 100").optional(),
    order: z.number().int().min(1, "Order must be at least 1").optional(),
    options: z.array(z.object({
        id: z.string(),
        text: z.string().min(1).max(500),
        isCorrect: z.boolean().optional(),
    })).optional(),
    correctAnswer: z.string().optional(),
    modelAnswer: z.string().max(2000, "Model answer must be less than 2000 characters").optional(),
    explanation: z.string().max(1000, "Explanation must be less than 1000 characters").optional(),
    scoringCriteria: z.object({
        clarity: z.number().min(0).max(100),
        accuracy: z.number().min(0).max(100),
        example: z.number().min(0).max(100),
        completeness: z.number().min(0).max(100),
    }).optional(),
});

// PATCH - Update a question
export async function PATCH(
    request: NextRequest,
    { params }: { params: { examId: string; questionId: string } }
) {
    try {
        const user = await getCurrentUser(request);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json(
                { error: "Unauthorized. Teacher access required." },
                { status: 401 }
            );
        }

        const { questionId } = params;
        const body = await request.json();
        const validatedData = UpdateQuestionSchema.parse(body);

        const updateData: any = {};
        if (validatedData.content !== undefined) updateData.content = validatedData.content;
        if (validatedData.points !== undefined) updateData.points = validatedData.points;
        if (validatedData.order !== undefined) updateData.order = validatedData.order;
        if (validatedData.options !== undefined) updateData.options = validatedData.options;
        if (validatedData.correctAnswer !== undefined) updateData.correctAnswer = validatedData.correctAnswer;
        if (validatedData.modelAnswer !== undefined) updateData.modelAnswer = validatedData.modelAnswer;
        if (validatedData.explanation !== undefined) updateData.explanation = validatedData.explanation;
        if (validatedData.scoringCriteria !== undefined) updateData.scoringCriteria = validatedData.scoringCriteria;

        const updatedQuestions = await updateQuestion(questionId, updateData);

        if (!updatedQuestions.length) {
            return NextResponse.json(
                { error: "Question not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            question: updatedQuestions[0],
        });

    } catch (error) {
        console.error("Error updating question:", error);

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

// DELETE - Delete a question
export async function DELETE(
    request: NextRequest,
    { params }: { params: { examId: string; questionId: string } }
) {
    try {
        const user = await getCurrentUser(request);
        if (!user || user.role !== 'teacher') {
            return NextResponse.json(
                { error: "Unauthorized. Teacher access required." },
                { status: 401 }
            );
        }

        const { questionId } = params;

        await deleteQuestion(questionId);

        return NextResponse.json({
            success: true,
            message: "Question deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting question:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-middleware";
import {
    createQuestion,
    getQuestionsByExam,
    updateQuestion,
    deleteQuestion,
    getNextQuestionOrder
} from "@/lib/database-utils";

const CreateQuestionSchema = z.object({
    type: z.enum(['multiple_choice', 'essay']),
    content: z.string().min(1, "Question content is required").max(2000, "Question content must be less than 2000 characters"),
    points: z.number().int().min(1, "Points must be at least 1").max(100, "Points must be less than 100"),
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
}).refine((data) => {
    if (data.type === 'multiple_choice') {
        return data.options && data.options.length >= 4 && data.options.length <= 5 && data.correctAnswer;
    }
    if (data.type === 'essay') {
        return data.modelAnswer;
    }
    return true;
}, {
    message: "Invalid question configuration for the selected question type",
});

// GET - List all questions for an exam
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
        const questions = await getQuestionsByExam(examId);

        return NextResponse.json({ questions });

    } catch (error) {
        console.error("Error fetching questions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Create a new question
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
        const validatedData = CreateQuestionSchema.parse(body);

        // Get next order if not provided
        const order = validatedData.order || await getNextQuestionOrder(examId);

        const questionData = {
            examId,
            type: validatedData.type,
            content: validatedData.content,
            points: validatedData.points,
            order,
            options: validatedData.options,
            correctAnswer: validatedData.correctAnswer,
            modelAnswer: validatedData.modelAnswer,
            explanation: validatedData.explanation,
            scoringCriteria: validatedData.scoringCriteria,
        };

        const questions = await createQuestion(questionData);

        return NextResponse.json({
            success: true,
            question: questions[0],
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating question:", error);

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
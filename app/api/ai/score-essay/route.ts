import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scoreEssay } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth-middleware";
import { updateQuestion, getQuestion } from "@/lib/database-utils";

const ScoreEssaySchema = z.object({
    studentAnswer: z.string().min(1, "Student answer is required"),
    modelAnswer: z.string().min(1, "Model answer is required"),
    question: z.string().min(1, "Question is required"),
    questionId: z.string().uuid("Invalid question ID"),
    scoringCriteria: z.object({
        clarity: z.number().min(0).max(100),
        accuracy: z.number().min(0).max(100),
        completeness: z.number().min(0).max(100),
        depth: z.number().min(0).max(100),
    }).optional(),
});

// Score an essay using Gemini AI
export async function POST(request: NextRequest) {
    try {
        // Check if user is authenticated (teacher or admin)
        const user = await getCurrentUser(request);
        if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
            return NextResponse.json(
                { error: "Unauthorized. Teacher or admin access required." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = ScoreEssaySchema.parse(body);

        // Get question details to verify access
        const question = await getQuestion(validatedData.questionId);
        if (!question) {
            return NextResponse.json(
                { error: "Question not found" },
                { status: 404 }
            );
        }

        // Verify this is an essay question
        if (question.type !== 'essay') {
            return NextResponse.json(
                { error: "This is not an essay question" },
                { status: 400 }
            );
        }

        // Score the essay using AI
        const scoringResult = await scoreEssay(
            validatedData.studentAnswer,
            validatedData.modelAnswer,
            validatedData.question,
            validatedData.scoringCriteria
        );

        return NextResponse.json({
            success: true,
            result: scoringResult,
        });

    } catch (error) {
        console.error("Error scoring essay:", error);

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
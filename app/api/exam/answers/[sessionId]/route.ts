import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveStudentAnswer, getStudentAnswer, getExamSession } from "@/lib/database-utils";
import { logActivity } from "@/lib/database-utils";

const SaveAnswerSchema = z.object({
    questionId: z.string().uuid("Invalid question ID"),
    answerText: z.string(),
    isMarkedForReview: z.boolean().default(false),
    timeSpent: z.number().int().min(0).default(0),
});

// Save student answer
export async function POST(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    try {
        const { sessionId } = params;
        const body = await request.json();
        const validatedData = SaveAnswerSchema.parse(body);

        // Check if session is still valid
        const session = await getExamSession(sessionId);
        if (!session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        if (session.status === 'completed' || session.isSubmitted) {
            return NextResponse.json(
                { error: "Exam has already been submitted" },
                { status: 403 }
            );
        }

        // Get existing answer to track time spent
        const existingAnswer = await getStudentAnswer(sessionId, validatedData.questionId);

        // Save or update answer
        const result = await saveStudentAnswer({
            sessionId,
            questionId: validatedData.questionId,
            answerText: validatedData.answerText,
            isMarkedForReview: validatedData.isMarkedForReview,
            timeSpent: validatedData.timeSpent,
        });

        // Log activity
        await logActivity({
            sessionId,
            activity: 'answer_question',
            questionNumber: validatedData.questionId, // This should be the actual question number
            details: {
                answerText: validatedData.answerText,
                isMarkedForReview: validatedData.isMarkedForReview,
                timeSpent: validatedData.timeSpent,
                timestamp: new Date().toISOString(),
            },
        });

        return NextResponse.json({
            success: true,
            answer: result[0],
        });

    } catch (error) {
        console.error("Error saving answer:", error);

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

// Get all answers for a session
export async function GET(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    try {
        const { sessionId } = params;

        // Check if session is valid
        const session = await getExamSession(sessionId);
        if (!session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        const answers = await getStudentAnswers(sessionId);

        return NextResponse.json({
            answers: answers.map(answer => ({
                id: answer.id,
                questionId: answer.questionId,
                answerText: answer.answerText,
                isMarkedForReview: answer.isMarkedForReview,
                timeSpent: answer.timeSpent,
                submittedAt: answer.submittedAt,
            })),
        });

    } catch (error) {
        console.error("Error fetching answers:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
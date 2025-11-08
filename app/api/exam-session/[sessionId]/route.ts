import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    getExamSession,
    updateExamSession,
    logActivity,
    getStudentAnswers,
    getQuestionsByExam,
} from "@/lib/database-utils";

// Get exam session status and related data
export async function GET(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    try {
        const { sessionId } = params;

        if (!sessionId) {
            return NextResponse.json(
                { error: "Session ID is required" },
                { status: 400 }
            );
        }

        // Get session details
        const session = await getExamSession(sessionId);
        if (!session) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        // Get student answers for this session
        const answers = await getStudentAnswers(sessionId);

        // Calculate progress
        const questions = await getQuestionsByExam(session.examId);
        const totalQuestions = questions.length;
        const answeredQuestions = answers.filter(a => a.answerText && a.answerText.trim() !== '').length;
        const markedForReview = answers.filter(a => a.isMarkedForReview).length;

        // Calculate time remaining
        let timeRemaining = session.timeRemaining;
        if (session.startTime && !session.endTime) {
            const elapsed = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
            const examDuration = session.timeRemaining || 0; // This should be stored from exam duration
            timeRemaining = Math.max(0, examDuration - elapsed);
        }

        return NextResponse.json({
            session: {
                id: session.id,
                status: session.status,
                loginTime: session.loginTime,
                startTime: session.startTime,
                endTime: session.endTime,
                currentQuestion: session.currentQuestion,
                timeRemaining: timeRemaining,
                lastActivity: session.lastActivity,
                isSubmitted: session.isSubmitted,
            },
            progress: {
                totalQuestions,
                answeredQuestions,
                markedForReview,
                completionPercentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
            },
            answers: answers.map(answer => ({
                id: answer.id,
                questionId: answer.questionId,
                answerText: answer.answerText,
                isMarkedForReview: answer.isMarkedForReview,
                timeSpent: answer.timeSpent,
                score: answer.score,
                maxScore: answer.maxScore,
                aiFeedback: answer.aiFeedback,
                submittedAt: answer.submittedAt,
            })),
        });

    } catch (error) {
        console.error("Error getting exam session:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Update exam session status or current question
export async function PATCH(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    try {
        const { sessionId } = params;
        const body = await request.json();

        const UpdateSessionSchema = z.object({
            status: z.enum(['logged_in', 'working', 'completed', 'disconnected', 'timeout']).optional(),
            currentQuestion: z.number().int().positive().optional(),
            timeRemaining: z.number().int().min(0).optional(),
            startTime: z.string().datetime().optional(),
            endTime: z.string().datetime().optional(),
            isSubmitted: z.boolean().optional(),
            lastActivity: z.boolean().optional(), // If true, update lastActivity to now
        });

        const validatedData = UpdateSessionSchema.parse(body);

        // Prepare update data
        const updateData: any = {};
        if (validatedData.status !== undefined) updateData.status = validatedData.status;
        if (validatedData.currentQuestion !== undefined) updateData.currentQuestion = validatedData.currentQuestion;
        if (validatedData.timeRemaining !== undefined) updateData.timeRemaining = validatedData.timeRemaining;
        if (validatedData.startTime !== undefined) updateData.startTime = new Date(validatedData.startTime);
        if (validatedData.endTime !== undefined) updateData.endTime = new Date(validatedData.endTime);
        if (validatedData.isSubmitted !== undefined) updateData.isSubmitted = validatedData.isSubmitted;
        if (validatedData.lastActivity) updateData.lastActivity = new Date();

        // Update session
        const updatedSessions = await updateExamSession(sessionId, updateData);
        if (!updatedSessions.length) {
            return NextResponse.json(
                { error: "Session not found" },
                { status: 404 }
            );
        }

        // Log activity if status changed
        if (validatedData.status) {
            await logActivity({
                sessionId,
                activity: validatedData.status,
                questionNumber: validatedData.currentQuestion,
                details: {
                    timestamp: new Date().toISOString(),
                    previousStatus: updatedSessions[0].status,
                },
            });
        }

        return NextResponse.json({
            success: true,
            session: updatedSessions[0],
        });

    } catch (error) {
        console.error("Error updating exam session:", error);

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
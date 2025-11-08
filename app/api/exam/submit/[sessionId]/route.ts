import { NextRequest, NextResponse } from "next/server";
import { getExamSession, updateExamSession, getStudentAnswers, getQuestionsByExam } from "@/lib/database-utils";
import { logActivity } from "@/lib/database-utils";

// Submit exam
export async function POST(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    try {
        const { sessionId } = params;

        // Get session details
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

        // Get all student answers
        const answers = await getStudentAnswers(sessionId);
        const questions = await getQuestionsByExam(session.examId);

        // Calculate scores
        let totalScore = 0;
        let maxScore = 0;
        const gradedAnswers = [];

        for (const answer of answers) {
            const question = questions.find(q => q.id === answer.questionId);
            if (!question) continue;

            maxScore += question.points;

            if (question.type === 'multiple_choice') {
                // Auto-grade multiple choice questions
                let isCorrect = false;
                if (question.correctAnswer && answer.answerText) {
                    isCorrect = answer.answerText.toUpperCase() === question.correctAnswer.toUpperCase();
                }

                const score = isCorrect ? question.points : 0;
                totalScore += score;

                gradedAnswers.push({
                    answerId: answer.id,
                    questionId: answer.questionId,
                    score,
                    maxScore: question.points,
                    isCorrect,
                });
            } else if (question.type === 'essay') {
                // Essay questions will be graded by AI later
                // For now, just record max score
                gradedAnswers.push({
                    answerId: answer.id,
                    questionId: answer.questionId,
                    score: 0, // Will be updated by AI grading
                    maxScore: question.points,
                    needsAIGrading: true,
                });
            }
        }

        // Update session with submission details
        await updateExamSession(sessionId, {
            status: 'completed',
            endTime: new Date(),
            isSubmitted: true,
            totalScore,
            maxScore,
            percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        });

        // Log submission activity
        await logActivity({
            sessionId,
            activity: 'submit_exam',
            details: {
                submissionTime: new Date().toISOString(),
                totalScore,
                maxScore,
                percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
                totalAnswers: answers.length,
                totalQuestions: questions.length,
            },
        });

        // Get updated session for response
        const updatedSession = await getExamSession(sessionId);

        return NextResponse.json({
            success: true,
            session: updatedSession,
            results: {
                totalScore,
                maxScore,
                percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
                totalAnswers: answers.length,
                totalQuestions: questions.length,
                gradedAnswers,
            },
        });

    } catch (error) {
        console.error("Error submitting exam:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
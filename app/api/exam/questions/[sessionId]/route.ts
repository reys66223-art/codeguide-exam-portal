import { NextRequest, NextResponse } from "next/server";
import { getExamSession } from "@/lib/database-utils";
import { getQuestionsByExam } from "@/lib/database-utils";

// Get questions for a student's exam session
export async function GET(
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

        // Check if session is still valid
        if (session.status === 'completed' || session.isSubmitted) {
            return NextResponse.json(
                { error: "Exam has already been submitted" },
                { status: 403 }
            );
        }

        // Get exam questions
        const questions = await getQuestionsByExam(session.examId);

        // Shuffle questions if enabled
        if (session.examId && session.examId.shuffleQuestions) {
            // In a real implementation, you'd fetch the exam settings
            // For now, we'll keep original order
        }

        // Process questions for client-side display
        const processedQuestions = questions.map((question, index) => {
            const processed: any = {
                id: question.id,
                order: question.order,
                type: question.type,
                content: question.content,
                points: question.points,
                explanation: question.explanation,
            };

            if (question.type === 'multiple_choice' && question.options) {
                try {
                    const options = typeof question.options === 'string'
                        ? JSON.parse(question.options)
                        : question.options;

                    // Shuffle options if enabled
                    if (session.examId && session.examId.shuffleOptions) {
                        // In a real implementation, you'd shuffle here
                    }

                    processed.options = options.map((option: any, idx: number) => ({
                        id: option.id || String.fromCharCode(65 + idx), // A, B, C, D
                        text: option.text,
                    }));
                } catch (error) {
                    console.error('Error parsing question options:', error);
                    processed.options = [];
                }
            }

            // Don't send correct answers or model answers to students
            return processed;
        });

        return NextResponse.json({
            session: {
                id: session.id,
                status: session.status,
                startTime: session.startTime,
                currentQuestion: session.currentQuestion,
                timeRemaining: session.timeRemaining,
            },
            questions: processedQuestions,
        });

    } catch (error) {
        console.error("Error fetching exam questions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
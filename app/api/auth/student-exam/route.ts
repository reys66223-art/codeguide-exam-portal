import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    getExamByCode,
    getParticipantByCredentials,
    createExamSession,
    createParticipant,
    getExamSessionByParticipant,
    logActivity
} from "@/lib/database-utils";
import { generateId } from "better-auth";

const StudentExamAuthSchema = z.object({
    examCode: z.string().min(9).max(9), // XXXX-XXXX format
    studentName: z.string().min(2).max(100),
    nisnId: z.string().min(4).max(20),
    password: z.string().min(4).max(20),
    dateOfBirth: z.string().optional(), // YYYY-MM-DD format
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
});

// Student login with exam code
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = StudentExamAuthSchema.parse(body);

        const { examCode, studentName, nisnId, password, dateOfBirth, ipAddress, userAgent } = validatedData;

        // Validate exam code format
        if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(examCode.toUpperCase())) {
            return NextResponse.json(
                { error: "Invalid exam code format. Use XXXX-XXXX format." },
                { status: 400 }
            );
        }

        // Check if exam exists and is active
        const exam = await getExamByCode(examCode.toUpperCase());
        if (!exam) {
            return NextResponse.json(
                { error: "Invalid exam code or exam not found." },
                { status: 404 }
            );
        }

        if (!exam.isActive) {
            return NextResponse.json(
                { error: "This exam is not currently active." },
                { status: 403 }
            );
        }

        // Check exam date constraints
        const now = new Date();
        if (exam.startDate && now < exam.startDate) {
            return NextResponse.json(
                { error: "This exam has not started yet." },
                { status: 403 }
            );
        }

        if (exam.endDate && now > exam.endDate) {
            return NextResponse.json(
                { error: "This exam has ended." },
                { status: 403 }
            );
        }

        // Try to find existing participant
        let participant = await getParticipantByCredentials(exam.id, nisnId, password);

        // If no existing participant and date of birth is provided, create new participant
        if (!participant && dateOfBirth) {
            const parsedDateOfBirth = new Date(dateOfBirth);
            if (isNaN(parsedDateOfBirth.getTime())) {
                return NextResponse.json(
                    { error: "Invalid date of birth format. Use YYYY-MM-DD." },
                    { status: 400 }
                );
            }

            // Create new participant (self-registration)
            const newParticipants = await createParticipant({
                examId: exam.id,
                name: studentName,
                nisnId: nisnId,
                dateOfBirth: parsedDateOfBirth,
                password: password,
            });

            participant = newParticipants[0];
        }

        if (!participant) {
            return NextResponse.json(
                { error: "Invalid NISN/ID or password. Please check your credentials or contact your teacher." },
                { status: 401 }
            );
        }

        // Verify student name matches participant record
        if (participant.name.toLowerCase() !== studentName.toLowerCase()) {
            return NextResponse.json(
                { error: "Student name does not match our records." },
                { status: 401 }
            );
        }

        // Check for existing active session
        const existingSession = await getExamSessionByParticipant(exam.id, participant.id);
        if (existingSession && !existingSession.isSubmitted) {
            // Return existing session if it's still active and not submitted
            return NextResponse.json({
                success: true,
                sessionId: existingSession.id,
                exam: {
                    id: exam.id,
                    title: exam.title,
                    description: exam.description,
                    duration: exam.duration,
                    allowReview: exam.allowReview,
                    showResultsImmediately: exam.showResultsImmediately,
                    questionDisplayMode: exam.questionDisplayMode,
                    shuffleQuestions: exam.shuffleQuestions,
                    shuffleOptions: exam.shuffleOptions,
                },
                participant: {
                    id: participant.id,
                    name: participant.name,
                    nisnId: participant.nisnId,
                },
                session: {
                    id: existingSession.id,
                    status: existingSession.status,
                    loginTime: existingSession.loginTime,
                    startTime: existingSession.startTime,
                    currentQuestion: existingSession.currentQuestion,
                    timeRemaining: existingSession.timeRemaining,
                },
                isNewSession: false,
            });
        }

        // Create new exam session
        const sessionId = generateId();
        const newSessions = await createExamSession({
            examId: exam.id,
            participantId: participant.id,
            studentName: studentName,
            examCode: examCode.toUpperCase(),
            ipAddress: ipAddress,
            userAgent: userAgent,
        });

        const session = newSessions[0];

        // Log login activity
        await logActivity({
            sessionId: session.id,
            activity: 'login',
            details: {
                examCode: examCode.toUpperCase(),
                studentName: studentName,
                nisnId: nisnId,
                loginTime: session.loginTime,
            },
        });

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            exam: {
                id: exam.id,
                title: exam.title,
                description: exam.description,
                duration: exam.duration,
                allowReview: exam.allowReview,
                showResultsImmediately: exam.showResultsImmediately,
                questionDisplayMode: exam.questionDisplayMode,
                shuffleQuestions: exam.shuffleQuestions,
                shuffleOptions: exam.shuffleOptions,
            },
            participant: {
                id: participant.id,
                name: participant.name,
                nisnId: participant.nisnId,
            },
            session: {
                id: session.id,
                status: session.status,
                loginTime: session.loginTime,
                startTime: session.startTime,
                currentQuestion: session.currentQuestion,
                timeRemaining: session.timeRemaining,
            },
            isNewSession: true,
        });

    } catch (error) {
        console.error("Student exam authentication error:", error);

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
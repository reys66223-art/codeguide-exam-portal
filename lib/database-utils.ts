import { db } from '@/db/index';
import {
    user,
    exams,
    questions,
    participants,
    examSessions,
    studentAnswers,
    activityLogs
} from '@/db/schema';
import { eq, and, desc, asc, isNotNull, sql } from 'drizzle-orm';
import { generateExamCode, generateParticipantPassword, isValidExamCode } from './exam-codes';

// User Management Functions
export async function createTeacher(data: {
    name: string;
    email: string;
    password?: string;
    school?: string;
}) {
    return await db.insert(user).values({
        name: data.name,
        email: data.email,
        role: 'teacher',
        school: data.school,
    }).returning();
}

export async function getTeachers() {
    return await db.select({
        id: user.id,
        name: user.name,
        email: user.email,
        school: user.school,
        createdAt: user.createdAt,
    }).from(user).where(eq(user.role, 'teacher'));
}

// Exam Management Functions
export async function createExam(data: {
    title: string;
    description?: string;
    duration: number;
    createdBy: string;
    settings?: {
        allowReview?: boolean;
        showResultsImmediately?: boolean;
        questionDisplayMode?: 'one_by_one' | 'all_at_once';
        shuffleQuestions?: boolean;
        shuffleOptions?: boolean;
        startDate?: Date;
        endDate?: Date;
    };
}) {
    let code = generateExamCode();

    // Ensure unique code
    while (await getExamByCode(code)) {
        code = generateExamCode();
    }

    return await db.insert(exams).values({
        title: data.title,
        description: data.description,
        duration: data.duration,
        code: code,
        createdBy: data.createdBy,
        allowReview: data.settings?.allowReview ?? true,
        showResultsImmediately: data.settings?.showResultsImmediately ?? true,
        questionDisplayMode: data.settings?.questionDisplayMode ?? 'one_by_one',
        shuffleQuestions: data.settings?.shuffleQuestions ?? false,
        shuffleOptions: data.settings?.shuffleOptions ?? false,
        startDate: data.settings?.startDate,
        endDate: data.settings?.endDate,
    }).returning();
}

export async function getExamByCode(code: string) {
    if (!isValidExamCode(code)) {
        return null;
    }

    const result = await db.select()
        .from(exams)
        .where(eq(exams.code, code.toUpperCase()))
        .limit(1);

    return result[0] || null;
}

export async function getExamsByTeacher(teacherId: string) {
    return await db.select({
        id: exams.id,
        title: exams.title,
        description: exams.description,
        duration: exams.duration,
        code: exams.code,
        isActive: exams.isActive,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt,
        questionCount: sql<number>`(
            SELECT COUNT(*) FROM questions
            WHERE questions.exam_id = exams.id
        )`.as('questionCount'),
        participantCount: sql<number>`(
            SELECT COUNT(*) FROM participants
            WHERE participants.exam_id = exams.id
        )`.as('participantCount'),
    }).from(exams)
    .where(eq(exams.createdBy, teacherId))
    .orderBy(desc(exams.createdAt));
}

export async function updateExam(examId: string, data: Partial<typeof exams.$inferInsert>) {
    return await db.update(exams)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(exams.id, examId))
        .returning();
}

export async function deleteExam(examId: string) {
    return await db.delete(exams).where(eq(exams.id, examId));
}

// Question Management Functions
export async function createQuestion(data: {
    examId: string;
    type: 'multiple_choice' | 'essay';
    content: string;
    points?: number;
    order: number;
    options?: any[];
    correctAnswer?: string;
    modelAnswer?: string;
    explanation?: string;
    scoringCriteria?: any;
}) {
    return await db.insert(questions).values({
        examId: data.examId,
        type: data.type,
        content: data.content,
        points: data.points || 1,
        order: data.order,
        options: data.options ? JSON.stringify(data.options) : null,
        correctAnswer: data.correctAnswer,
        modelAnswer: data.modelAnswer,
        explanation: data.explanation,
        scoringCriteria: data.scoringCriteria ? JSON.stringify(data.scoringCriteria) : null,
    }).returning();
}

export async function getQuestionsByExam(examId: string) {
    return await db.select()
        .from(questions)
        .where(eq(questions.examId, examId))
        .orderBy(asc(questions.order));
}

export async function updateQuestion(questionId: string, data: Partial<typeof questions.$inferInsert>) {
    return await db.update(questions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(questions.id, questionId))
        .returning();
}

export async function deleteQuestion(questionId: string) {
    return await db.delete(questions).where(eq(questions.id, questionId));
}

export async function getNextQuestionOrder(examId: string) {
    const result = await db.select({ order: questions.order })
        .from(questions)
        .where(eq(questions.examId, examId))
        .orderBy(desc(questions.order))
        .limit(1);

    return result[0] ? result[0].order + 1 : 1;
}

// Participant Management Functions
export async function createParticipant(data: {
    examId: string;
    name: string;
    nisnId: string;
    dateOfBirth?: Date;
    password?: string;
    registeredBy?: string;
}) {
    const password = data.password || generateParticipantPassword();

    return await db.insert(participants).values({
        examId: data.examId,
        name: data.name,
        nisnId: data.nisnId,
        password: password,
        dateOfBirth: data.dateOfBirth,
        registeredBy: data.registeredBy,
    }).returning();
}

export async function getParticipantsByExam(examId: string) {
    return await db.select()
        .from(participants)
        .where(eq(participants.examId, examId))
        .orderBy(asc(participants.name));
}

export async function getParticipantByCredentials(examId: string, nisnId: string, password: string) {
    const result = await db.select()
        .from(participants)
        .where(
            and(
                eq(participants.examId, examId),
                eq(participants.nisnId, nisnId),
                eq(participants.password, password)
            )
        )
        .limit(1);

    return result[0] || null;
}

export async function updateParticipant(participantId: string, data: Partial<typeof participants.$inferInsert>) {
    return await db.update(participants)
        .set(data)
        .where(eq(participants.id, participantId))
        .returning();
}

// Exam Session Functions
export async function createExamSession(data: {
    examId: string;
    participantId?: string;
    studentName: string;
    examCode: string;
    ipAddress?: string;
    userAgent?: string;
}) {
    return await db.insert(examSessions).values({
        examId: data.examId,
        participantId: data.participantId,
        studentName: data.studentName,
        examCode: data.examCode,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
    }).returning();
}

export async function getExamSession(sessionId: string) {
    const result = await db.select()
        .from(examSessions)
        .where(eq(examSessions.id, sessionId))
        .limit(1);

    return result[0] || null;
}

export async function updateExamSession(sessionId: string, data: Partial<typeof examSessions.$inferInsert>) {
    return await db.update(examSessions)
        .set({ ...data, lastActivity: new Date() })
        .where(eq(examSessions.id, sessionId))
        .returning();
}

export async function getActiveExamSessions(examId: string) {
    return await db.select()
        .from(examSessions)
        .where(
            and(
                eq(examSessions.examId, examId),
                sql`status IN ('logged_in', 'working')`
            )
        )
        .orderBy(desc(examSessions.lastActivity));
}

export async function getExamSessionByParticipant(examId: string, participantId: string) {
    const result = await db.select()
        .from(examSessions)
        .where(
            and(
                eq(examSessions.examId, examId),
                eq(examSessions.participantId, participantId),
                eq(examSessions.isSubmitted, false)
            )
        )
        .orderBy(desc(examSessions.createdAt))
        .limit(1);

    return result[0] || null;
}

// Student Answer Functions
export async function saveStudentAnswer(data: {
    sessionId: string;
    questionId: string;
    answerText: string;
    isMarkedForReview?: boolean;
    timeSpent?: number;
}) {
    // Check if answer already exists
    const existingAnswer = await db.select()
        .from(studentAnswers)
        .where(
            and(
                eq(studentAnswers.sessionId, data.sessionId),
                eq(studentAnswers.questionId, data.questionId)
            )
        )
        .limit(1);

    if (existingAnswer[0]) {
        // Update existing answer
        return await db.update(studentAnswers)
            .set({
                answerText: data.answerText,
                isMarkedForReview: data.isMarkedForReview || false,
                timeSpent: data.timeSpent || 0,
                updatedAt: new Date(),
            })
            .where(eq(studentAnswers.id, existingAnswer[0].id))
            .returning();
    } else {
        // Create new answer
        return await db.insert(studentAnswers).values({
            sessionId: data.sessionId,
            questionId: data.questionId,
            answerText: data.answerText,
            isMarkedForReview: data.isMarkedForReview || false,
            timeSpent: data.timeSpent || 0,
        }).returning();
    }
}

export async function getStudentAnswers(sessionId: string) {
    return await db.select({
        id: studentAnswers.id,
        questionId: studentAnswers.questionId,
        answerText: studentAnswers.answerText,
        isMarkedForReview: studentAnswers.isMarkedForReview,
        timeSpent: studentAnswers.timeSpent,
        score: studentAnswers.score,
        maxScore: studentAnswers.maxScore,
        aiFeedback: studentAnswers.aiFeedback,
        submittedAt: studentAnswers.submittedAt,
        question: {
            id: questions.id,
            type: questions.type,
            content: questions.content,
            points: questions.points,
            order: questions.order,
            options: questions.options,
            correctAnswer: questions.correctAnswer,
            modelAnswer: questions.modelAnswer,
        },
    })
    .from(studentAnswers)
    .leftJoin(questions, eq(studentAnswers.questionId, questions.id))
    .where(eq(studentAnswers.sessionId, sessionId))
    .orderBy(asc(questions.order));
}

export async function getStudentAnswer(sessionId: string, questionId: string) {
    const result = await db.select()
        .from(studentAnswers)
        .where(
            and(
                eq(studentAnswers.sessionId, sessionId),
                eq(studentAnswers.questionId, questionId)
            )
        )
        .limit(1);

    return result[0] || null;
}

// Activity Logging Functions
export async function logActivity(data: {
    sessionId: string;
    activity: string;
    questionNumber?: number;
    details?: any;
}) {
    return await db.insert(activityLogs).values({
        sessionId: data.sessionId,
        activity: data.activity,
        questionNumber: data.questionNumber,
        details: data.details ? JSON.stringify(data.details) : null,
    }).returning();
}

export async function getActivityLogs(sessionId: string) {
    return await db.select()
        .from(activityLogs)
        .where(eq(activityLogs.sessionId, sessionId))
        .orderBy(desc(activityLogs.timestamp));
}

export async function getRecentActivityLogs(examId: string, limit: number = 100) {
    return await db.select({
        id: activityLogs.id,
        activity: activityLogs.activity,
        questionNumber: activityLogs.questionNumber,
        timestamp: activityLogs.timestamp,
        details: activityLogs.details,
        session: {
            id: examSessions.id,
            studentName: examSessions.studentName,
            status: examSessions.status,
        },
    })
    .from(activityLogs)
    .leftJoin(examSessions, eq(activityLogs.sessionId, examSessions.id))
    .where(eq(examSessions.examId, examId))
    .orderBy(desc(activityLogs.timestamp))
    .limit(limit);
}

// Statistics and Reporting Functions
export async function getExamStatistics(examId: string) {
    const result = await db.select({
        totalParticipants: sql<number>`COUNT(DISTINCT CASE WHEN ${examSessions.id} IS NOT NULL THEN ${participants.id} END)`,
        activeSessions: sql<number>`COUNT(CASE WHEN ${examSessions.status} IN ('logged_in', 'working') THEN 1 END)`,
        completedSessions: sql<number>`COUNT(CASE WHEN ${examSessions.status} = 'completed' THEN 1 END)`,
        averageScore: sql<number>`AVG(CASE WHEN ${examSessions.isSubmitted} = true THEN ${examSessions.percentage} END)`,
    })
    .from(participants)
    .leftJoin(examSessions, eq(participants.examId, examSessions.examId))
    .where(eq(participants.examId, examId));

    return result[0] || null;
}
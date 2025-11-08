import {
    pgTable,
    text,
    integer,
    timestamp,
    boolean,
    jsonb,
    varchar,
    uuid
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

// Exams table - stores exam information
export const exams = pgTable("exams", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    duration: integer("duration").notNull(), // Duration in minutes
    code: text("code").notNull().unique(), // Unique exam code for students
    createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").default(true).notNull(),
    allowReview: boolean("allow_review").default(true).notNull(),
    showResultsImmediately: boolean("show_results_immediately").default(true).notNull(),
    questionDisplayMode: varchar("question_display_mode", { enum: ["one_by_one", "all_at_once"] }).default("one_by_one").notNull(),
    shuffleQuestions: boolean("shuffle_questions").default(false).notNull(),
    shuffleOptions: boolean("shuffle_options").default(false).notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Questions table - stores exam questions
export const questions = pgTable("questions", {
    id: uuid("id").primaryKey().defaultRandom(),
    examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
    type: varchar("type", { enum: ["multiple_choice", "essay"] }).notNull(),
    content: text("content").notNull(), // Question text
    points: integer("points").default(1).notNull(),
    order: integer("order").notNull(),
    explanation: text("explanation"), // Optional explanation for the answer
    // Multiple choice specific fields
    options: jsonb("options"), // Array of options for multiple choice
    correctAnswer: text("correct_answer"), // Correct option index/letter for multiple choice
    // Essay specific fields
    modelAnswer: text("model_answer"), // Model answer for essay questions
    scoringCriteria: jsonb("scoring_criteria"), // AI scoring criteria
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Participants table - stores registered students for exams
export const participants = pgTable("participants", {
    id: uuid("id").primaryKey().defaultRandom(),
    examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nisnId: text("nisn_id").notNull(),
    password: text("password").notNull(), // Simple password for participant access
    dateOfBirth: timestamp("date_of_birth"),
    isRegistered: boolean("is_registered").default(true).notNull(),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
    registeredBy: text("registered_by").references(() => user.id, { onDelete: "set null" }),
});

// Exam sessions table - tracks student exam sessions
export const examSessions = pgTable("exam_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    examId: uuid("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id").references(() => participants.id, { onDelete: "cascade" }),
    studentName: text("student_name").notNull(),
    examCode: text("exam_code").notNull(),
    status: varchar("status", {
        enum: ["logged_in", "working", "completed", "disconnected", "timeout"]
    }).default("logged_in").notNull(),
    loginTime: timestamp("login_time").defaultNow().notNull(),
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),
    lastActivity: timestamp("last_activity").defaultNow().notNull(),
    currentQuestion: integer("current_question").default(1), // Current question number
    timeRemaining: integer("time_remaining"), // Remaining time in seconds
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    totalScore: integer("total_score").default(0),
    maxScore: integer("max_score").default(0),
    percentage: integer("percentage").default(0),
    isSubmitted: boolean("is_submitted").default(false).notNull(),
});

// Student answers table - stores student responses
export const studentAnswers = pgTable("student_answers", {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").notNull().references(() => examSessions.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    answerText: text("answer_text"), // Student's answer (for essays) or selected option (for multiple choice)
    isMarkedForReview: boolean("is_marked_for_review").default(false).notNull(),
    timeSpent: integer("time_spent").default(0), // Time spent on this question in seconds
    score: integer("score").default(0), // Points earned for this question
    maxScore: integer("max_score").notNull(), // Maximum points for this question
    aiFeedback: text("ai_feedback"), // AI-generated feedback for essay answers
    aiConfidence: integer("ai_confidence"), // AI confidence score (0-100)
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Real-time activity log for monitoring
export const activityLogs = pgTable("activity_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").notNull().references(() => examSessions.id, { onDelete: "cascade" }),
    activity: varchar("activity", {
        enum: ["login", "logout", "start_exam", "view_question", "answer_question", "mark_review", "submit_exam", "disconnect", "reconnect"]
    }).notNull(),
    questionNumber: integer("question_number"), // Current question when activity occurred
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    details: jsonb("details"), // Additional activity details
});

// Define relations

export const examRelations = relations(exams, {
    one: {
        creator: {
            fields: [exams.createdBy],
            references: [user.id],
        },
    },
    many: {
        questions: {
            relationName: "exam_questions",
        },
        participants: {
            relationName: "exam_participants",
        },
        sessions: {
            relationName: "exam_sessions",
        },
    },
});

export const questionRelations = relations(questions, {
    one: {
        exam: {
            fields: [questions.examId],
            references: [exams.id],
        },
    },
    many: {
        answers: {
            relationName: "question_answers",
        },
    },
});

export const participantRelations = relations(participants, {
    one: {
        exam: {
            fields: [participants.examId],
            references: [exams.id],
        },
        registrar: {
            fields: [participants.registeredBy],
            references: [user.id],
        },
    },
    many: {
        sessions: {
            relationName: "participant_sessions",
        },
    },
});

export const sessionRelations = relations(examSessions, {
    one: {
        exam: {
            fields: [examSessions.examId],
            references: [exams.id],
        },
        participant: {
            fields: [examSessions.participantId],
            references: [participants.id],
        },
    },
    many: {
        answers: {
            relationName: "session_answers",
        },
        activities: {
            relationName: "session_activities",
        },
    },
});

export const answerRelations = relations(studentAnswers, {
    one: {
        session: {
            fields: [studentAnswers.sessionId],
            references: [examSessions.id],
        },
        question: {
            fields: [studentAnswers.questionId],
            references: [questions.id],
        },
    },
});

export const activityLogRelations = relations(activityLogs, {
    one: {
        session: {
            fields: [activityLogs.sessionId],
            references: [examSessions.id],
        },
    },
});

// Export types
export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type ExamSession = typeof examSessions.$inferSelect;
export type NewExamSession = typeof examSessions.$inferInsert;
export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type NewStudentAnswer = typeof studentAnswers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
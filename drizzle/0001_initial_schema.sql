-- Migration script to create the exam platform database schema

-- Update the existing user table to include exam platform fields
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "role" varchar(10) DEFAULT 'student' NOT NULL,
ADD COLUMN IF NOT EXISTS "nisn_id" text,
ADD COLUMN IF NOT EXISTS "date_of_birth" timestamp,
ADD COLUMN IF NOT EXISTS "phone_number" text,
ADD COLUMN IF NOT EXISTS "school" text,
ADD COLUMN IF NOT EXISTS "grade" text;

-- Add constraint for role field
ALTER TABLE "user"
ADD CONSTRAINT "user_role_check" CHECK ("role" IN ('teacher', 'student', 'admin'));

-- Create exams table
CREATE TABLE IF NOT EXISTS "exams" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "description" text,
    "duration" integer NOT NULL,
    "code" text NOT NULL UNIQUE,
    "created_by" text NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "allow_review" boolean DEFAULT true NOT NULL,
    "show_results_immediately" boolean DEFAULT true NOT NULL,
    "question_display_mode" varchar(11) DEFAULT 'one_by_one' NOT NULL,
    "shuffle_questions" boolean DEFAULT false NOT NULL,
    "shuffle_options" boolean DEFAULT false NOT NULL,
    "start_date" timestamp,
    "end_date" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "exams_question_display_mode_check" CHECK ("question_display_mode" IN ('one_by_one', 'all_at_once'))
);

-- Create foreign key constraint for exams.created_by
ALTER TABLE "exams"
ADD CONSTRAINT "exams_created_by_user_id_fk"
FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;

-- Create questions table
CREATE TABLE IF NOT EXISTS "questions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "exam_id" uuid NOT NULL,
    "type" varchar(14) NOT NULL,
    "content" text NOT NULL,
    "points" integer DEFAULT 1 NOT NULL,
    "order" integer NOT NULL,
    "explanation" text,
    "options" jsonb,
    "correct_answer" text,
    "model_answer" text,
    "scoring_criteria" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "questions_type_check" CHECK ("type" IN ('multiple_choice', 'essay'))
);

-- Create foreign key constraint for questions.exam_id
ALTER TABLE "questions"
ADD CONSTRAINT "questions_exam_id_exams_id_fk"
FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE cascade ON UPDATE no action;

-- Create participants table
CREATE TABLE IF NOT EXISTS "participants" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "exam_id" uuid NOT NULL,
    "name" text NOT NULL,
    "nisn_id" text NOT NULL,
    "password" text NOT NULL,
    "date_of_birth" timestamp,
    "is_registered" boolean DEFAULT true NOT NULL,
    "registered_at" timestamp DEFAULT now() NOT NULL,
    "registered_by" text
);

-- Create foreign key constraints for participants
ALTER TABLE "participants"
ADD CONSTRAINT "participants_exam_id_exams_id_fk"
FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "participants"
ADD CONSTRAINT "participants_registered_by_user_id_fk"
FOREIGN KEY ("registered_by") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action;

-- Create exam_sessions table
CREATE TABLE IF NOT EXISTS "exam_sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "exam_id" uuid NOT NULL,
    "participant_id" uuid,
    "student_name" text NOT NULL,
    "exam_code" text NOT NULL,
    "status" varchar(12) DEFAULT 'logged_in' NOT NULL,
    "login_time" timestamp DEFAULT now() NOT NULL,
    "start_time" timestamp,
    "end_time" timestamp,
    "last_activity" timestamp DEFAULT now() NOT NULL,
    "current_question" integer DEFAULT 1,
    "time_remaining" integer,
    "ip_address" text,
    "user_agent" text,
    "total_score" integer DEFAULT 0,
    "max_score" integer DEFAULT 0,
    "percentage" integer DEFAULT 0,
    "is_submitted" boolean DEFAULT false NOT NULL,
    CONSTRAINT "exam_sessions_status_check" CHECK ("status" IN ('logged_in', 'working', 'completed', 'disconnected', 'timeout'))
);

-- Create foreign key constraints for exam_sessions
ALTER TABLE "exam_sessions"
ADD CONSTRAINT "exam_sessions_exam_id_exams_id_fk"
FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "exam_sessions"
ADD CONSTRAINT "exam_sessions_participant_id_participants_id_fk"
FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE cascade ON UPDATE no action;

-- Create student_answers table
CREATE TABLE IF NOT EXISTS "student_answers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id" uuid NOT NULL,
    "question_id" uuid NOT NULL,
    "answer_text" text,
    "is_marked_for_review" boolean DEFAULT false NOT NULL,
    "time_spent" integer DEFAULT 0,
    "score" integer DEFAULT 0,
    "max_score" integer NOT NULL,
    "ai_feedback" text,
    "ai_confidence" integer,
    "submitted_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create foreign key constraints for student_answers
ALTER TABLE "student_answers"
ADD CONSTRAINT "student_answers_session_id_exam_sessions_id_fk"
FOREIGN KEY ("session_id") REFERENCES "exam_sessions"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "student_answers"
ADD CONSTRAINT "student_answers_question_id_questions_id_fk"
FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE cascade ON UPDATE no action;

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id" uuid NOT NULL,
    "activity" varchar(16) NOT NULL,
    "question_number" integer,
    "timestamp" timestamp DEFAULT now() NOT NULL,
    "details" jsonb,
    CONSTRAINT "activity_logs_activity_check" CHECK ("activity" IN ('login', 'logout', 'start_exam', 'view_question', 'answer_question', 'mark_review', 'submit_exam', 'disconnect', 'reconnect'))
);

-- Create foreign key constraint for activity_logs
ALTER TABLE "activity_logs"
ADD CONSTRAINT "activity_logs_session_id_exam_sessions_id_fk"
FOREIGN KEY ("session_id") REFERENCES "exam_sessions"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_exams_created_by" ON "exams"("created_by");
CREATE INDEX IF NOT EXISTS "idx_exams_code" ON "exams"("code");
CREATE INDEX IF NOT EXISTS "idx_questions_exam_id" ON "questions"("exam_id");
CREATE INDEX IF NOT EXISTS "idx_participants_exam_id" ON "participants"("exam_id");
CREATE INDEX IF NOT EXISTS "idx_participants_nisn_id" ON "participants"("nisn_id");
CREATE INDEX IF NOT EXISTS "idx_exam_sessions_exam_id" ON "exam_sessions"("exam_id");
CREATE INDEX IF NOT EXISTS "idx_exam_sessions_student_name" ON "exam_sessions"("student_name");
CREATE INDEX IF NOT EXISTS "idx_exam_sessions_status" ON "exam_sessions"("status");
CREATE INDEX IF NOT EXISTS "idx_student_answers_session_id" ON "student_answers"("session_id");
CREATE INDEX IF NOT EXISTS "idx_student_answers_question_id" ON "student_answers"("question_id");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_session_id" ON "activity_logs"("session_id");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_timestamp" ON "activity_logs"("timestamp");

-- Create unique constraint to prevent duplicate answers per question per session
ALTER TABLE "student_answers"
ADD CONSTRAINT "unique_session_question" UNIQUE ("session_id", "question_id");
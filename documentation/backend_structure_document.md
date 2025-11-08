# Backend Structure Document: codeguide-exam-portal

This document explains the backend setup for the `codeguide-exam-portal` starter template. It describes how the server logic is organized, where data lives, how the app communicates, and how everything is hosted and secured. You don’t need deep technical expertise to follow along—every term is explained in plain language.

## 1. Backend Architecture

Overall, the backend is built on top of Next.js API routes. Instead of a separate server, each API endpoint lives as a serverless function. Here’s how it’s structured:

- **Next.js API Routes**: Each route (for example, `/api/exams`) is its own function. This makes scaling automatic—new copies spin up when needed.
- **Design Patterns**:
  - **Layered Organization**: Business logic (in `lib/`), data access (in `db/`), and route handlers (in `app/api/`) are clearly separated.
  - **Adapter-Based Auth**: Using Better Auth’s adapters, we keep authentication flexible and extendable.
- **Frameworks Used**:
  - **Next.js**: Provides routing, serverless functions, and production optimizations out of the box.
  - **TypeScript**: Gives type safety across the entire codebase, reducing runtime errors.
  - **Drizzle ORM**: A type-safe way to interact with PostgreSQL, preventing common database mistakes.

How this supports the project goals:
- **Scalability**: Serverless functions scale automatically under load.
- **Maintainability**: Clear separation of concerns keeps code easy to understand and update.
- **Performance**: Cold starts are minimal with Vercel, and database calls are optimized by Drizzle’s generated queries.

## 2. Database Management

We store all structured data in a PostgreSQL database. Here’s the breakdown:

- **Type**: Relational SQL database
- **Specific System**: PostgreSQL
- **ORM**: Drizzle ORM, which generates type-safe queries and migrations.

How data is managed:
- **Tables**: Represent users, exams, questions, choices, student answers, and exam sessions.
- **Relationships**: Foreign keys link questions to exams, choices to questions, and answers to both students and questions.
- **Data Access**: All queries go through Drizzle ORM functions defined in `db/schema/`. This ensures consistent, validated data access.
- **Best Practices**:
  - **Type Validation**: We use Zod together with Drizzle to validate incoming data on every API.
  - **Migrations**: Schema changes are versioned, so updating the database in production is predictable.

## 3. Database Schema

### Human-Readable Data Model

- **users**: Stores teachers and students. Each user has a role (`teacher` or `student`).
- **exams**: Holds exam settings like title, duration (minutes), and a unique code.
- **questions**: Tied to a specific exam. Contains question text, type (`multiple_choice` or `essay`), and model answer for essays.
- **choices**: For multiple-choice questions. Each record is one option linked to a question.
- **student_answers**: Records a student’s answer to each question, including AI-generated score for essays.
- **exam_sessions**: Tracks when a student starts an exam, their status, and timestamps for real-time monitoring.

### SQL Schema (PostgreSQL)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,         -- for teachers
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher','student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,    -- unique exam code for students
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice','essay')),
  text TEXT NOT NULL,
  model_answer TEXT,           -- used for essay scoring
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE choices (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE exam_sessions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('in_progress','completed'))
);

CREATE TABLE student_answers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id),
  answer_text TEXT,
  score NUMERIC,                -- stores AI score for essays or points for MCQ
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. API Design and Endpoints

All APIs follow a RESTful pattern and live under `app/api/`. Key endpoints:

- **Authentication**:
  - `POST /api/auth/sign-in`: Teacher sign-in (email/password or OAuth).
  - `POST /api/auth/exam-login`: Student login with exam code and name.
- **Exams** (`/api/exams`):
  - `GET /api/exams`: List exams for the current teacher.
  - `POST /api/exams`: Create a new exam.
  - `GET /api/exams/[id]`: Get exam details.
  - `PUT /api/exams/[id]`: Update exam settings.
  - `DELETE /api/exams/[id]`: Remove an exam.
- **Questions** (`/api/exams/[id]/questions`):
  - `GET`: Fetch questions for an exam.
  - `POST`: Add a new question.
  - `PUT /api/questions/[qid]`: Update question text or model answer.
  - `DELETE /api/questions/[qid]`: Delete a question.
- **Exam Session**:
  - `POST /api/exam-session/start`: Verify code, create session.
  - `GET /api/exam-session/[sessionId]`: Check session status.
- **Student Answers** (`/api/submissions`):
  - `POST /api/submissions`: Save or update an answer as the student works.
  - `GET /api/submissions/[sessionId]`: Retrieve all answers for a session.
- **AI Grading**:
  - `POST /api/grade-essay`: Send essay answer and model answer to Gemini API and store the returned score.

These endpoints let the frontend talk to the backend smoothly, keeping UI code simple.

## 5. Hosting Solutions

- **Development**: Docker Compose spins up a local PostgreSQL instance, ensuring every developer uses the same database version.
- **Production**: Vercel hosts Next.js as serverless functions and serves static assets via its global CDN.

Benefits:
- **Reliability**: Vercel automatically retries failed functions and provides uptime SLAs.
- **Scalability**: Functions scale on demand without manual server management.
- **Cost-Effectiveness**: You pay only for actual usage of serverless functions.

## 6. Infrastructure Components

- **Load Balancer / Auto-Scaling**: Handled by Vercel—traffic is routed to the nearest edge location.
- **Content Delivery Network (CDN)**: All static files and frontend pages are served from Vercel’s CDN for fast global performance.
- **Caching**:
  - **HTTP Caching**: Leverage CDN caching headers for infrequently changing endpoints (e.g., `/api/exams/[id]/questions`).
  - **In-Process Caching**: Use Next.js ISR (Incremental Static Regeneration) where appropriate.
- **Containerization**: Docker ensures consistent environments locally and can be extended for staging.

Together, these components keep the user experience fast and resilient under load.

## 7. Security Measures

- **Authentication & Authorization**:
  - **Better Auth**: Manages sessions and secure cookies for teachers.
  - **Custom Exam Code Flow**: Temporary student sessions that expire after the exam.
  - **Role-Based Access**: Middleware checks user role (teacher vs. student) before allowing protected routes.
- **Data Encryption**:
  - **In Transit**: HTTPS everywhere (Vercel TLS).
  - **At Rest**: PostgreSQL encryption where supported by your cloud provider.
- **Input Validation**:
  - **Zod Schemas**: Validate every API request body to prevent invalid or malicious data.
- **Secrets Management**:
  - Store database URLs and API keys (Gemini) in Vercel Environment Variables, never in source code.
- **Error Handling**:
  - Return generic error messages to clients, log detailed errors internally.

These steps protect user data, maintain exam integrity, and ensure compliance.

## 8. Monitoring and Maintenance

- **Monitoring Tools**:
  - **Vercel Dashboard**: Tracks function invocations, error rates, and build logs.
  - **Sentry or LogRocket** (optional): Capture runtime errors and performance bottlenecks.
- **Database Health**:
  - Scheduled backups of PostgreSQL.
  - Periodic vacuuming and indexing to keep queries fast.
- **Alerts**:
  - Email or Slack notifications for high error rates or downtime.
- **Maintenance**:
  - **Automated Migrations**: Drizzle migration scripts run on deploy.
  - **Dependency Updates**: Regularly update Next.js, Drizzle, and other libraries to patch vulnerabilities.

By combining these practices, the backend remains healthy, performant, and ready for growth.

## 9. Conclusion and Overall Backend Summary

In summary, the `codeguide-exam-portal` backend is a modern, serverless-driven setup that leverages Next.js API routes, PostgreSQL with Drizzle ORM, and Better Auth for security. It’s deployed effortlessly on Vercel, scales automatically, and uses straightforward RESTful endpoints to power an online exam platform. Key highlights:

- Clear separation of business logic, data access, and routing layers.
- Type-safe database operations that minimize runtime errors.
- Automatic scaling and global delivery via serverless functions and CDN.
- Robust security, including role-based access and data validation.
- Built-in monitoring and maintenance workflows to keep the system reliable.

This backend structure provides a rock-solid foundation for building feature-rich, secure, and scalable online exams for both teachers and students.
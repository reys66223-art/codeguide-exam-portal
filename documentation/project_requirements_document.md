# Project Requirements Document (PRD)

## 1. Project Overview

The **codeguide-exam-portal** is a full-stack web application designed as a modern online exam and practice platform for schools. It provides teachers with a secure, easy-to-use dashboard to create, manage, and monitor exams, and students with an intuitive interface to take timed quizzes and essay questions. By automating exam delivery and grading through AI integration, this platform solves the common problems of manual test administration, inconsistent scoring, and limited real-time visibility into student progress.

This system is being built to support remote and in-class assessments with strong role-based access control, responsive design, and automated essay scoring using the Gemini AI API. Key objectives include:  
- Enabling teachers to set up exams with customizable codes, durations, and question types.  
- Allowing students to log in via exam codes and complete assessments in a protected environment.  
- Automating essay grading to reduce manual workload and improve grading consistency.  
- Providing real-time monitoring so instructors can track student activity and intervene if needed.  

Success will be measured by the platform’s stability under load, the accuracy and fairness of AI-driven scoring, seamless user experiences for both roles, and deployment without major security or performance incidents.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1)
- Dual authentication flows: email/OAuth for teachers; code+name for students  
- Role-based dashboards: teacher dashboard and student exam interface  
- Exam and question management (CRUD) for multiple-choice and essay questions  
- Unique exam code generation and student session tracking  
- Timed exam interface with persistent countdown timer and auto-save  
- Real-time monitoring dashboard via polling or WebSockets  
- AI-powered essay scoring using Gemini API integration  
- Result aggregation and final score display to both teachers and students  
- Responsive UI with light/dark mode, built on React, Tailwind CSS, Shadcn UI  
- Data storage in PostgreSQL via Drizzle ORM; migrations for schema management  
- Containerized local development (Docker) and Vercel deployment for production  

### Out-of-Scope (Phase 1)
- Mobile-only native apps (iOS/Android)  
- Offline exam mode or local caching beyond auto-save  
- Video-proctoring or biometric authentication  
- Payment or subscription management  
- Advanced analytics or learning-style recommendations  
- Multi-language or localization support beyond English  
- Third-party integrations (e.g., Zoom, Google Classroom)  

Future phases may explore these items based on user feedback and adoption.

## 3. User Flow

A teacher logs in via email/password or OAuth and lands on the **Teacher Dashboard**. From there, they click “Create Exam,” fill in the title, duration, and generate a unique code. They proceed to add multiple-choice and essay questions through clear forms, set correct answers or model responses, and publish the exam. Once an exam goes live, teachers navigate to the real-time monitoring page, where they see each student’s status, elapsed time, and answer submission indicators. After the exam ends, teachers view a consolidated results page with AI-scored essays and multiple-choice metrics, and can download or export reports.

A student visits the portal’s **Exam Login** page, enters the provided exam code, and submits their name (and optional DOB). On success, they’re redirected to the **Exam Interface**—a clean layout showing question navigation on the left, the active question on the right, and a persistent timer at the top. Answers auto-save every 30 seconds. For essay questions, once a student submits their text, the system calls the AI grading endpoint in the background. When the time expires or the student clicks “Finish,” they see a **Results Page** summarizing their score, detailed essay feedback, and any teacher comments.

## 4. Core Features

- **Authentication & RBAC**: Teacher login (email/OAuth) and student login (exam code + name); middleware protects routes by role.  
- **Exam Management**: Full CRUD for exams (title, duration, code), questions (type, text, options, model answer).  
- **Student Session Handling**: Exam code validation, session creation, status tracking in `exam_sessions`.  
- **Timed Exam Interface**: Countdown timer, question navigation, auto-save via API calls.  
- **Auto-Save & Recovery**: Periodic saving of student answers and session state to prevent data loss.  
- **Real-Time Monitoring**: Polling or WebSocket updates of student progress, login status, and timer.  
- **AI Essay Scoring**: Backend module (`lib/gemini.ts`) sends prompts to Gemini API and returns structured scores.  
- **Results Aggregation**: Combine multiple-choice and essay scores; display charts or tables via `ResultsChart` component.  
- **Responsive Theming**: Light/dark mode, accessible component library with Tailwind CSS & Shadcn UI.  
- **Data Layer**: PostgreSQL with Drizzle ORM schemas (`users`, `exams`, `questions`, `choices`, `student_answers`, `exam_sessions`).  
- **Deployment & DevOps**: Docker for local DB, Vercel for serverless API and frontend hosting, CI/CD pipeline hooks.  

## 5. Tech Stack & Tools

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn UI; state management via React Context or Zustand.  
- Backend & API: Next.js API Routes, Node.js, TypeScript; authentication via Better Auth adapter.  
- Database: PostgreSQL; schema definitions and migrations via Drizzle ORM; data validation with Zod.  
- AI Integration: Gemini API for essay scoring, encapsulated in `lib/gemini.ts`.  
- Authentication: Better Auth (adapter-based) extended for code-based student access; JWT sessions.  
- Dev Tools: Docker (PostgreSQL container), Vercel deployment; IDE integrations (e.g., VS Code + GitHub Copilot).  
- Testing: Vitest or Jest for unit/integration tests; Playwright or Cypress for end-to-end flows.  

## 6. Non-Functional Requirements

- **Performance**: API responses under 300ms for common endpoints; page load under 1s on 3G mobile.  
- **Security**: TLS everywhere, encrypted credentials at rest, RBAC enforcement, input validation (Zod), CSRF/XSS protection.  
- **Scalability**: Horizontal scaling for API routes; database connection pooling; stateless serverless functions.  
- **Reliability**: 99.9% uptime; automated retries for AI calls; graceful error handling on network issues.  
- **Accessibility**: WCAG 2.1 AA compliance; keyboard navigation; ARIA roles on custom components.  
- **Compliance**: GDPR-ready (data consent, user data deletion), secure storage of personal info.  

## 7. Constraints & Assumptions

- **Gemini API Availability**: Essay grading depends on consistent access to Gemini; fallback scoring not in V1.  
- **Internet Connectivity**: Students require stable connections; auto-save mitigates brief drops but no offline mode.  
- **Browser Support**: Modern evergreen browsers; legacy IE11 not supported.  
- **Team Expertise**: Assumes familiarity with Next.js App Router, TypeScript, Drizzle, and AI integration patterns.  
- **Hosting Environment**: Vercel for production; local Docker for development.  

## 8. Known Issues & Potential Pitfalls

- **AI Rate Limits**: Gemini API quotas could throttle grading. Mitigation: batch essay scoring during off-peak times or implement retry backoff.  
- **Auto-Save Conflicts**: Rapid answer changes may cause race conditions. Mitigation: debounce saves and include versioning in payload.  
- **Real-Time Load**: High student counts may overload polling. Mitigation: consider WebSockets or server-sent events in Phase 2.  
- **Schema Migrations**: Adding new columns to production DB requires careful migration scripts. Use Drizzle’s migration tool and backup strategies.  
- **Network Failures**: Student mid-exam disconnects could lose progress. Mitigation: local state cache and prompt re-login flow.  

---

This PRD provides a clear, unambiguous blueprint. It covers the core functionality, user journeys, technical stack, and key constraints so that subsequent technical documents can be generated without assumptions or missing details.
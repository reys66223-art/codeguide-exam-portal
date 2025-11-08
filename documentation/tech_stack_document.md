# Tech Stack Document for codeguide-exam-portal

This document explains the technology choices behind the `codeguide-exam-portal` starter template in simple, everyday language. You’ll learn what each tool does, why we picked it, and how it fits into the big picture.

## Frontend Technologies

These are the tools that power everything you see and interact with in the browser.

• **Next.js (App Router)**
  - A framework built on React that helps structure pages, handle routing, and render content on both the server and the browser.  
  - Makes it simple to create distinct areas (e.g., teacher dashboard vs. student exam page) and to protect them behind login screens.  

• **React**
  - A library for building interactive user interfaces using reusable components.  
  - Powers features like question forms, countdown timers, and live updates without full page reloads.  

• **TypeScript**
  - A version of JavaScript with built-in checks so mistakes are caught before you even run the code.  
  - Helps ensure exam logic and data handling are correct, reducing bugs during grading or result display.  

• **Tailwind CSS**
  - A utility-first styling tool that lets you write design rules right alongside your HTML.  
  - Speeds up styling of buttons, forms, layouts, and ensures a consistent look across all pages.  

• **Shadcn UI**
  - A set of prebuilt, accessible React components (buttons, tables, cards, etc.)  
  - Lets you assemble polished interfaces (question lists, monitoring tables, result charts) without building every component from scratch.  

• **Dark/Light Mode Support**
  - Built into the styling, letting users choose the theme they prefer for comfort or accessibility.  

## Backend Technologies

These tools work behind the scenes to authenticate users, store data, and run the logic that powers your exam portal.

• **Next.js API Routes**
  - Lets you create server-side functions (endpoints) right alongside your frontend code.  
  - Handles actions like creating exams, saving answers, and fetching results.  

• **Better Auth**
  - A flexible authentication system ready to handle both teacher sign-in (email/password or Google OAuth) and student code-based login.  
  - Role-Based Access Control (RBAC) ensures teachers and students see only what they’re supposed to see.  

• **Drizzle ORM**
  - A type-safe way to talk to your database from code.  
  - Lets you define your data structure (exams, questions, answers) in TypeScript and keeps data relationships consistent.  

• **PostgreSQL**
  - A reliable, open-source relational database that stores all your exam data—users, questions, submissions, scores, session logs.  

• **Zod**
  - A simple library to check and validate any data coming into your API.  
  - Prevents invalid or malicious data from corrupting your database or breaking your app.  

## Infrastructure and Deployment

These components make sure your application runs reliably, scales with demand, and is easy to update.

• **Docker**
  - Packages your database setup (PostgreSQL) in a container so every developer has the same environment.  
  - Avoids “it works on my machine” issues when moving to production.  

• **Vercel**
  - A hosting platform built for Next.js that automatically deploys your code whenever you push updates.  
  - Provides serverless functions for your API routes, zero-configuration builds, and global edge caching.  

• **Git & GitHub**
  - Version control system and remote repository for tracking changes, collaborating, and rolling back if needed.  

• **CI/CD Pipeline** (e.g., GitHub Actions or Vercel’s built-in pipeline)  
  - Automatically runs tests, builds your app, and deploys it when changes are merged to your main branch.  
  - Ensures new features and fixes are deployed quickly, without manual steps.  

## Third-Party Integrations

These external services add specialized features without reinventing the wheel.

• **Gemini AI**  
  - Used for automated essay scoring.  
  - Our `lib/gemini.ts` module sends student essays and teacher model answers to the AI, receives a score based on your rubric, and saves it back to the database.  

• **OAuth Providers (e.g., Google)**  
  - Teachers can log in using their Gmail accounts, speeding up signup and reducing password management.  

## Security and Performance Considerations

These practices keep your app safe and fast.

**Security**
• Role-Based Access Control ensures teachers and students can’t access each other’s areas.  
• Protected Routes in Next.js block unauthorized access to sensitive pages.  
• Zod input validation and thorough error handling prevent malformed or malicious requests.  
• Secure sessions and HTTPS everywhere keep user credentials and exam data safe in transit.  

**Performance**
• Server-Side Rendering and edge caching (via Vercel) help pages load quickly for users around the world.  
• Polling or WebSocket connections for the live monitoring dashboard let teachers see student progress in near real time without overwhelming the server.  
• Efficient database queries via Drizzle ORM ensure exam data retrieval and submission stay speedy, even under load.  

## Conclusion and Overall Tech Stack Summary

You now have a clear picture of why each technology was chosen and how they work together:

• Frontend: Next.js + React + TypeScript + Tailwind CSS + Shadcn UI for a fast, interactive, and themable user interface.  
• Backend: Next.js API Routes + Better Auth + Drizzle ORM + PostgreSQL + Zod for secure, type-safe, and maintainable data and business logic.  
• Infrastructure: Docker + Vercel + GitHub (CI/CD) for reliable development, collaboration, and automated deployments.  
• Integrations: Gemini AI for essay scoring and Google OAuth for seamless teacher login.  

Together, these tools deliver a modern, secure, and scalable online exam platform that’s easy to develop, maintain, and extend. You can confidently build features like teacher dashboards, real-time monitoring, student exam flows, and AI-powered grading on top of this solid foundation.
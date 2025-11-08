# Frontend Guideline Document

This document explains how the frontend of the `codeguide-exam-portal` is built. It covers the architecture, design rules, styling, components, routing, performance tips, testing methods, and more. By following these guidelines, anyone—from new developers to non-technical stakeholders—will understand how the application works and how to extend it safely.

## 1. Frontend Architecture

**Frameworks and Libraries**
- **Next.js (App Router)**: Organizes pages, layouts, and API routes in a single directory structure. It supports both server-side rendering (SSR) and static generation (SSG).  
- **React**: Drives all interactive parts of the UI with components and hooks.  
- **TypeScript**: Adds type safety for props, state, and API responses, reducing runtime errors.  
- **Tailwind CSS**: Provides utility classes for rapid styling without leaving your HTML/JSX.  
- **Shadcn UI**: A set of pre-built, accessible React components styled with Tailwind.  

**How This Supports Key Goals**
- **Scalability**: Modules are grouped by feature (`app/dashboard`, `app/exam`, custom `components/` folders), so new pages and components slot in cleanly.  
- **Maintainability**: TypeScript and clear folder conventions mean it’s easy to find and update code.  
- **Performance**: Next.js automatic code splitting, server rendering, and caching ensure pages load quickly.

## 2. Design Principles

1. **Usability**:  
   - Simple, intuitive flows for teachers (dashboard) and students (exam interface).  
   - Clear calls to action: buttons and links follow a predictable style.  

2. **Accessibility**:  
   - All interactive elements (buttons, inputs) meet contrast and keyboard-navigation standards.  
   - Semantic HTML and ARIA attributes are used in form fields, modals, and tables.  

3. **Responsiveness**:  
   - Layouts adapt smoothly from mobile to desktop using Tailwind’s breakpoint utilities.  

4. **Consistency**:  
   - Reusable design tokens (colors, spacing, typography) ensure every screen feels like part of the same product.

## 3. Styling and Theming

**Styling Approach**
- **Utility-First with Tailwind CSS**: Write classes directly in JSX (`className="p-4 bg-primary text-white"`) to keep styles co-located with markup.  
- **Shadcn UI Components**: Wrap Radix primitives for buttons, inputs, dialogs, and more, so you never have to reinvent basic UI.

**Theming**
- Light and dark themes are built in. Tailwind’s `dark:` variants switch colors based on a CSS class (`<html class="dark">`).  
- Theme preference is stored in `localStorage` and controlled via a React Context (`ThemeContext`).

**Visual Style**
- Overall look: **Flat and modern** with subtle shadows and rounded corners.  
- Glassmorphism is **not** used—focus on clarity and simplicity.

**Color Palette**
| Token         | Light Hex | Dark Hex  | Usage                  |
|---------------|-----------|-----------|------------------------|
| `--color-bg`  | #FFFFFF   | #1F2937   | Page background        |
| `--color-fg`  | #111827   | #F9FAFB   | Main text              |
| `--color-primary` | #3B82F6 | #60A5FA | Buttons, links         |
| `--color-secondary` | #10B981 | #34D399 | Success messages, badges |
| `--color-accent` | #F59E0B | #FBBF24 | Warnings, highlights    |
| `--color-error` | #EF4444 | #F87171  | Errors, alerts         |

**Typography**
- **Font Family**: Inter, sans-serif (loaded via Google Fonts).  
- **Scale**:  
  - Headings: 2rem, 1.5rem, 1.25rem  
  - Body: 1rem, with line-height 1.5

## 4. Component Structure

**Organization**
- `components/ui/`: Base UI primitives from Shadcn UI (Button, Input, Modal).  
- `components/dashboard/`: Teacher-facing pieces (ExamCard, MonitoringTable).  
- `components/exam/`: Student-focused components (QuestionForm, ExamTimer, NavigationDots).  

**Reusability**
- Components are designed to be **stateless** where possible. Data and callbacks are passed via props.  
- Shared styles and logic live in utility hooks (e.g., `useTheme`, `useCountdown`).

**Benefits**
- **Clear APIs**: Props definitions in TypeScript reveal exactly what data each component needs.  
- **Easier Testing**: Small, isolated components are straightforward to test.

## 5. State Management

**Local State**
- Handled with React’s `useState` and `useReducer` inside client components for UI controls (form inputs, toggles).  

**Global State**
- **React Context**: Used for theme mode and authentication/session info.  
- **Server Data**: Fetched via Next.js server functions (`fetch` inside `getServerSideProps` or in Server Components). Data is passed down to client components as props.  

*(Optional)* For complex caching and mutation handling (e.g., saving answers live), consider **TanStack Query**.

## 6. Routing and Navigation

**Next.js App Router**
- **Layouts**: `app/layout.tsx` defines global wrappers (header, footer).  
- **Nested Layouts**: `app/dashboard/layout.tsx` and `app/exam/layout.tsx` provide sidebars and context specific to each area.  
- **Dynamic Routes**:  
  - `/dashboard/exams/[id]/monitor` for teacher monitoring  
  - `/exam/[code]` for student exam sessions

**Navigation**
- Use `next/link` for internal links, which prefetches pages in the background for speed.  
- Protected routes rely on a middleware check in `middleware.ts` that reads auth cookies/tokens. Unauthorized users get redirected to login.

## 7. Performance Optimization

1. **Code Splitting**: Next.js automatically splits code per page. For extra heavy components (e.g., chart library), use dynamic imports:  
   ```js
   const ResultsChart = dynamic(() => import('components/dashboard/ResultsChart'), { ssr: false })
   ```
2. **Image Optimization**: Use Next.js `<Image>` for built-in lazy loading and resizing.  
3. **Caching & Revalidation**:  
   - Server Data: Leverage `revalidate` in `getStaticProps` or `Cache-Control` headers in API routes.  
   - Browser Assets: Long-lived cache headers for JS/CSS bundles.
4. **Minimize Unused CSS**: Tailwind’s purge step removes unused classes in production builds.
5. **Avoid Over-Rendering**: Memoize expensive components with `React.memo` or `useMemo` when props rarely change.

## 8. Testing and Quality Assurance

**Unit Tests**
- **Vitest** or **Jest** + **React Testing Library** for:  
  - Form validation logic (e.g., exam code entry).  
  - Countdown timer behaviors.  
  - Utility hooks (`useTheme`, `useCountdown`).

**Integration Tests**
- Test API routes in isolation against a test database (e.g., Drizzle ORM + SQLite in memory).  
- Validate that API endpoints create and fetch exam data correctly.

**End-to-End Tests**
- **Playwright** or **Cypress** to simulate full journeys:  
  - Teacher logs in, creates an exam, shares code.  
  - Student enters code, answers questions, submits, and views results.

**Linters and Formatters**
- **ESLint** with TypeScript rules and Tailwind plugin.  
- **Prettier** for consistent code formatting.  

**Validation**
- **Zod** schemas in API routes to validate incoming data (exam creation, answer submission) and guard against bad input.

## 9. Conclusion and Overall Frontend Summary

This frontend uses the latest tools—Next.js, React, TypeScript, Tailwind, and Shadcn UI—to deliver a fast, accessible, and maintainable exam portal. Its modular architecture makes it easy to extend with new features. Design principles like usability, accessibility, and responsiveness guide every UI decision. Performance optimizations and robust testing practices ensure that both teachers and students enjoy a smooth, reliable experience. By following these guidelines, your team can confidently build, maintain, and evolve the exam platform to meet future needs.
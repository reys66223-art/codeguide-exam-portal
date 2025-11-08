# Security Guidelines for `codeguide-exam-portal`

This document provides security best practices tailored to the `codeguide-exam-portal` project. It is designed to ensure a resilient, trustworthy, and secure online exam platform from design through deployment.

---

## 1. Security by Design

- **Embed security early:** Incorporate threat modeling and risk assessment in every sprint or feature design.  
- **Least privilege:** Grant each service, API route, and database user only the minimal permissions required.  
- **Defense in depth:** Layer controls (firewalls, authentication, input validation, rate limiting) so that if one fails, others protect the system.

## 2. Authentication & Access Control

### 2.1 Robust Authentication

- Use **Better Auth** for teacher accounts with strong password policies:  
  - Minimum length 12 characters, complexity rules (upper, lower, digits, symbols).  
  - Enforce account lockouts after repeated failed attempts.  
- For students, implement code-based sessions with:  
  - Unique, non-guessable exam codes (at least 8 alphanumeric characters).  
  - Verification of student identity attributes (name, DOB) before session creation.

### 2.2 Session Management

- Generate cryptographically secure session tokens.  
- Store sessions server-side (or in encrypted, HttpOnly cookies) with `Secure` and `SameSite=Strict` attributes.  
- Enforce idle and absolute timeouts; require re-authentication for long sessions.

### 2.3 Role-Based Access Control (RBAC)

- Define clear roles (`teacher`, `student`).  
- Implement middleware in Next.js (`middleware.ts`) to enforce route protection:  
  - `/dashboard/**` only for `teacher` role.  
  - `/exam/**` only for active `student` sessions matching exam code.

## 3. Input Handling & Processing

- **Server-side validation:** Use a schema validation library (e.g., Zod) on all API routes before business logic.  
- **Prevent injection:** Always use parameterized queries or Drizzle ORM methods for database interactions. Never concatenate SQL strings.  
- **Sanitize user input:** Strip or encode HTML in any rich-text fields (e.g., essay submissions) to prevent XSS.  
- **Validate redirects:** Maintain an allow-list of valid redirect URLs to avoid open-redirect attacks.

## 4. Data Protection & Privacy

### 4.1 Data in Transit & at Rest

- Enforce HTTPS (TLS 1.2+) for all client–server communication.  
- Configure `Strict-Transport-Security` header with `max-age` and `includeSubDomains`.

### 4.2 Secrets Management

- Store secrets (database credentials, Gemini API keys) in a managed vault or in Vercel’s encrypted environment variables.  
- Never commit secrets to source control or plaintext `.env` files.

### 4.3 Encryption & Hashing

- Hash teacher passwords using **bcrypt** or **Argon2** with unique salts.  
- If storing PII (names, DOB), consider field-level encryption in PostgreSQL or encrypt in application code using AES-256.

### 4.4 Privacy & Data Retention

- Only collect necessary PII.  
- Implement data retention policies: purge exam session logs after a set period or upon request.  
- Mask or redact sensitive data in logs and error messages.

## 5. API & Service Security

- **Rate limiting & throttling:** Apply rate limits on critical endpoints (`/api/login`, `/api/grade-essay`) to mitigate brute-force and abuse.  
- **CORS:** Restrict allowed origins in `next.config.js` to trusted domains.  
- **HTTP methods:** Enforce proper verbs (GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletions).  
- **Versioning:** Prefix API routes with `/api/v1/` to support safe iteration.

## 6. Web Application Security Hygiene

- **CSRF protection:** Use anti-CSRF tokens for state-changing requests.  
- **Security headers:** Configure in Next.js custom server or via middleware:  
  - `Content-Security-Policy` limiting script sources and preventing inline scripts.  
  - `X-Frame-Options: DENY` to prevent clickjacking.  
  - `X-Content-Type-Options: nosniff`.

- **Secure cookies:** All cookies must have `HttpOnly`, `Secure`, `SameSite=Strict`.  
- **Subresource Integrity:** For any third-party CDN assets, include SRI hashes.

## 7. Infrastructure & Configuration Management

- **Docker security:**  
  - Use official, minimal base images.  
  - Run database container as non-root user.  
- **Hardened server config:**  
  - Close unused ports.  
  - Disable default admin interfaces on production.  
- **TLS configuration:**  
  - Use strong cipher suites only.  
  - Disable SSLv3, TLS 1.0, 1.1.

## 8. Dependency Management

- Maintain `package-lock.json` to lock dependency versions.  
- Use automated SCA tools (e.g., Dependabot, Snyk) to detect and patch vulnerable libraries.  
- Review and vet new dependencies for maintenance status and security posture.

## 9. DevOps & CI/CD Security

- **CI/CD pipeline:**  
  - Run security linting and SAST (e.g., ESLint with security plugin).  
  - Fail builds on critical vulnerabilities.  
- **Environment segregation:**  
  - Use separate environments (dev, staging, prod) with distinct credentials.  
- **Secrets in pipeline:**  
  - Inject secrets at runtime from the vault, never store in CI logs.

---

By adhering to these guidelines, the `codeguide-exam-portal` will maintain a strong security posture, protect sensitive user data, and ensure reliability under real-world conditions.
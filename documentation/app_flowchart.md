flowchart TD
  A[User visits portal] --> B{User is teacher}
  B -->|Yes| C[Teacher signs in via email oauth]
  B -->|No| D[Student enters exam code]
  D --> E[Validate exam code]
  E -->|Valid| F[Create session redirect to exam]
  E -->|Invalid| G[Show error message]
  C --> H[Teacher dashboard]
  H --> I[Create exam questions]
  I --> J[Generate exam code]
  H --> K[Monitor student sessions real time]
  F --> L[Load exam questions]
  L --> M[Answer questions]
  M --> N{Question type}
  N -->|MCQ| O[Save answer]
  N -->|Essay| P[Call AI essay grading]
  P --> Q[Save AI score]
  O --> R[Periodic save submissions]
  Q --> R
  R --> S[Submit exam]
  S --> T[Compute final score]
  T --> U[Show results]
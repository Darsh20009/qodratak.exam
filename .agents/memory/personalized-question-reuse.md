---
name: Personalized question reuse and scale
description: Student question selection must preserve mastery, retry evidence, and high-volume behavior.
---

Keep a student's question progress on the server and key each state to the question's immutable database identity. Once a student answers correctly, do not present that question again. Prefer unseen questions; return missed or skipped questions for review when fresh questions are insufficient. If every available question is mastered, do not silently repeat mastered questions.

**Why:** the user explicitly requested a per-student question library with correct answers retired, missed answers retried, and capacity for 100,000 active students and 30,000 institutions.

**How to apply:** route all Qudrat exam formats through the same server-owned selection and verified-outcome flow. Keep per-test reads bounded and indexed; require a real load test before claiming the stated capacity is proven.

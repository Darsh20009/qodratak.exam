---
name: Personalized question reuse and scale
description: Student question selection must preserve mastery, retry evidence, and high-volume behavior.
---

Keep a student's question progress on the server and key each state to the question's immutable database identity. In regular practice, retire correctly answered questions; prefer unseen questions and return missed or skipped questions when fresh questions are insufficient. A full Qiyas simulation may use mastered questions only as a last resort after unseen and review pools are exhausted, and only from the approved bank without duplicates. Approval status alone does not make a question exam-eligible: server selection and client preflight must require the same valid four-choice shape and answer key.

**Why:** the user explicitly requested a per-student question library with correct answers retired, missed answers retried, and capacity for 100,000 active students and 30,000 institutions. They also need full simulated exams to remain startable after substantial practice. Approved verbal records with fewer than four choices were selected by the API and discarded by the exam client, producing a false shortage despite ample eligible questions.

**How to apply:** keep regular practice strict; permit the mastered-question fallback only for full exam-section selection, never for unreviewed keys. Keep server selection, availability counts, and client preflight aligned on question validity; do not invent missing options—review them against their source. Keep selection server-owned and per-test reads bounded and indexed; require a real load test before claiming the stated capacity is proven.

---
name: Unified learning attempts
description: Durable rules for trusted per-question learning recording across Qudrat and Tahsili.
---

The trusted learning record must be created from a server-owned answer key. A
client aggregate, client correctness flag, or client answer key is not enough
to create a `LearningAttempt`.

**Why:** legacy local-storage and mock question flows can display answers
without giving the server a verifiable source. Recording those as trusted
performance would corrupt observed metrics and make later phases rely on
unverified data.

**How to apply:** use `recordVerifiedLearningAttempt`, identify a question by
`sourceType + sourceKey + questionId`, and give each real retry a new
idempotency key. Keep compatibility aggregates separate from per-question
attempt truth.

For assessments with many question records, persist only answered items and
process them with modest bounded concurrency rather than serial writes or an
unbounded fan-out.

**Why:** Serial per-question learning writes can exceed the HTTP request timeout
and prevent the student from receiving the result and review; unlimited
parallel writes can overload the database.

**How to apply:** Keep each answer's learning record idempotent, skip unanswered
items, and process the remaining records in small batches before saving the
final assessment result.
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
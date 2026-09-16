# Phase 05 — Unified Learning Attempts

## Scope

Phase 05 records each real educational question attempt in `LearningAttempt`.
`TestResult`, `ErrorLog`, `DailyProgress`, and `ActivityLog` remain compatibility
and aggregate records; they are not the source of truth for per-question
correctness.

This phase records observed performance only. It does not start error detection,
error taxonomy, mastery, recommendations, a new diagnostic engine, adaptive
learning, or spaced repetition.

## Server contract

Every trusted adapter calls `recordVerifiedLearningAttempt`. The adapter may
provide a server-held answer snapshot for legacy JSON exams, but it never sends
`isCorrect` or `correctAnswer` as a client-authoritative value.

The service:

- resolves the question and answer key on the server;
- validates the selected option against the server option count;
- treats `null` as unanswered, not as wrong;
- derives `isCorrect` from the selected option and answer key;
- validates approved `programId` and optional `subjectId`;
- validates non-negative `responseTime` and an optional active `LearningSession`;
- updates only observed performance counters;
- appends the compatible `ActivityLog` event;
- assigns `attemptNumber` per student and `(sourceType, sourceKey, questionId)`.

The source identity is the JSON tuple:

```text
[sourceType, sourceKey, questionId]
```

`questionId` alone is intentionally not an identity. The same question can
appear in a different test, imported source, or legacy exam.

## Duplicate submission and retry rules

Adapters generate one stable `idempotencyKey` for a submission and suffix it
with the question identity when recording individual questions. Repeating the
same request returns the existing attempt and does not update profile counters
again. Reusing that key for a different source, answer, or session is rejected
with a conflict.

A real retry must use a new idempotency key. It keeps the same source identity
and is stored as a new `LearningAttempt` with the next `attemptNumber`.

The mobile free-test route also stores the completed submission response in its
server session, so replaying the completed request does not create a second
aggregate result.

## Connected adapters

### Qudrat

- Mobile free test: starts a `LearningSession`, records every question,
  including unanswered questions, and uses the stored server question key.
- Verbal, quantitative, sectioned, and question-bank runners: send the
  question-level answer list to `/api/test-results`; the route regrades through
  the trusted service before creating the aggregate result.

### Foundation

- Foundation lesson quiz records verified attempts before writing `TestResult`.
- Foundation diagnostic records verified attempts with the selected approved
  program and subject.

### Tahsili file exams

The exam-start route stores the answer snapshot in the authenticated server
session and returns a learning-attempt id. The browser submits only question
ids and selected options. The submit route grades from the session snapshot,
records `legacy_json` attempts, and returns an idempotent aggregate result.

### WhatsApp

WhatsApp answers use the server question document and the inbound message id
as part of the idempotency key. The message id is stored with the answer so a
replayed webhook cannot create another attempt.

## Intentionally not adapted in Phase 05

Any route that receives only a client aggregate or a client-supplied answer
key is not allowed to manufacture trusted `LearningAttempt` records. This
includes legacy local-storage or mock question flows that do not have a
server-owned question snapshot. Such flows must first receive a dedicated
server-issued question session in a later change.

No Phase 06 behavior is included.
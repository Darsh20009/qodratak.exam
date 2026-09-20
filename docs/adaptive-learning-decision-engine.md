# Adaptive Learning Decision Engine — Phase 15

## Purpose

Phase 15 adds one deterministic decision layer that answers:

> ما الخطوة التعليمية المناسبة الآن؟

It reads existing diagnostic, attempt, error-evidence, mastery, retention, and availability signals. It does not create questions or lessons, write attempts, update mastery, or update review intervals.

The calculation version is `phase-15-v1`.

## Decision model

The public decision contains only:

- `decision`
- `reasonCode`
- human-readable `reason`
- decision `confidence` (`LOW`, `MEDIUM`, `HIGH`)
- basic `scope` (program/subject)
- `nextAction` mappings for the existing recommendation, session, and question-selection contracts
- diagnostic state and calculation version

Internal error records, review priorities, mastery calculations, retention intervals, and availability queries are not returned.

Supported decisions:

- `DIAGNOSTIC`
- `LEARN`
- `PRACTICE`
- `CORRECT`
- `SIMILAR`
- `REVIEW`
- `RECOVERY`
- `MASTERY_CHECK`
- `ADVANCE`
- `NO_ACTIONABLE_CONTENT`

`CORRECT` and `SIMILAR` are contract-compatible action types for future session evidence. The current deterministic rules select `LEARN`, `PRACTICE`, `REVIEW`, `RECOVERY`, `MASTERY_CHECK`, `ADVANCE`, or the explicit no-action fallback.

## Inputs

The server loads:

- diagnostic state from `studentDiagnosticService`
- answered attempts from `LearningAttempt`
- error evidence from `LearningErrorEvidence`
- mastery records from `StudentMastery`
- due review records from `LearningReviewItem`
- published `FoundationContent`
- valid question availability from the existing Qudrat/Tahsili question stores
- approved program and subject nodes from the mastery taxonomy registry

The student identity always comes from the authenticated session. Program and subject are optional filters, not alternate student identities.

## Rules and priority

Rules are evaluated per approved program/subject scope. A deterministic rank resolves multiple scopes:

1. `NEW` → `DIAGNOSTIC`
2. `INSUFFICIENT_DATA` → `DIAGNOSTIC`
3. overdue review → `REVIEW`
4. due review → `REVIEW`
5. repeated trusted conceptual errors → `LEARN`, then practice fallback
6. procedural error evidence → `PRACTICE`
7. emerging/developing or low mastery → `LEARN`, then practice fallback
8. proficient near-mastery with non-high confidence → `MASTERY_CHECK`
9. mastered with high confidence and no due review → `ADVANCE`
10. otherwise use valid practice, or `NO_ACTIONABLE_CONTENT`

Returning students use `RECOVERY` when no stronger review or repeated conceptual evidence exists. The engine never resets or rewrites old mastery.

## Reason codes

The current reason codes are:

`NEW_STUDENT`, `INSUFFICIENT_DATA`, `RETURNING_AFTER_GAP`, `REPEATED_CONCEPT_ERROR`, `RECENT_FAILURE`, `LOW_MASTERY`, `DUE_REVIEW`, `OVERDUE_REVIEW`, `NEAR_MASTERY`, `MASTERED_STABLE`, `ADVANCE_READY`, `CONTENT_UNAVAILABLE`, `PRACTICE_AVAILABLE`, `PRACTICE_UNAVAILABLE`, `MASTERY_CHECK_READY`, and `DIAGNOSTIC_REQUIRED`.

They describe observed evidence or an availability condition. They do not describe personality, ability, or psychological traits.

## Confidence

Decision confidence is separate from:

- mastery confidence
- retention confidence
- recommendation confidence
- diagnostic data confidence

It is a qualitative evidence label, not a probability. Repeated high-confidence evidence and stable mastered evidence can produce `HIGH`; new or insufficient evidence produces `LOW`/`MEDIUM`.

## Fallbacks

- `LEARN` without published foundation content falls back to `PRACTICE` when a valid question exists.
- `PRACTICE` without a valid question returns `NO_ACTIONABLE_CONTENT`.
- near-mastery without a valid question returns `NO_ACTIONABLE_CONTENT`.
- unapproved deep taxonomy is not accepted as a requested subject scope.
- no random, external, or unapproved content is substituted.

## Responsibility boundaries

- Adaptive Decision Engine: decides what is needed now.
- Recommendation Engine: turns its own evidence into recommendation records.
- Today's Session Engine: turns an existing recommendation into a session plan.
- Question Selection: chooses an eligible question for a session step.
- Spaced Repetition: owns `LearningReviewItem` state and interval updates.
- Mastery: owns mastery calculation and persistence.

The new API does not call a write path. `GET` is read-only.

## API

Authenticated students can call:

`GET /api/learning/adaptive/decision`

Optional filters:

- `programId=qudrat|tahsili`
- `subjectId=subject.qudrat.verbal` (approved subject scope)

The endpoint returns `401` without a session and derives the student from the session. Invalid filters return `400`.

## Integration mappings

`nextAction.recommendationType` maps decisions to the existing recommendation contract:

- `DIAGNOSTIC` → `DIAGNOSTIC`
- `LEARN` → `LEARN`
- `PRACTICE`/`SIMILAR` → `PRACTICE`
- `REVIEW` → `REVIEW`
- `RECOVERY` → `RECOVERY_CHECK`
- `MASTERY_CHECK` → `MASTERY_CHECK`

`nextAction.questionActivity` maps to the existing question-selection activity without selecting or creating a question. Session creation remains owned by the existing Today's Session Engine.

## Limitations

- Phase 15 does not persist an adaptive decision history.
- Content/question availability is a current availability check, not a guarantee that a later session selection will find a specific item.
- Deep taxonomy remains limited to approved registry nodes.
- No ML, LLM, OCR, chatbot, gamification, notifications, calendar, UI overhaul, historical-attempt mutation, or historical-mastery mutation is included.
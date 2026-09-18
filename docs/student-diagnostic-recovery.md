# Student Diagnostic & Recovery Engine (Phase 08)

## Purpose

Phase 08 answers one question:

> What do we still need to know about this student?

It does not choose a lesson, training question, daily plan, or learning
priority. The output is a server-side decision about data availability and the
scope of evidence that may be needed later.

The engine reads current records and does not write diagnostic history, reset
mastery, delete attempts, rewrite error evidence, bulk-classify students, or
start a diagnostic automatically.

## Diagnostic states

The state describes data availability, not student ability:

- `NEW`: no reliable learning data is available.
- `INSUFFICIENT_DATA`: some activity exists, but the evidence is not broad,
  recent, or trusted enough for a reliable decision.
- `ACTIVE`: the student has enough recent evidence, approved taxonomy coverage,
  and non-low mastery confidence for the requested scope.
- `RETURNING`: previous activity exists, but the latest activity is outside the
  30-day recent window. This does not erase or downgrade historical mastery.

The state and `dataConfidence` are separate from `StudentMastery.confidence`.
`dataConfidence` describes the sufficiency of the overall diagnostic input;
mastery confidence describes an individual mastery estimate.

## Diagnostic modes

- `NONE`: current data is sufficient; no diagnostic is required.
- `FULL`: used for a new student. The output identifies approved Program
  scopes; it does not create or select questions.
- `TARGETED`: used when evidence is partial. The output identifies approved
  Subject scopes with weak or missing coverage.
- `RECOVERY`: used after an inactivity gap. The output identifies previously
  active approved Subject scopes for a short future recovery check.

## Data sufficiency

The decision combines multiple signals rather than one magic counter:

- answered `LearningAttempt` count;
- answered attempts in the recent 30-day window;
- approved Subject coverage;
- approved taxonomy coverage;
- `StudentMastery` confidence;
- error evidence count and recent error evidence;
- last attempt, evidence, session, and legacy profile activity;
- legacy diagnostic/test history.

The current active thresholds are deliberately conservative:

- at least 6 answered attempts;
- at least 3 answered attempts in the recent window;
- coverage for every approved Subject in the requested Program scope;
- non-low mastery confidence;
- no inactivity gap beyond 30 days.

These thresholds are implementation policy, not a claim about ability. The
decision remains `INSUFFICIENT_DATA` when the student has enough evidence in
Qudrat Quantitative but no evidence in Qudrat Verbal, and the scope becomes the
missing Subject rather than the whole Program.

`dataConfidence` is:

- `LOW` when too few sufficiency dimensions are present;
- `MEDIUM` when several dimensions are present;
- `HIGH` only when all current dimensions are present with at least 12 total
  answered attempts and 5 recent answered attempts.

## Recovery logic

Returning status is based on inactivity, not a destructive mastery reset. A
student may retain a historical `PROFICIENT` or `MASTERED` record while the
diagnostic engine returns:

```text
diagnosticState = RETURNING
diagnosticMode = RECOVERY
reasonCodes = [RETURNED_AFTER_GAP, STALE_EVIDENCE]
```

The future recovery flow can collect current evidence and then recalculate
confidence without rewriting old attempts or deleting old mastery history.

## Scope model

Each scope contains:

- `type`: `PROGRAM`, `SUBJECT`, or reserved `TAXONOMY_NODE`;
- `taxonomyNodeId`;
- `programId`;
- optional `subjectId`;
- scope-level reason codes.

Only formally approved Program and Subject nodes are currently eligible. The
engine never creates a Skill, SubSkill, Concept, prerequisite, or scope from a
raw category/subcategory label.

No question selection happens in this phase. A later question-selection phase
can consume `scopes[]` without changing the diagnostic decision contract.

## Reason codes

The output uses machine-readable codes:

- `NO_LEARNING_DATA`
- `INSUFFICIENT_EVIDENCE`
- `STALE_EVIDENCE`
- `LOW_TAXONOMY_COVERAGE`
- `LOW_MASTERY_CONFIDENCE`
- `RETURNED_AFTER_GAP`
- `SUFFICIENT_RECENT_DATA`

These codes explain the data decision. They are not labels about the student.

## Legacy compatibility

The existing foundation diagnostic remains available at:

- `GET /api/foundation/diagnostic`
- `POST /api/foundation/diagnostic/submit`

Phase 08 does not remove or rewrite that flow. The new decision service reads
`StudentLearningProfile`, legacy `TestResult` history, and current learning
records as compatibility signals. Legacy aggregate test results do not become
trusted per-question evidence, so they cannot make a student `ACTIVE` on their
own.

## Relationship with Mastery

Mastery estimates demonstrated knowledge for an approved node. Diagnostic
recovery estimates whether the available evidence is sufficient and where
uncertainty remains. Diagnostic state must not overwrite mastery score,
mastery level, or historical evidence.

## API

```text
GET /api/learning/diagnostic
GET /api/learning/diagnostic?program=qudrat
GET /api/learning/diagnostic?programId=program.tahsili
```

The endpoint:

- requires an authenticated student session;
- derives `studentId` from the session;
- accepts an optional Program filter only;
- rejects invalid Program values;
- never accepts `studentId`, mastery, confidence, or diagnostic state from the
  client;
- returns the decision, signals, scopes, reason codes, and calculation version.

The output is calculated on the server and is not persisted as a new
diagnostic attempt.

## Deliberate exclusions

Phase 08 does not implement:

- Recommendation Engine;
- lesson or question selection;
- adaptive learning;
- daily sessions or plans;
- spaced repetition;
- textbook workflows;
- AI Tutor or student-facing AI;
- deep taxonomy scopes before formal approval;
- bulk diagnostic execution or historical mutation.

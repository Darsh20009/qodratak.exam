# Today's Learning Session Engine (Phase 10)

## Purpose

Phase 09 answers **what the student needs** with a
`LearningRecommendation`. Phase 10 answers **how to carry that out now** with a
short `LearningSessionPlan`.

The plan is generated on demand. Starting a plan creates one execution record
in the existing `LearningSession` collection; it does not create a new
question-selection system or rewrite historical learning data.

The orchestration follows a small subset of:

```text
Understand → Example → Solve → Analyze → Correct → Similar → Check → Done
```

Not every session uses every step.

## Plan contract

`LearningSessionPlan` contains:

- `planId`;
- `studentId`;
- approved `programId` and optional `subjectId`;
- recommendation type;
- title;
- estimated minutes;
- ordered `steps`;
- student-safe session reason;
- confidence;
- generated time;
- `planStatus`;
- session state and progress;
- `nextStep`.

Every step contains:

- `stepId`;
- `stepType`;
- estimated minutes;
- step status;
- a `contentReference`.

The execution record remains `LearningSession`. Its additive fields store the
plan snapshot, daily idempotency key, step progress, current step index, and
session state. The plan and the execution record are not conflated:

- `LearningSessionPlan` is the generated intent;
- `LearningSession` is what the student actually started, paused, resumed, or
  completed.

## Step types

The engine currently uses:

- `READ`
- `EXAMPLE`
- `PRACTICE`
- `REFLECT`
- `CORRECT`
- `SIMILAR`
- `MASTERY_CHECK`

Current plan templates:

| Recommendation | Steps |
| --- | --- |
| `LEARN` | `READ → EXAMPLE → PRACTICE → MASTERY_CHECK` |
| `PRACTICE` | `PRACTICE → CORRECT → SIMILAR → MASTERY_CHECK` |
| `REVIEW` | `READ → PRACTICE → MASTERY_CHECK` |
| `RECOVERY_CHECK` | `PRACTICE → PRACTICE → MASTERY_CHECK` |
| `MASTERY_CHECK` | `MASTERY_CHECK` |

## Content references

The engine never chooses a random question or invents a lesson.

- `foundation_content` points to published foundation content already present
  in the database.
- `approved_scope` points to an approved Program/Subject scope.
- `question_selection_pending` explicitly leaves exact item selection for a
  later engine.
- `diagnostic_scope` is reserved for the required diagnostic boundary.

For `LEARN` and `REVIEW`, a published foundation content record is required.
If none exists, the plan returns `CONTENT_UNAVAILABLE` with no fake steps.

For practice and mastery steps, the plan can reference an approved scope while
marking exact content as deferred. This is intentional: Phase 10 provides the
next learning action without implementing Question Selection Engine.

`DIAGNOSTIC` returns `DIAGNOSTIC_REQUIRED` with no invented question or lesson.

## Session length

Ready plans target 10–25 minutes. The estimate changes by recommendation type,
confidence, and recent session count. There is no scheduling, streak, calendar,
or notification system in this phase.

## Session states

The execution state is explicit:

- `NOT_STARTED`
- `IN_PROGRESS`
- `PAUSED`
- `COMPLETED`
- `ABANDONED`

Legacy `LearningSession.status` remains compatible:

- active execution maps to `IN_PROGRESS` or `PAUSED`;
- completed execution maps to `COMPLETED`;
- abandoned execution maps to `ABANDONED`.

## `nextStep` and resume

The API exposes the first step whose status is `NOT_STARTED` or `IN_PROGRESS`
as `nextStep`. It does not require the frontend to understand the complete
orchestration.

When the student returns:

- the existing daily session is found by its server-generated daily key;
- the stored plan snapshot is reused;
- completed step states and progress are retained;
- `nextStep` advances from the saved step;
- a paused session is resumed by the start endpoint instead of being recreated.

The session plan is not regenerated from the beginning on refresh.

## Simple adaptation

After a step records owned attempt references, the service checks the new error
evidence. One isolated error does not change the plan.

At least two trustworthy conceptual errors can insert one deferred `READ` step
before the next action. This is limited orchestration, not a full adaptive
learning engine. Mastery is never recalculated or written here.

## Idempotency and ownership

- Starting the same daily plan returns the existing session.
- The server uses a deterministic `today:<Riyadh-date>:<program>` key.
- A unique session idempotency key protects against duplicate starts and
  network retries.
- Completing an already completed or abandoned session returns its existing
  state instead of creating another transition.
- Step completion is idempotent for an already completed step.
- Attempt references must belong to the authenticated student and the current
  `LearningSession`.
- Client input cannot supply a recommendation, priority, mastery value, or
  another student ID.
- Only the authenticated session determines ownership.

An already active daily session is returned as the current session. The engine
does not create conflicting active daily sessions.

## APIs

All endpoints require authentication and derive `studentId` from the session.

```text
GET  /api/learning/today
GET  /api/learning/today?programId=program.qudrat
POST /api/learning/today/start
POST /api/learning/today/step
POST /api/learning/today/complete
```

### `GET /api/learning/today`

Returns the current active/paused/completed plan for the day, or generates a
not-started plan from the top server-side recommendation. It does not create a
`LearningSession`.

### `POST /api/learning/today/start`

Accepts only an optional `programId`. It uses the server-generated
recommendation, creates one execution record for a ready plan, and resumes a
paused current session.

Diagnostic-required and content-unavailable plans are returned without
creating an executable session.

### `POST /api/learning/today/step`

Accepts an owned `sessionId`, a `stepId`, and one action:

- `complete`
- `skip`
- `pause`
- `resume`

Optional `durationSeconds` and owned `attemptIds` are stored as completion
feedback. The endpoint does not accept recommendation internals.

### `POST /api/learning/today/complete`

Completes the current session. Passing `state: "abandoned"` records an
abandoned session. Repeating completion returns the existing terminal state.

## Student-facing output

The public serializer includes title, duration, steps, state, progress,
confidence, plan status, and `nextStep`. It does not expose:

- mastery score;
- error confidence;
- recommendation priority;
- reason codes;
- raw model internals.

## Historical safety and limitations

The implementation does not:

- bulk-create daily sessions;
- rewrite old sessions;
- modify historical attempts;
- modify historical mastery;
- migrate every student;
- implement Question Selection Engine;
- implement Full Adaptive Learning Engine;
- implement spaced repetition;
- implement Digital Textbook or Apple Pencil features;
- add AI, chatbot, gamification, notifications, calendar, or dashboard
  redesign.

Exact questions and subject-specific lesson matching remain limited until
trusted content and the later selection layer are available.

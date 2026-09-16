# Phase 04 — Student Learning Profile Foundation

## Purpose

Phase 04 adds a backend data foundation that remembers observed student activity:

- what was attempted;
- whether an answered question was correct;
- response time;
- the approved program and, when available, the approved subject;
- when activity happened;
- which learning session contained the attempt.

This phase does **not** judge the student. It does not implement Mastery, Error Detection,
Recommendations, Diagnostic Tests, Adaptive Learning, or AI Tutor behavior.

## Existing data reused

The project already had:

- `TestResult` for aggregate test results;
- `ErrorLog` for existing wrong-answer logging;
- `DailyProgress` for daily-goal counters;
- `ActivityLog` for user activity events;
- the existing `StudentLearningProfile` model used by older foundation/diagnostic code.

`TestResult` is an aggregate result and cannot replace a per-question attempt history.
`ErrorLog` represents only wrong answers and cannot replace a complete attempt record.
Therefore Phase 04 adds `LearningAttempt` and `LearningSession`, while reusing
`ActivityLog` for the learning timeline.

## StudentLearningProfile

The existing model was extended additively. Its existing diagnostic fields remain for
backward compatibility, but Phase 04 uses these foundation fields:

```text
userId / studentId
profileVersion
dataConfidence: LOW | MEDIUM | HIGH
overall: ObservedPerformance
programs: map<approved program code, ObservedPerformance>
subjects: map<approved subject code, ObservedPerformance>
lastActivityAt
createdAt
updatedAt
```

The application convention is `userId`; `studentId` is stored as the explicit Phase 04
alias. New Phase 04 profile data is one profile document per student and is kept compact.
Attempts and sessions are separate collections so the profile document does not grow with
every question.

### ObservedPerformance

Each overall, program, or subject bucket contains:

```text
attempts
correctAttempts
wrongAttempts
accuracy
averageResponseTime
responseTimeTotalSeconds
lastAttemptAt
lastCorrectAt
lastWrongAt
```

`accuracy` is observed answered-question performance. It is not Mastery.
Skipped/unanswered attempts increase `attempts` but do not increase correct or wrong counts.

## Attempt model

`LearningAttempt` stores:

```text
studentId
questionId
sourceType
sourceKey?
programId
subjectId?
sessionId?
selectedAnswer?
correctAnswer?
isAnswered
isCorrect
responseTime
attemptNumber
idempotencyKey?
metadata?
createdAt
```

The API verifies the question and derives `isCorrect` from the stored answer key; it does
not trust a client-provided correctness value. The correct answer is never returned by the
student-facing attempts endpoint.

Missing subject data is accepted and retained as an unclassified observation. It is not
assigned to a Topic, Skill, SubSkill, or Concept. Only APPROVED Program and Subject codes
from the Phase 03 registry are accepted.

## Session model

`LearningSession` stores:

```text
studentId
programId
subjectId?
status: active | completed | abandoned
startedAt
endedAt?
duration
questionsAttempted
questionsCorrect
questionsWrong
idempotencyKey?
createdAt
updatedAt
```

Sessions do not receive a success label and do not represent mastery.

## Activity timeline

The existing `ActivityLog` collection is reused with learning actions:

- `learning.session_started`
- `learning.session_completed`
- `learning.session_abandoned`
- `learning.question_correct`
- `learning.question_wrong`

No screen recording, camera, microphone, or unnecessary personal content is stored.

## Confidence model

`dataConfidence` expresses the volume of recorded observations:

- `LOW`: fewer than 5 attempts;
- `MEDIUM`: 5–19 attempts;
- `HIGH`: 20 or more attempts.

This is confidence in the amount of usable data, not intelligence, ability, mastery, or
an evaluation shown to the student.

## APIs

All endpoints require an authenticated student session and derive `studentId` from that
session:

```text
GET  /api/learning-profile
GET  /api/learning-profile/subjects?programId=program.qudrat
GET  /api/learning-profile/attempts?limit=20
GET  /api/learning-profile/sessions?limit=20
GET  /api/learning-profile/activity?limit=30

POST /api/learning/sessions
POST /api/learning/sessions/:id/complete
POST /api/learning/attempts
```

`POST /api/learning/attempts` accepts an optional `idempotencyKey`. Replaying the same
key returns the existing attempt instead of creating a duplicate. Unknown questions are
rejected, and invalid/unapproved taxonomy codes are rejected.

These APIs are backend data APIs only. No student dashboard, chart, mastery label, AI
analysis, or recommendation UI was added in Phase 04.

## Indexes

Indexes cover:

- student and recent creation time;
- student/question history;
- program and subject;
- session ownership and start time;
- sparse idempotency keys for duplicate protection;
- profile student identity and last activity.

No Question Bank scan is performed on profile reads. Profile counters are updated when an
attempt is recorded.

## Privacy

Only learning data needed for aggregation and analysis is stored. The phase does not
store recordings or infer why an answer was wrong. A wrong answer is recorded as an
observed error only; it is not labeled as a Concept Gap, Wrong Strategy, Reading Error,
or Calculation Error.

## Migration strategy

No migration was executed and no existing student data was rewritten. Schema changes are
additive. Existing diagnostic/profile fields remain so older routes continue to operate.
New collections are created lazily by normal writes. Any future cleanup or consolidation
of legacy profile records requires a separate backward-compatible, idempotent, reversible
migration plan.

## Future extensions

Later phases may add separate `StudentSubjectProfile`, `StudentSkillProfile`, or
`StudentConceptProfile` collections once taxonomy nodes are explicitly approved. They
must not reinterpret this phase's observed performance as Mastery.
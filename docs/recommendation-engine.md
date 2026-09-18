# Recommendation Engine Foundation (Phase 09)

## Scope

Phase 09 decides what type of learning action could reduce the student's
current uncertainty or improve performance. It does not select an exact
question, reorder the curriculum, create a daily plan, or expose AI/UI
behavior.

Recommendations are calculated on demand from server-owned evidence. No
historical attempts, mastery records, error evidence, or legacy profile fields
are rewritten.

## Recommendation contract

Each `LearningRecommendation` contains:

- `recommendationId`: deterministic identity for the same evidence and scope;
- `studentId`;
- approved `programId`;
- optional approved `subjectId` and `taxonomyNodeId`;
- `recommendationType`;
- bounded numeric `priority` from 0 to 100;
- `priorityFactors`;
- machine-readable `reasonCodes`;
- summarized `evidence`;
- separate `confidence`;
- lifecycle `status`;
- `generatedAt` and `expiresAt`;
- calculation version.

The evidence summary contains counts, recency, error types, mastery score and
level, mastery confidence, diagnostic state, and diagnostic data confidence. It
does not expose an exact question recommendation.

## Recommendation types

The engine uses only six types:

- `LEARN`: repeated conceptual evidence or sufficiently trusted low mastery
  indicates that understanding should be strengthened.
- `PRACTICE`: repeated procedural errors exist while understanding evidence is
  present.
- `REVIEW`: previously supported knowledge has stale evidence.
- `RECOVERY_CHECK`: a returning student or a stale low-confidence scope needs
  current evidence.
- `DIAGNOSTIC`: current data is insufficient for a reliable action decision.
- `MASTERY_CHECK`: the score is near the mastery range but confidence is not
  high enough to treat it as established.

The engine emits `DIAGNOSTIC` or `RECOVERY_CHECK` before normal action
recommendations whenever the Phase 08 decision says a diagnostic is required.

## Inputs

The server reads:

- `LearningAttempt`: correctness, answered state, recency, repetition through
  evidence counts, and scope;
- `LearningErrorEvidence`: controlled error type, confidence, recency, and
  attempt linkage;
- `StudentMastery`: score, level, confidence, evidence count, and last
  evidence;
- the Phase 08 diagnostic decision: state, data confidence, required flag,
  mode, scopes, and reasons;
- the approved Program/Subject taxonomy.

Legacy recommendation fields on `StudentLearningProfile` and the old
foundation diagnostic route remain untouched. Legacy data can continue to serve
the existing product, but it cannot make the new engine trust unsupported
per-question evidence.

## Decision architecture

1. Calculate or read the server-owned Phase 08 diagnostic decision.
2. Restrict all candidates to approved Program and Subject nodes.
3. If diagnostic is required, convert its scopes into `DIAGNOSTIC` or
   `RECOVERY_CHECK` recommendations.
4. Otherwise aggregate attempts and error evidence by approved scope.
5. Require repeated trustworthy error evidence before `LEARN` or `PRACTICE`.
6. Use mastery score/level and confidence as a second signal, not as a single
   `mastery < X` rule.
7. Treat stale evidence, near mastery, and low-confidence data separately.
8. Deduplicate recommendations by action and scope.
9. Sort by calculated priority and return active recommendations.

An isolated wrong answer, especially a single `CALCULATION_ERROR`, does not
replace an otherwise strong recommendation with `LEARN`. `UNKNOWN` evidence
alone does not create an aggressive recommendation.

## Priority

Priority is a bounded, explainable sum:

```text
priority = clamp(
  base
  + masteryWeakness
  + repeatedError
  + recency
  + uncertainty,
  0,
  100
)
```

The output includes every factor:

- `base`: reflects the urgency of the action type;
- `masteryWeakness`: increases as a supported score falls below the
  developing/proficient boundary;
- `repeatedError`: increases with repeated trustworthy error evidence;
- `recency`: gives weight to current evidence;
- `uncertainty`: increases when diagnostic data confidence is not high.

Priority and confidence are intentionally separate. A high-priority
diagnostic recommendation can still have low confidence because the reason for
the recommendation is precisely that evidence is missing.

## Confidence

Recommendation confidence combines the relevant mastery confidence and the
strength of the error pattern:

- `HIGH` requires high mastery confidence plus either repeated high-confidence
  errors or broad mastery evidence;
- `MEDIUM` requires non-low mastery confidence and repeated trustworthy errors;
- `LOW` is used when the recommendation has a weak or incomplete evidence
  basis.

Confidence does not alter historical mastery and is not a student ability
label.

## Reason codes

Current reason codes include:

- `DIAGNOSTIC_REQUIRED`
- `LOW_DATA_CONFIDENCE`
- `REPEATED_CONCEPT_ERRORS`
- `REPEATED_MISUNDERSTANDING`
- `PROCEDURAL_ERROR_PATTERN`
- `LOW_MASTERY`
- `RECENT_EVIDENCE`
- `STALE_EVIDENCE`
- `RETURNED_AFTER_GAP`
- `NEAR_MASTERY_LOW_CONFIDENCE`
- `UNKNOWN_EVIDENCE_ONLY` is reserved as a non-actionable explanation and is
  not emitted as a standalone recommendation.

The engine only emits codes that explain the selected action. Unknown-only
evidence is intentionally suppressed as an action rather than converted into a
strong recommendation.

## Deduplication and identity

The engine is on-demand and does not create one database row per request.
Recommendations are deduplicated by action and approved scope. Their
`recommendationId` is a hash of the student, calculation version, action,
scope, reason codes, and evidence summary.

The identity does not include request time. The same evidence therefore keeps
the same identity across repeated reads. A genuine change in evidence or
decision state changes the identity.

## Lifecycle

The contract supports:

- `active`
- `completed`
- `dismissed`
- `expired`

Phase 09 only generates `active` recommendations with a deterministic
`expiresAt`. There is no lifecycle mutation endpoint or UI in this phase, so
completed, dismissed, and expired history is not fabricated or persisted.
A later lifecycle feature can store those transitions without changing the
decision contract.

## Taxonomy constraints

Only approved Program and Subject nodes from the controlled registry can
receive a recommendation. Skill, SubSkill, Topic, and Concept records remain
ineligible unless formally approved. The engine never invents prerequisites,
content ordering, or deep mappings from raw question labels.

## Diagnostic versus recommendation versus mastery

- Diagnostic answers: **What do we not know yet?**
- Recommendation answers: **What type of activity could reduce that
  uncertainty or improve performance?**
- Mastery answers: **What level of demonstrated knowledge is supported for an
  approved node?**

These outputs are kept separate. Recommendation generation does not recalculate
or overwrite mastery.

## API

```text
GET /api/learning/recommendations
GET /api/learning/recommendations?program=qudrat
GET /api/learning/recommendations?programId=program.tahsili
```

The endpoint is authenticated and student-only. It derives `studentId` from
the session, computes recommendations server-side, and ignores any client
attempt to provide a recommendation type, priority, confidence, or another
student ID. It returns the recommendation list plus the diagnostic decision
used as input.

## Deliberate limitations

Phase 09 does not implement:

- exact question or question-bank selection;
- Daily Session, calendar, streak, or notifications;
- adaptive-learning UI;
- spaced repetition;
- digital textbook workflows;
- Apple Pencil features;
- student-facing AI, chatbot, assistant, or AI labels;
- bulk historical recommendation generation;
- deep taxonomy recommendations without approval.

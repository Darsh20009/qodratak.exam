# Mastery Engine Foundation (Phase 07)

## Purpose

Mastery is a server-owned estimate of how consistently a student can demonstrate
an **approved taxonomy node**. It is not a replacement for observed accuracy,
and it does not decide what the student should study next.

Phase 07 is intentionally limited to the foundation:

- `LearningAttempt` is the source of answer outcomes.
- `LearningErrorEvidence` is supporting evidence about the cause of wrong answers.
- Only taxonomy nodes with `status=APPROVED` are eligible.
- The current approved registry contains Program and Subject nodes. Topic,
  Skill, SubSkill, and Concept nodes remain ineligible until formally approved.

## Mastery versus Accuracy

Observed Performance answers questions such as “how many attempts were correct?”
and remains in `StudentLearningProfile.overall`, `.programs`, and `.subjects`.
Mastery adds conservative evidence handling, recency, error evidence, confidence,
and minimum-evidence thresholds. The implementation never uses
`correctAttempts / attempts` as its only mastery measure.

`StudentMastery` is a separate Mongo model. No observed profile field is
reinterpreted as mastery.

## StudentMastery record

Each record is keyed by `(studentId, taxonomyNodeId)` and stores:

- `programId`, optional `subjectId`, and the approved taxonomy node/type.
- `masteryScore` from 0 to 100.
- `masteryLevel`: `UNKNOWN`, `EMERGING`, `DEVELOPING`, `PROFICIENT`, or `MASTERED`.
- `evidenceCount`, `correctCount`, `wrongCount`.
- `lastAttemptAt`, `lastEvidenceAt`, and a separate `confidence`.
- Explainability metadata: answered evidence count, distinct source count,
  recent correct streak, weighted positive/negative signals, error buckets,
  and recency factor.
- `calculationVersion`, currently `phase-07-v1`.

An attempt with an approved Subject is aggregated to that Subject. An attempt
without a Subject can fall back to its approved Program. An attempt with a
Subject from a different Program is rejected from mastery aggregation rather
than being silently reassigned.

## Calculation

The calculation is deterministic for the same attempts, evidence, and reference
time:

1. Deduplicate attempts by their persisted ID.
2. Exclude unanswered attempts from the correct/wrong evidence counts and score
   signals. They may still update `lastAttemptAt`.
3. Give each answered attempt a recency weight with a 30-day half-life and a
   floor of `0.25`. Old evidence is therefore weaker, but does not disappear
   automatically.
4. A correct answer contributes positive weighted evidence.
5. A wrong answer contributes a bounded negative signal. The default unknown
   cause is less severe than a confirmed concept-related cause.
6. Apply a neutral prior weight of `2` when normalizing the score. This prevents
   one answer from producing an extreme mastery value.

Concept-related errors (`CONCEPT_GAP`, `MISUNDERSTANDING`, `MEMORY_GAP`, and
`PARTIAL_UNDERSTANDING`) have a stronger negative effect than procedural or
contextual errors. Calculation, rushing, time pressure, reading, option
confusion, and strategy errors are not treated as proof that the student lacks
the concept. A wrong answer without a cause remains `UNKNOWN` error evidence.

`responseTime` is retained as an input signal in the attempt/evidence records,
but it is not used as a standalone mastery judgment. Speed is not mastery and
slowness is not failure.

## Levels and confidence

The score and level are intentionally separate:

- `UNKNOWN`: no answered evidence for the node.
- `EMERGING`: early evidence, or a score below the developing threshold.
- `DEVELOPING`: at least three answered pieces of evidence and a score of 50+.
- `PROFICIENT`: at least five answered pieces of evidence and a score of 70+.
- `MASTERED`: at least eight answered pieces of evidence, a score of 85+,
  and a recent correct streak of at least three.

Therefore, one correct answer cannot produce `MASTERED`, and one wrong answer
cannot produce a zero or a `NOT_MASTERED` label.

Confidence describes how much evidence supports the estimate, not how capable
the student is:

- `LOW` below three answered pieces of evidence.
- `MEDIUM` from three answered pieces of evidence.
- `HIGH` from eight answered pieces of evidence across at least three distinct
  source identities.

## Aggregation and recalculation

`masteryService` collects the student’s trusted attempts and error evidence,
resolves each attempt to an approved node, calculates a snapshot, and upserts
`StudentMastery`. Recalculation is safe to repeat because it derives the
snapshot from source records rather than incrementing mastery counters.

New verified attempts trigger recalculation for their approved node. A
self-reported error also triggers recalculation for its attempt. The read API
can recalculate all eligible nodes or one approved node.

There is no bulk historical migration or taxonomy backfill. No unapproved
deep taxonomy is inferred from question category, subcategory, or error
metadata.

## API

`GET /api/learning/mastery`

Optional query parameter:

`taxonomyNodeId=<approved node code>`

The endpoint is protected by the student session and derives `studentId` from
that session. The client cannot submit `masteryScore`, `masteryLevel`, or
`confidence` as source data. The response includes the calculated records,
the approved node list, and the calculation version.

## Deliberate limitations

This phase does not implement:

- Recommendations or next-lesson selection.
- Diagnostic classification.
- Adaptive learning paths.
- Daily session planning.
- Spaced repetition.
- Student-facing AI or labels.
- UI for mastery explanations.
- Mastery for Topic, Skill, SubSkill, or Concept nodes until those nodes are
  formally approved and have reviewable question mappings.

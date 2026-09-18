# Question Selection Engine — Phase 11

## Scope

The Question Selection Engine converts a trusted `Recommendation` and a
session step into one suitable content reference or question. It is separate
from recommendation generation and from session execution.

```text
Recommendation
  -> Session Step
  -> Question Selection
  -> Question or Foundation Content
  -> LearningAttempt
  -> Error Evidence
  -> Mastery
```

The engine runs on demand. It does not bulk-select questions for students and
does not rewrite historical attempts, error evidence, mastery history, or
question records.

## Audited sources

### Qudrat Question collection

The `Question` collection is the trusted Qudrat bank currently used by the
existing test and practice flows.

- `questionId` is the numeric legacy identity; selected output uses it as a
  string for compatibility with `LearningAttempt`.
- `sourceType` is `mongo_question`.
- `sourceKey` is `question-bank`.
- `category` maps to the approved Qudrat subjects `verbal` or `quantitative`.
- `text`, `options`, and `correctOptionIndex` are available for server-side
  verification.
- `subcategory`, `topic`, `difficulty`, explanation, and image fields are
  optional metadata.

### TahsiliQuestion collection

Scanned-book questions are kept separate from Qudrat.

- `sourceType` is `mongo_tahsili_question`.
- `sourceKey` is derived from source book, page, and source question number.
- `questionId`, subject, page, book, text, options, and answer key are
  explicit source fields.
- Only `answerConfidence=verified` questions enter the candidate pool.
- `answerConfidence=review` questions remain unavailable to the selector.

### FoundationContent

Published Foundation Content is selected as content, not replaced by a
question. The lesson's quiz remains owned by the existing foundation quiz
flow.

- A lesson must be published.
- Its program must match the session program.
- The response includes lesson metadata and whether a quiz exists.
- Quiz answer keys and internal question selection details are not returned.

### QuestionLearningMap

Question mappings are optional enrichment. Deep taxonomy is used only when the
map is both:

- `status=mapped`
- `reviewStatus=APPROVED`

Otherwise, the selector falls back to the approved program/subject scope. It
does not turn an unapproved topic, skill, or concept into a claim.

Legacy JSON and Postgres source labels are retained by the existing mapping
layer, but are not read as an unvalidated raw file by this selector.

## Candidate pool and filtering

The server builds a bounded candidate pool using indexed program/subject
queries:

- Qudrat queries `Question` by `category`.
- Tahsili queries `TahsiliQuestion` by `subject` and verified answer
  confidence.
- Each query has a deterministic question ordering and a bounded result
  limit.
- Student attempts, error evidence, and mastery are queried with the
  authenticated student ID and the current program/subject.

Candidates must have:

- a trusted source type;
- a non-empty question identity and text;
- at least two options;
- an integer answer key inside the options range;
- a verified Tahsili answer confidence when applicable.

The selector then applies:

1. exact program matching;
2. exact subject matching when a subject is present;
3. approved deep taxonomy matching when an approved deep match exists;
4. recent-question exclusion;
5. exact-repeat exclusion;
6. error and mastery-aware ordering;
7. deterministic tie-breaking.

## Exclusions and scoring

The internal score is never returned to the student. It is deterministic and
considers:

- approved taxonomy alignment;
- error metadata alignment;
- review alignment with previously handled category/topic;
- optional trusted difficulty target;
- mastery state;
- recent source/category diversity.

Questions answered in the last 24 hours are excluded. Previously attempted
questions are excluded from normal selection even when old, so repetition is
not silently presented as novelty.

An intentional retry is a separate `RETRY` activity with an explicit retry
target. It is not the same as repeating a request after a network failure.

## Strategies

- `LEARN`: selects the published Foundation Content reference from the
  session step; it does not select a question instead of the lesson.
- `PRACTICE`: selects a fresh question in the approved program/subject scope,
  aligned with trusted error metadata when available.
- `REVIEW`: selects a fresh question related to a previously encountered
  category/topic where metadata supports that relationship.
- `RECOVERY_CHECK`: selects a small fresh representative question set one
  step at a time.
- `MASTERY_CHECK`: selects a fresh question for the approved scope and avoids
  recent use.
- `DIAGNOSTIC`: remains `SELECTION_PENDING` because the current approved
  taxonomy does not provide enough diagnostic coverage.
- `RETRY`: allows only the explicitly requested previously selected question.

## Determinism and diversity

`Math.random()` is not used. The final tie-break order is stable by source
type, source key, and question identity. The same student context, evidence,
and candidate pool therefore produce the same selection.

Source/category repetition receives a penalty when other eligible candidates
exist, without introducing nondeterminism.

## No suitable content

When no eligible candidate remains, the engine returns
`NO_SUITABLE_CONTENT`. It does not:

- invent a question;
- change question values;
- select another subject;
- claim a deep taxonomy match without an approved mapping;
- expose a fake fallback question.

## Session integration

The authenticated student calls:

```text
POST /api/learning/today/select
{
  "sessionId": "...",
  "stepId": "..."
}
```

The server loads the session using both session ID and authenticated student
ID. The client cannot submit the final question ID for normal selection.

On successful selection, the server stores the selected `contentReference` in
the session plan snapshot. Repeating the request returns the same selected
question. A deliberate retry may pass `retry=true`, but only for the question
already stored on that step.

## Student-facing security

The public selection response excludes:

- `correctOptionIndex`;
- `correctAnswer`;
- internal selection score;
- private error evidence;
- mastery calculation internals.

The existing server-side attempt verification remains responsible for answer
correctness. The selector never trusts a client-provided answer key.

## Tests and limitations

The selection unit tests cover program and subject filtering, approved and
unapproved taxonomy, invalid questions, missing answer keys, recent and exact
repetition, error alignment, mastery, difficulty metadata, determinism,
no-content behavior, ownership, public response safety, session reference
updates, diagnostic pending, retry distinction, and source compatibility.

Mongo integration infrastructure is not available in the current test setup,
so live candidate retrieval and duplicate persistence are verified by the
existing Mongo-backed runtime paths rather than a new test database harness.
The engine intentionally remains limited to the currently approved
program/subject taxonomy; deep Skill/Concept selection waits for approved
mapping evidence.

This phase does not add AI, a question-generation path, full adaptive
learning, spaced repetition, digital textbook features, notifications,
calendar, gamification, or Phase 12 work.
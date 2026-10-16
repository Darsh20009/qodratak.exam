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

For computerized Qiyas exams, keep the existing aggregate result separate from
skill evidence: the server must load each Mongo question, accept only approved
questions, and derive the Qudrat subject from its stored category. Never use
client-supplied correctness, category, or answer keys as learning evidence.

**Why:** A browser aggregate can disagree with the verified attempts, corrupting
both the result and the learning coach's interpretation.

**How to apply:** Verify the complete scored question roster on the server and
derive correct/wrong/skipped counts and the denominator there. Persist only
answered evidence, but include unanswered scored questions in the denominator.
Return canonical keys for the result review so cached browser keys cannot
contradict the saved grade. Keep Tahsili answer keys session-owned.

Automated result review must be deterministic. AI must not replace answer keys,
declare wrong questions experimental, or grant artificial correctness credits.

**Why:** Such changes silently alter both grades and the student's observed
weaknesses without a reviewed content source.

**How to apply:** Recheck server-owned exam snapshots; reject malformed keys for
human review. Exclude a subject with no questions from a single-subject
percentage instead of halving the student's grade. Keep corrections to old
student results separate from future grading changes.

Detailed exam reports must cover the complete scored roster in exam order, not
only the questions captured by the viewing/timing tracker.

**Why:** A visit tracker omits unvisited questions, so a report built solely from
it understates skipped counts and disagrees with the saved exam result.

**How to apply:** Include unvisited questions as skipped with unknown timing.
Keep measured-time counts separate from exam question counts, preserve existing
positive measurements, and never interpret zero/unmeasured time as fast work.

Pending Tahsili drafts may be offered as explicitly unscored practice. Save the
student's choices and timing in a separate practice history, but never derive
correctness, a grade, or mastery/error evidence from those attempts.

**Why:** Draft answer keys and OCR content are not yet reviewed, so using these
attempts as performance evidence would contaminate scores and personalization.

**How to apply:** Keep the unscored report separate from `LearningAttempt`,
official exam reports, and level analytics until the source content is reviewed.
---
name: Error evidence boundary
description: Durable Phase 06 rules for separating observed mistake evidence from inferred error causes.
---

`LearningErrorEvidence` is an evidence history attached to a trusted
`LearningAttempt`; it is not a student diagnosis or mastery judgment.

**Why:** one wrong answer cannot distinguish a concept gap from rushing,
guessing, reading trouble, or a calculation mistake. Treating it as a concept
gap would contaminate later learning decisions.

**How to apply:** keep `UNKNOWN` as the default for unsupported causes, derive
confidence from evidence strength rather than ability, allow explicit
self-report through a server allowlist, and preserve `ErrorLog` as a
legacy/compatibility record without bulk backfilling it.
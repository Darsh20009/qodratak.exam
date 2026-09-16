---
name: Student learning profile foundation
description: Phase 04 keeps legacy diagnostic profile fields compatible while storing observed learning activity in separate attempt and session records.
---

The learning profile is an observed-data summary, not a mastery or intelligence judgment. Keep per-question attempts and learning sessions in separate collections; keep only compact overall, program, and approved-subject counters in the profile.

**Why:** Aggregate test results cannot answer per-question history, and wrong-answer logs cannot represent correct, skipped, or repeated attempts. Existing diagnostic profile fields are already consumed by older routes, so replacing them would create unnecessary migration risk.

**How to apply:** Add future observed metrics additively, derive correctness from the server-side question answer, accept missing subject as unclassified rather than guessing deep taxonomy, and reserve mastery/error interpretation for later phases.
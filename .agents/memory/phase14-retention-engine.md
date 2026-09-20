---
name: Phase 14 retention engine
description: Durable constraints for spaced repetition and retention evidence.
---

Review identity must preserve the full source tuple rather than relying on question ID alone, and retention confidence must remain a separate signal from mastery and recommendation confidence.

**Why:** The same visible question ID can exist in multiple source systems, while a correct answer or mastery score alone does not establish durable retention.

**How to apply:** Keep review records student-scoped, deterministic, and taxonomy-gated; use wrong answers, completed content, and later review outcomes as separate evidence without rewriting historical attempts or mastery.
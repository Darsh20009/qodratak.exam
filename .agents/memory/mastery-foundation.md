---
name: Mastery taxonomy gate
description: Durable scope rule for the server-owned mastery foundation and its taxonomy eligibility.
---

Mastery must be calculated only for taxonomy nodes whose registry status is `APPROVED`. The current foundation is intentionally limited to approved Program and Subject nodes; Topic, Skill, SubSkill, and Concept remain ineligible until their mappings are formally reviewed and approved.

**Why:** Source categories and subcategories do not prove a deep learning concept, and treating them as concepts would make mastery overclaim what the evidence supports.

**How to apply:** Extend the approved-node resolver and tests only after adding reviewable taxonomy evidence. Keep Mastery separate from StudentLearningProfile Observed Performance and do not backfill unapproved history.
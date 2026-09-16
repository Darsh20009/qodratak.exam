---
name: Content taxonomy review boundary
description: Rules for turning existing question labels into the future learning hierarchy.
---

Existing category and subject labels are evidence for a candidate mapping, not proof of a Skill, SubSkill, Concept, or prerequisite. Preserve ambiguous records as Unmapped and incomplete but safe records as Needs Review until a reviewer approves the deeper taxonomy.

**Why:** The current banks contain reliable top-level labels but do not consistently contain deep skills, concepts, or prerequisite relationships; automatic inference would create false learning signals.

**How to apply:** When extending the content map, normalize only controlled aliases, preserve original labels, record evidence/review reasons, and do not persist an approved deep mapping without review.

Question source keys must include a source namespace when different banks can reuse numeric IDs; a numeric question ID alone is not globally unique.

**Why:** The readable Qudrat verbal and quantitative banks both reuse IDs, so a mapping uniqueness constraint would otherwise conflate different questions.

**How to apply:** Build keys from source type, bank/namespace, and source ID before storing or comparing question mappings.
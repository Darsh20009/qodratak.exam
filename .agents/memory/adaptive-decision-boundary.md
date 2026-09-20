---
name: Adaptive decision boundary
description: Phase 15 decision ownership and integration constraints for future learning work
---

The adaptive learning decision layer must remain a deterministic, read-only orchestrator. It may read diagnostic, attempts, error evidence, mastery, retention, and availability, then map its next action to existing recommendation/session/question-selection contracts. It must not create content, select a question, record attempts, or mutate mastery or review state.

**Why:** The product separates “what is needed now?” from the systems that create recommendations, execute sessions, select questions, and update learning state. Keeping those boundaries prevents duplicate engines and hidden state mutations.

**How to apply:** Future learning phases should reuse the decision’s approved program/subject scope and safe public response. Deep taxonomy, raw errors, internal weights, mastery calculations, and retention calculations stay server-side and review-gated.
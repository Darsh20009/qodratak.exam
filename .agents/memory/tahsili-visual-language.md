---
name: Tahsili visual language
description: Shared visual direction for the Tahsili learning surfaces and exam flows.
---

Pages that introduce, browse, or organize Tahsili content should use a calm shared surface with clear hierarchy, restrained motion, and restful educational color. Exam selection and runner screens should prioritize scanability and focus over promotional decoration.

**Why:** The older Tahsili screens used unrelated dark gradients, glow effects, and dense motion, which made study navigation feel like a marketing page and reduced consistency with the newer computerized experience.

**How to apply:** Use semantic theme tokens in the page markup for new Tahsili overview, study, test-center, and question-bank work; do not depend on broad CSS selectors to hide legacy colors. Treat `/tahsili` as the learner entry point and `/tahsilik/tests` as the single test-type chooser. Keep exam-taking interactions visually stable and avoid reintroducing floating particles or heavy animation.
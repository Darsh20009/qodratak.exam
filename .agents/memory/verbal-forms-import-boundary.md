---
name: Verbal Forms import boundary
description: Rules for importing public Google Forms verbal questions into the Qodratak question bank.
---

Public Google Forms imports must preserve the source form, source question identifier, and preceding reading passage, while deduplicating on the question text plus options. Items with fewer than two usable options are staging-only and must not enter scored question pools.

**Why:** The Forms payload does not contain a trustworthy answer key, and reading-comprehension questions are only solvable with their preceding passage. Some exported items also have incomplete option arrays.

**How to apply:** Solve questions in context, retain source metadata with the approved explanation, validate one solution per staging identifier, and use an idempotent source-keyed import before exposing the questions to students.
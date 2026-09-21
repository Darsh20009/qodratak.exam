---
name: Public Forms answer-key boundary
description: What can and cannot be trusted when importing public Google Forms into the question bank.
---

Public Google Forms respondent pages can expose structured question text and options, but the numeric metadata beside a question is not a trustworthy correct-answer index. A separate reviewed answer key is required before publishing imported questions as scored practice.

**Why:** The first reviewed form exposed the same numeric marker for every question; semantic comparison showed that it was only correct by coincidence for some questions and wrong for others.

**How to apply:** Stage public-form questions as unscored review content, preserve the source form and question IDs, deduplicate using question text plus options, and only publish after a separate answer key is matched and reviewed.
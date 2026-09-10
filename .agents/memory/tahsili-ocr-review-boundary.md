---
name: Tahsili OCR review boundary
description: How scanned Tahsili-book questions should be staged before answer publication.
---

Scanned-book extraction must be conservative: only question blocks with four readable options enter the review collection, and OCR-derived answers remain `review` until matched to the printed answer key with confidence.

**Why:** The source PDF has no useful text layer, RTL OCR can reorder columns, and the answer-key glyphs are easy to misread. A guessed answer would be more harmful to students than a visible review state.

**How to apply:** Keep the question bank able to display review questions, but never highlight or expose a placeholder option as correct. Treat answer-key matching and ambiguous OCR cleanup as a separate approval step.
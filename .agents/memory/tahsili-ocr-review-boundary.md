---
name: Scanned exam OCR review boundary
description: How scanned Tahsili and quantitative exam questions should be staged before answer publication.
---

Scanned-book extraction must be conservative: preserve the original question image because the PDF text layer may be empty or misleading, keep OCR as supporting text, and never publish a question as scored when its printed answer key is ambiguous.

**Why:** The source PDF has no useful text layer, RTL OCR can reorder columns, and the answer-key glyphs are easy to misread. A guessed answer would be more harmful to students than a visible review state.

**How to apply:** Keep the question bank able to display review questions, but exclude ambiguous items from linked scored quizzes. Treat answer-key matching and ambiguous OCR cleanup as a separate approval step; a readable printed letter can approve an image-backed question even when OCR text is imperfect.
---
name: Computer-bank PDF bidi numbering
description: Arabic PDF text extraction can reverse question-number digits in mixed right-to-left headers.
---

For some scanned or composed Arabic bank PDFs, `get_text()` returns two-digit question numbers in reversed digit order even though the rendered page is numbered correctly. Use the PDF's sequential question pages and confirm representative headers visually before mapping page order to question IDs.

**Why:** Reversing a header such as question 12 into question 21 can silently mislabel question images and answer keys.

**How to apply:** When extracted numbering conflicts with the declared question count or sequence, inspect rendered pages and rely on page order only after the visual numbering is confirmed.

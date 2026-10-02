---
name: Arabic PDF text normalization
description: PyMuPDF may expose Arabic answer labels as Unicode presentation forms instead of normalized letters.
---

Normalize extracted Arabic PDF text with NFKC before applying regexes or comparing answer tokens. Visually normal Arabic can still be encoded as presentation-form glyphs, so raw matching may return no hits.

**Why:** Direct Arabic regex matching failed against solved-bank PDFs until the extracted text was normalized.

**How to apply:** For PyMuPDF imports, normalize before matching page labels, require exactly one recognized answer token per page, and visually sample extracted question images separately from the answer strip.
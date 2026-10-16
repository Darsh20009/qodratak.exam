---
name: Tahsili extraction review boundary
description: How scanned OCR and geometric PDF extraction should be staged before answer publication.
---

Scanned OCR and text-layer extraction must remain conservative: preserve a source crop for visual review because OCR may reorder Arabic columns and geometric parsing may split two-column answer choices incorrectly. Keep extracted text as a draft and never publish an answer key unless a reviewer verifies it against the source. A printed answer key is evidence, not authority: independently check the subject reasoning and reject unclear stems, duplicated choices, and missing referenced diagrams rather than guessing.

**Why:** Scanned pages may have no useful text layer, while selectable text can still be split or reordered across RTL columns; solved source PDFs can also contain incorrect keys or ambiguous items. A guessed answer would be more harmful to students than a visible review state.

**How to apply:** Keep every extraction in the pending-review collection, preserve its source crop, and exclude it from scored student banks until a reviewer corrects the stem/options, assigns its subject, independently verifies the answer, and writes a supported explanation. If a draft references a figure but has no attached source image, or contains control/replacement characters, keep it out of student banks until repaired.
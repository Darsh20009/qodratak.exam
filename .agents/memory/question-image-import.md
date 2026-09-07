---
name: Question image import compatibility
description: Durable decisions for multi-image question uploads and optional visual extraction.
---

Question imports must preserve `imageUrl`/`imageOriginalUrl` as the first-image compatibility fields while storing the complete ordered image arrays separately. Visual extraction is an assistive draft only: the admin must be able to review and edit every extracted field, and unavailable AI must never block cleaned-image upload or manual question creation.

**Why:** Existing student and exam paths still consume the single-image fields, while the vision provider may be unavailable or restricted in a given environment.

**How to apply:** When extending question images, update both legacy and array fields, keep the UI reviewable, and return a clear fallback state instead of fabricating OCR or answer data.
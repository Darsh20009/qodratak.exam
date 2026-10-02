---
name: Question image import compatibility
description: Durable decisions for multi-image question uploads and optional visual extraction.
---

Question imports must preserve `imageUrl`/`imageOriginalUrl` as the first-image compatibility fields while storing the complete ordered image arrays separately. Visual extraction is an assistive draft only: the admin must be able to review and edit every extracted field, and unavailable AI must never block cleaned-image upload or manual question creation.

**Why:** Existing student and exam paths still consume the single-image fields, while the vision provider may be unavailable or restricted in a given environment.

**How to apply:** When extending question images, update both legacy and array fields, keep the UI reviewable, and return a clear fallback state instead of fabricating OCR or answer data.

For scanned bank PDFs, identify the page's actually drawn image before extracting it; avoid checking every image XRef listed in each page's resource dictionary. Keep the source image authoritative and skip OCR when it is not reliable.

**Why:** Some PDFs expose all bank-page images in each page's resources, making exhaustive placement scans time out; OCR on mathematical questions can also produce misleading text.

**How to apply:** Match page image draw operators to their XRefs, inspect a sample to ensure the answer-key footer is excluded, and use OCR only when it adds readable supporting text.

For quantitative computer-bank scans, preserve the source JPEGs and `imageOriginal*` fields, and switch only active image fields after every transparent derivative is verified. Seed the 5% flood-fill a few pixels inside a non-book corner, mask the recurring upper-left book panel, and remove copyright text with paired red text-row detection plus per-pixel masking—not a broad rectangle.

**Why:** A one-pixel scan border can make literal corner pixels dark despite a white page margin; broad caption boxes can erase red diagrams. Transparent previews on dark backgrounds can also make preserved black ink appear missing.

**How to apply:** Check representative layouts on a white composite, sample corners a few pixels inward, and verify every derivative's dimensions and alpha before changing active URLs. Review red masks against question text and diagrams; use image-specific exclusions or bounded forced regions only when visually confirmed, and still remove hue-matched pixels only. Keep originals available for recovery and verify that original database fields remain unchanged.
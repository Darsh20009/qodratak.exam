---
name: Question-number badge cleanup
description: Preserve the Arabic question badge while hiding only its printed number digits.
---

The «سؤال» label is a dark-green capsule with a lighter circular number field, but its position varies across exam images and can be far below the top edge. Avoid fixed top-corner or lime-only searches. Locate the capsule, then restrict any recoloring to digit-colored pixels inside the disc so the label, disc outline, and surrounding question content remain intact.

**Why:** Position and color variation made broad heuristics miss valid badges or select unrelated green content. Failing closed on missing or ambiguous badge candidates is safer than applying a bulk image edit blindly.

**How to apply:** Preflight every source image, stage all derivatives, validate the complete batch, and only then replace active derivative files. Keep original JPEGs and original-image database fields untouched.
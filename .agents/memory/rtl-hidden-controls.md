---
name: Visually hidden controls in RTL pages
description: Avoid horizontal overflow from off-screen anti-spam and accessibility controls.
---

Clip visually hidden controls within the layout rather than moving them far outside it with negative horizontal offsets.

**Why:** In the Arabic RTL support page, a far-negative hidden input expanded the document's horizontal bounds and broke full-page captures despite the visible form appearing normal.

**How to apply:** Keep hidden controls non-focusable and appropriately hidden from assistive technology, using a clipped small box without distant horizontal positioning.

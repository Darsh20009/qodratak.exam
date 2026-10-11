---
name: Quantitative video timing calibration
description: How to validate question-number templates before deriving timestamps from long bank videos.
---

Before using a frame as a question-number template, inspect the actual badge in that frame and confirm its visible number. A timestamp inferred from neighboring question order can refer to an adjacent question; a mislabeled template may still produce plausible-looking matches and shift results silently.

Use a frame as a timing anchor only when its raw badge classification agrees with the smoothed sequence label. Smoothing can carry a neighboring question label into a blank transition frame.

**Why:** Incorrectly labeled samples were initially treated as trusted references. Inspecting the actual video frames exposed the mismatch and corrected the calibration.

**Why:** A smoothed label on a frame with no visible badge can shift an anchor into a transition, then pull the neighboring inferred question time with it.

**How to apply:** Verify each template visually and against its expected glyph match, use only raw-and-smoothed matching frames as anchors, calibrate by video family from stable high-confidence detections, and keep sequence-aligned or interpolated times marked approximate.

Badge position and digit fonts vary between bank video families. Very sparse detections call for recalibrating the crop and the actual bank's glyphs, not publishing mostly interpolated question clips.

**Why:** A cropped badge and mismatched font produced plausible but sparse anchors even when the complete question numbers were visible in the original frames.

**How to apply:** Inspect a full frame when coverage drops, calibrate against the actual published question images, reject insufficient anchors or invalid intervals, and label inferred bounds explicitly. Manually verified clips require checking the original question image as well as the video boundaries.

Count usable timestamps as finite numeric values, never merely as fields that exist.

**Why:** Older bank records contained null timestamp placeholders; field-existence counts misleadingly suggested those banks were already timed.

**How to apply:** Inspect live numeric values and their inferred flags before reusing timing exports. Local staged catalogs and timing exports may not cover every bank.

Use bounded playback of the original bank video rather than creating thousands of duplicate clip files.

**Why:** The existing large videos support byte-range streaming; duplicate exports would unnecessarily increase media storage and deployment size.

**How to apply:** Store source-linked start/end metadata separately from grades, distinguish manual verification from detected and inferred bounds, and keep the original media intact.
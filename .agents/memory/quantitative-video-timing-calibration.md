---
name: Quantitative video timing calibration
description: How to validate question-number templates before deriving timestamps from long bank videos.
---

Before using a frame as a question-number template, inspect the actual badge in that frame and confirm its visible number. A timestamp inferred from neighboring question order can refer to an adjacent question; a mislabeled template may still produce plausible-looking matches and shift results silently.

Use a frame as a timing anchor only when its raw badge classification agrees with the smoothed sequence label. Smoothing can carry a neighboring question label into a blank transition frame.

**Why:** Incorrectly labeled samples were initially treated as trusted references. Inspecting the actual video frames exposed the mismatch and corrected the calibration.

**Why:** A smoothed label on a frame with no visible badge can shift an anchor into a transition, then pull the neighboring inferred question time with it.

**How to apply:** Verify each template visually and against its expected glyph match, use only raw-and-smoothed matching frames as anchors, calibrate by video family from stable high-confidence detections, and keep sequence-aligned or interpolated times marked approximate.
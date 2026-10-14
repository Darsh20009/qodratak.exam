---
name: Dark-mode page contrast
description: The Qodratak UI contains older pages with fixed light backgrounds and dark text that need scoped theme protection.
---

Legacy Qodratak pages may contain fixed `bg-white` and dark gray/arbitrary text classes instead of semantic theme tokens. Dark-mode readability requires scoped overrides inside the shared app surface, while new dashboard components should use semantic colors directly.

**Why:** Fixed light palette classes caused student dashboard text and action labels to become unreadable when the page background switched to dark mode.

**How to apply:** Prefer `bg-card`, `text-foreground`, and `text-muted-foreground` in new or edited components. Keep compatibility overrides scoped to `.qodratak-page-surface` so they do not affect embedded previews or other artifacts.

All application layout branches must participate in the theme boundary; do not assume a legacy outer layout wraps newer student routes.

**Why:** The student shell bypassed the older layout, so valid scoped dark styles never reached its white cards.

**How to apply:** Check the actual route's layout boundary, not only the stylesheet. Explicit dark variants remain page-owned. Preserve original question/PDF pixels and the white drawing-paper surface so dark mode does not hide black ink. Transparent question scans need white paper behind them both inline and when enlarged; preserving pixels alone is insufficient.

**Why:** Background-removed question scans can contain transparent pixels and dark ink. Rendering them on a dark card makes otherwise valid source content look corrupted even with no CSS filter.

Verify administrative color changes with the actual application stylesheet and theme wrappers in both light and dark mode, not just isolated component colors.

**Why:** Administrative compatibility styles can override a nested button's foreground independently of its background. A component can appear correct in isolation but lose contrast inside the real administrative surface.

**How to apply:** Include inherited styles and disabled controls in visual checks. For a color-only fix, an offline rendering of the actual component with its real stylesheet can verify presentation without changing administrator access or sending messages.
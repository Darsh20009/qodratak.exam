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
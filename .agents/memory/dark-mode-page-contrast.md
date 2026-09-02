---
name: Dark-mode page contrast
description: The Qodratak UI contains older pages with fixed light backgrounds and dark text that need scoped theme protection.
---

Legacy Qodratak pages may contain fixed `bg-white` and dark gray/arbitrary text classes instead of semantic theme tokens. Dark-mode readability requires scoped overrides inside the shared app surface, while new dashboard components should use semantic colors directly.

**Why:** Fixed light palette classes caused student dashboard text and action labels to become unreadable when the page background switched to dark mode.

**How to apply:** Prefer `bg-card`, `text-foreground`, and `text-muted-foreground` in new or edited components. Keep compatibility overrides scoped to `.qodratak-page-surface` so they do not affect embedded previews or other artifacts.
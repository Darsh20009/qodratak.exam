---
name: Exam display mode
description: Fullscreen and dark-mode rules for the shared exam layout.
---

When the browser enters fullscreen during an exam, the shared exam layout should hide platform chrome such as the logo bars, sidebar, and mobile bottom navigation. The question surface remains usable and fills the viewport.

**Why:** Students need an exam-only view; leaving platform chrome visible wastes space and makes the experience look inconsistent, especially when the app theme is dark.

**How to apply:** Track `fullscreenchange`, use the light brand asset inside the legacy light exam layout, remove fullscreen-only spacing, and exit fullscreen when the exam layout unmounts.
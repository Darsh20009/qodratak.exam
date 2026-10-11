---
name: Exam display mode
description: Fullscreen and dark-mode rules for the shared exam layout.
---

When the browser enters fullscreen during an exam, the shared exam layout should hide platform chrome such as the logo bars, sidebar, and mobile bottom navigation. The question surface remains usable and fills the viewport; its interface follows the selected theme.

**Why:** Students need an exam-only view; leaving platform chrome visible wastes space and makes the experience look inconsistent, especially when the app theme is dark.

**How to apply:** Track `fullscreenchange`, use the appropriate theme brand asset, remove fullscreen-only spacing, and exit fullscreen when the exam layout unmounts. Keep source question images/PDFs in their original colors and drawing paper white, rather than inverting content.

**Why the theme boundary changed:** The user requested dark-mode support across all pages. This supersedes the earlier fixed-light exam-interface convention, not the requirement to preserve question content or exam behavior.

## Exam workspace integrity

Fullscreen is a display choice, not a replacement for monitoring policy. Hide platform chrome, but retain the exam's own timer and answer/navigation controls. Scheduled exams that require fullscreen must keep that requirement.

**Why:** Expanding the workspace must not strand the student or weaken an existing monitored exam.

**How to apply:** Keep notebook tools inside the same page/window, independent of answer and timing state. Editing or selecting the student's own notebook text must not count as copying exam content; keep exemptions limited to that field. Notes are temporary section scratch work, explicitly disclosed and never sent for grading.

Each distinct student shell must supply a working exam-chrome context rather than rely on its default no-op value.

**Why:** Native fullscreen can succeed while the platform sidebar remains visible when a route bypasses the legacy layout's provider; type checking does not detect this missing runtime boundary.

**How to apply:** Verify the actual student shell used by each exam route and preserve exam state when context activation hides the surrounding navigation.
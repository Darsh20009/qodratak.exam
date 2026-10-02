---
name: Foundation progress metrics
description: Keep course completion distinct from saved test-performance percentages.
---

Course completion is a separate metric from test performance. Count a lesson as complete only when its saved learning-progress state is `COMPLETED` or `PRACTICE_COMPLETED`; partial reading progress and quiz scores are not course completion. Never use progress-summary items as an allowlist for displaying published lessons: that summary may exclude content outside the approved taxonomy scope.

**Why:** A strong quiz score does not establish that a lesson was completed, and reading progress alone does not mean the student finished the lesson. Progress data describes a student's completion state, not which published lesson records may be displayed.

**How to apply:** Render published lessons from the course-content query; use the student-scoped learning-progress summary only for completion indicators. Keep “نسبة الأداء” or equivalent labels tied to saved test answers.
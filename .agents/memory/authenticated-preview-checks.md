---
name: Authenticated preview checks
description: Public versus authenticated preview checks and exam grading/report verification boundaries
---

An unauthenticated 401 from a session-only API during a screenshot of a public route is expected and is not evidence of an automatic logout regression. Public rendering and authenticated routes must be checked separately.

**Why:** The preview browser may not carry the user's existing session, while the app correctly asks the server for the current user.

**How to apply:** Treat the public shell and browser console as healthy when the only auth-related log is an expected 401; use an authenticated session or targeted API test to verify dashboard, notification, booking, and protected navigation behavior.

Exam verification must cover starting actual questions, not merely opening a catalog or following its links.

**Why:** A catalog can render successfully while its start handler redirects home, its question payload has no usable identity/options, or the exam fails to load. Route-only checks previously missed those failures.

**How to apply:** For an exam-start regression, verify the affected starts with an authenticated student and check one saved result when grading/persistence is affected. Freeze code and finish workflow restarts before that pass: hot reloads can reset active exam state, and restarting the API mid-pass can produce transient proxy 502 errors that obscure actual failures. Treat unpublished content separately from a working exam.

Successful question loading and TypeScript checks do not establish successful final submission or a persisted detailed report.

**Why:** Runtime persistence validation rejected new exam variants even though their questions opened. The scored result and detailed timing report are separate persistence flows.

**How to apply:** Check runtime model validation for new variants, submit a trusted scored roster, and reload student history. When integrating a new runner, connect both score saving and the shared question-timing/report flow.

Per-answer feedback must never finalize a whole exam's timing or archive a completed exam report.

**Why:** A generic submit-request interceptor treated adaptive answer feedback as exam completion, fragmenting a session into one-question reports. Automatic archiving can also race a later full-roster report when unseen skipped questions are registered too late.

**How to apply:** Distinguish answer-feedback requests from exam-finalization requests. Register the complete scored roster before automatic final archiving, including skipped items, and verify one full-session report rather than only its aggregate score.
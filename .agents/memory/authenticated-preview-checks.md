---
name: Authenticated preview checks
description: Public versus authenticated preview checks and exam grading/report verification boundaries
---

An unauthenticated 401 from a session-only API during a screenshot of a public route is expected and is not evidence of an automatic logout regression. Public rendering and authenticated routes must be checked separately.

**Why:** The preview browser may not carry the user's existing session, while the app correctly asks the server for the current user.

**How to apply:** Treat the public shell and browser console as healthy when the only auth-related log is an expected 401; use an authenticated session or targeted API test to verify dashboard, notification, booking, and protected navigation behavior.

Protected dashboard visual checks should use a real login-issued session for a synthetic database-backed student, dismiss first-run security setup through its normal UI, and wait for task sources to finish loading before judging the empty state.

**Why:** The unauthenticated preview cannot prove protected rendering; account-security setup can cover the dashboard, and an early render can look empty before recommendations arrive.

**How to apply:** Confirm the session with protected API data, inspect task title/status/reason/destination after loading settles, capture desktop and mobile, and verify logout without weakening authentication.

In Replit browser tests, establish the session through the real same-origin login instead of injecting the cookie into Chromium; the preview session cookie is Secure, Partitioned, and host-scoped.

**Why:** Manual cookie injection can be rejected by browser cookie constraints even when the real login endpoint works.

**How to apply:** Create a synthetic database-backed student, log in through the browser’s same-origin API, verify protected routes, then log out and remove only the test fixtures.

Use a synthetic student backed by the actual data store when checking protected student flows; a legacy file-backed identity is not a valid substitute.

**Why:** A tutorial capture used an old registration endpoint that created a numeric file-only identity. The Mongo-backed dashboard then failed, falsely suggesting the current signup flow was broken.

**How to apply:** Verify that the test identity exists in the application's actual user store before interpreting dashboard failures. Keep temporary contacts notification-disabled and remove only records owned by the fixture.

Exam verification must cover starting actual questions, not merely opening a catalog or following its links.

**Why:** A catalog can render successfully while its start handler redirects home, its question payload has no usable identity/options, or the exam fails to load. Route-only checks previously missed those failures.

**How to apply:** For an exam-start regression, verify the affected starts with an authenticated student and check one saved result when grading/persistence is affected. Freeze code and finish workflow restarts before that pass: hot reloads can reset active exam state, and restarting the API mid-pass can produce transient proxy 502 errors that obscure actual failures. Treat unpublished content separately from a working exam.

Successful question loading and TypeScript checks do not establish successful final submission or a persisted detailed report.

**Why:** Runtime persistence validation rejected new exam variants even though their questions opened. The scored result and detailed timing report are separate persistence flows.

**How to apply:** Check runtime model validation for new variants, submit a trusted scored roster, and reload student history. When integrating a new runner, connect both score saving and the shared question-timing/report flow.

Per-answer feedback must never finalize a whole exam's timing or archive a completed exam report.

**Why:** A generic submit-request interceptor treated adaptive answer feedback as exam completion, fragmenting a session into one-question reports. Automatic archiving can also race a later full-roster report when unseen skipped questions are registered too late.

**How to apply:** Distinguish answer-feedback requests from exam-finalization requests. Register the complete scored roster before automatic final archiving, including skipped items, and verify one full-session report rather than only its aggregate score.
---
name: Authenticated preview checks
description: How to interpret session API responses while visually checking a public preview
---

An unauthenticated 401 from a session-only API during a screenshot of a public route is expected and is not evidence of an automatic logout regression. Public rendering and authenticated routes must be checked separately.

**Why:** The preview browser may not carry the user's existing session, while the app correctly asks the server for the current user.

**How to apply:** Treat the public shell and browser console as healthy when the only auth-related log is an expected 401; use an authenticated session or targeted API test to verify dashboard, notification, booking, and protected navigation behavior.
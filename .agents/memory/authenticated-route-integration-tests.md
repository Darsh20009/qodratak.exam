---
name: Authenticated route integration tests
description: How to run authenticated HTTP integration tests against Mongo-backed API routes without leaking application-owned handles.
---

Authenticated API integration tests should create isolated Mongo fixtures, authenticate through the real login endpoint, and use the app's existing session fallback while the Mongoose connection remains real.

**Why:** The full route registration starts background work, and connect-mongo owns its client inside express-session closure; importing the production app with Mongo-backed sessions leaves a test handle that is difficult to close cleanly.

**How to apply:** Temporarily omit `MONGODB_URI` only while importing the app for the test, restore it before requests, keep Mongo connected for fixture and route data, disable unrelated test-environment schedulers, and clean up fixtures plus the Mongoose connection in `finally`.
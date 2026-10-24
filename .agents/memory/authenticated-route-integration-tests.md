---
name: Authenticated route integration tests
description: How to run authenticated HTTP integration tests against Mongo-backed API routes without leaking application-owned handles.
---

Authenticated API integration tests should use an isolated Mongo database, create fixtures, authenticate through the real login endpoint, and use the app's existing session fallback while Mongoose remains real. The available Mongo role does not permit `dropDatabase`; clean only test-owned records and reuse a clearly named test database.

**Why:** The full route registration starts background work, connect-mongo owns its client inside express-session closure, and the database role forbids database-wide drops. Shared preview content also makes global count assertions unreliable.

**How to apply:** Use a test-only database suffix; temporarily omit `MONGODB_URI` only while importing the app for the test, restore it before requests, keep Mongo connected for fixture and route data, give every fixture attempt an explicit unique idempotency key, disable unrelated test-environment schedulers, and clean up fixture records plus the Mongoose connection in `finally`. Never call `dropDatabase` unless the test environment explicitly grants it.
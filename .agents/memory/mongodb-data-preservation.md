---
name: MongoDB data preservation
description: Safety rule for future Qodratak persistence and migration work.
---

Treat the connected MongoDB database as an existing dataset. Future persistence migrations must preserve existing users, subscriptions, questions, bookings, and results; use additive or idempotent operations and inspect counts before writes.

**Why:** The database already contained application records when persistent storage was enabled, so replacing or blindly reseeding it could destroy live data.

**How to apply:** Before any migration or backfill, perform a read-only inventory, avoid destructive collection operations, and use stable identifiers or unique fields to prevent duplicate records.
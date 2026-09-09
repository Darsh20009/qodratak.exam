---
name: Persistent media boundary
description: Rule for user-uploaded media when cloud storage is unavailable.
---

Production uploads must use a configured persistent media provider and fail clearly when none is available; local files are permitted only as an explicit development fallback.

**Why:** The app runs on ephemeral deployments, so accepting a local upload in production creates a successful-looking URL that disappears after restart.

**How to apply:** Keep URLs and provider metadata in MongoDB, preserve legacy local URLs for reads and migration, and never silently fall back to disk in production.
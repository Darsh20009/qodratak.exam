---
name: Development admin fixture
description: Why the local admin demo account must not depend on legacy exported users.
---

The development-only admin demo identity must have an explicit fixture fallback; the legacy user export is not guaranteed to exist in a fresh workspace or migrated deployment.

**Why:** The admin login screen exposed a demo account while the old JSON export was absent, making the documented local login fail even though the API and UI were otherwise healthy.

**How to apply:** Keep any fallback limited to non-production environments and the fixed demo identity. Never use it as a production authentication path or as a substitute for MongoDB admin records.
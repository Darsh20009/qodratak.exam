---
name: Server session authority
description: Authentication and route-access decisions must use the server session rather than browser cache data.
---

The authenticated session returned by the server is the only source of truth for access to internal pages. Browser `localStorage` may mirror user data for legacy display code, but it must never authenticate a visitor or select an internal route.

**Why:** cached browser data can survive logout, session expiry, or a different server environment and can otherwise expose internal screens or create redirect loops during login.

**How to apply:** use the server user query for route guards and root-page selection; update its cache immediately after login; clear browser user cache when the server reports an unauthenticated session.
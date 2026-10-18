---
name: Foundation media routing
description: How R2-backed foundation media must be routed through the path-based API artifact in Replit previews.
---

For Qodratak, the web artifact owns `/` while the API artifact is routed under `/api`. A request to `/foundation/quantitative/...` can reach Vite’s SPA fallback and return `200 text/html`, even though the API server also has a root media route.

**Rule:** Keep a root route for production/API-host compatibility, and mount an API-prefixed media alias. When no public asset base URL is configured, resolve quantitative media through `/api/foundation/quantitative`.

**Why:** Replit routes service traffic by artifact path. A successful HTTP status alone can hide an SPA fallback, leaving uploaded lesson and question media unavailable in preview.

**How to apply:** Test the exact shared-proxy asset URL with HEAD or GET and verify `Content-Type` is the expected image/video type. Preserve external R2 asset-base precedence.

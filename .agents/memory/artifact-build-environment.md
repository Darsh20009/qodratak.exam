---
name: Artifact build environment
description: Environment values required when building an artifact outside its managed workflow.
---

Standalone builds of path-routed web artifacts must provide both `PORT` and `BASE_PATH`; the managed workflow injects them automatically, but a direct build command does not.

**Why:** The Vite configuration intentionally fails fast when either value is missing, so a plain package build can look like a code failure even when the app is healthy.

**How to apply:** Use the artifact’s configured preview base path and a supported build port for one-off production builds; do not weaken the Vite configuration to hide missing routing configuration.

In this app, origin-root `/api/` endpoints must bypass the artifact asset base-path resolver; foundation media paths still use the configured base or external asset host.

**Why:** Resolving an API stream as an asset-relative URL can place `/api/...` underneath the web artifact prefix, where the API server does not serve it.

**How to apply:** Preserve root API URLs when constructing authenticated video links; continue applying `BASE_PATH` only to app-relative assets and routes.
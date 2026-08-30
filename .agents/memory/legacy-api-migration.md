---
name: Legacy API migration strategy
description: Why Qodratak keeps its established fetch layer and complex server initialization instead of a broad API rewrite.
---

Keep Qodratak’s existing client fetch layer and full server startup sequence intact when changing workspace or artifact structure. Do not replace the large legacy API with generated hooks as part of unrelated migration work.

**Why:** The product has many routes, background schedulers, WebSockets, file-backed compatibility paths, Mongo initialization, WhatsApp restoration, and custom client error handling. A broad API rewrite during structural work creates a high risk of silent feature loss.

**How to apply:** For future workspace, routing, or deployment changes, make targeted adapter changes around artifact paths and gateway prefixes. Treat API modernization as a separate, explicitly scoped project with end-to-end regression coverage.

The API artifact must start with the workspace root as its current working directory, even though its build output lives under `artifacts/api-server`.

**Why:** The migrated legacy backend still has many runtime-relative paths for user data, questions, uploads, and WhatsApp state. Starting it from the artifact directory makes valid routes fail with `ENOENT`.

**How to apply:** Keep the API startup wrapper responsible for changing to the workspace root before importing the server bundle. Do not compensate by rewriting individual relative paths during unrelated feature work.
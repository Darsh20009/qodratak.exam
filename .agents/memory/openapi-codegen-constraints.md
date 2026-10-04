---
name: OpenAPI codegen constraints
description: Schema and route-shape limitations encountered in this workspace's generated API clients.
---

For API contracts, avoid integer schema formats that generate unsupported Zod `.int()` calls and URI formats that generate unsupported Zod `.url()` calls in the current toolchain. Keep path parameters simple and uniquely named; where generated parameter types collide, use fixed paths or move variable inputs into a request body.

**Why:** Contract generation failed on generated integer and URL validators plus parameter-type collisions; using numeric schemas with server-side integer/URL validation and simpler route shapes passed code generation and library typechecks.

**How to apply:** Check generated-client compatibility when adding OpenAPI routes. Prefer `number` plus explicit route validation for integer-only values, validate URLs server-side when required, and avoid reusing ambiguous parameter names across generated operations.
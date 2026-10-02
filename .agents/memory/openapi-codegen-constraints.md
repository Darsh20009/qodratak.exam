---
name: OpenAPI codegen constraints
description: Schema and route-shape limitations encountered in this workspace's generated API clients.
---

For API contracts, avoid integer schema formats that generate unsupported Zod `.int()` calls in the current toolchain. Keep path parameters simple and uniquely named; where generated parameter types collide, use fixed paths or move variable inputs into a request body.

**Why:** A contract generation run failed on the generated integer validator and parameter-type collisions; using numeric schemas with server-side integer validation and fixed routes passed code generation and library typechecks.

**How to apply:** Check generated-client compatibility when adding OpenAPI routes. Prefer `number` plus explicit route validation for integer-only values, and avoid reusing ambiguous parameter names across generated operations.
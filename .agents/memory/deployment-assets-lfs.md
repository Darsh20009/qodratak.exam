---
name: Deployment assets and Git LFS
description: How to avoid Render checkout failures caused by unavailable Git LFS objects.
---

Keep deployment checkouts independent of quota-limited Git LFS objects. Preserve required sub-100MB assets as regular Git files when external builders must clone them and LFS availability cannot be guaranteed.

**Why:** Render can fail before the build starts when Git LFS quota is exhausted. Removing only the current LFS attributes is insufficient if the staged index still contains pointer blobs.

**How to apply:** Before pushing large deployment assets, verify the current index contains the actual file rather than a Git LFS pointer. Avoid rewriting repository history unless the user explicitly approves it.
---
name: Deployment assets and Git LFS
description: How to avoid Render checkout failures caused by unavailable Git LFS objects.
---

Keep deployment checkouts independent of quota-limited Git LFS objects. Preserve required sub-100MB assets as regular Git files when external builders must clone them and LFS availability cannot be guaranteed.

**Why:** Render can fail before the build starts when Git LFS quota is exhausted. Removing only the current LFS attributes is insufficient if the staged index still contains pointer blobs.

**How to apply:** Before pushing large deployment assets, verify the current index contains the actual file rather than a Git LFS pointer. Avoid rewriting repository history unless the user explicitly approves it.

External deployment must be checked against the Dockerfile source paths, not only the service’s “live” status. Render can successfully serve an older artifact when its build still copies `.migration-backup` instead of the current app artifacts.

**Why:** A successful deployment only proves that the selected commit and build completed; it does not prove that the intended workspace artifact was built.

**How to apply:** Inspect the deployment log’s commit and Docker build context, verify the served HTML reflects the current artifact, then deploy the latest pushed commit after correcting source paths.
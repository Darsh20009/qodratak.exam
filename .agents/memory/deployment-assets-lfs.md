---
name: Deployment assets and Git LFS
description: How to avoid Render checkout failures caused by unavailable Git LFS objects.
---

Keep deployment checkouts independent of quota-limited Git LFS objects. Preserve required sub-100MB assets as regular Git files when external builders must clone them and LFS availability cannot be guaranteed.

**Why:** Render can fail before the build starts when Git LFS quota is exhausted. Removing only the current LFS attributes is insufficient if the staged index still contains pointer blobs.

**How to apply:** Before pushing large deployment assets, verify the current index contains the actual file rather than a Git LFS pointer. Avoid rewriting repository history unless the user explicitly approves it.

Stage bulk media imports in bounded batches instead of one repository-wide `git add`: an interrupted operation can preserve completed LFS objects while leaving the index unchanged.

**Why:** A workspace restart interrupted large-media staging, leaving no staged entries despite a substantial local LFS cache.

**How to apply:** Group ordinary files into bounded batches and stage oversized LFS files individually; after interruptions, verify staged and untracked counts before resuming.

External deployment must be checked against the Dockerfile source paths, not only the service’s “live” status. Render can successfully serve an older artifact when its build still copies `.migration-backup` instead of the current app artifacts.

**Why:** A successful deployment only proves that the selected commit and build completed; it does not prove that the intended workspace artifact was built.

**How to apply:** Inspect the deployment log’s commit and Docker build context, verify the served HTML reflects the current artifact, then deploy the latest pushed commit after correcting source paths.

GitHub's warning threshold for regular Git files is distinct from whether a push succeeds. Chunking commits can make a large pack upload succeed while GH001 warnings remain for individual files over 50 MB.

**Why:** A successful chunked upload still produced GH001 warnings for regular media files between roughly 57 MB and 94 MB.

**How to apply:** Check per-file sizes separately from total pack size. Chunking addresses pack transfer size; if the user approves LFS, consider migrating warning-size media too, while confirming the deployment builder can fetch it.
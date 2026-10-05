---
name: Large attachment staging
description: Avoid copying large attached assets when preparing temporary upload batches in this workspace.
---

When staging large attached files for upload, create temporary hard links under the workspace rather than under `/tmp`.

**Why:** `/tmp` is mounted on a different filesystem from the workspace, so hard links fail there and copying large PDFs creates unnecessary duplicate storage.

**How to apply:** Use a temporary directory under `.agents/outputs`, then remove the staging links after the upload.
---
name: Local foundation video playback
description: Local MP4 foundation assets need native video rendering rather than provider iframe embedding.
---

Foundation video and PDF attachment URLs may be relative or root-leading local paths. Resolve every local asset against Vite's `BASE_URL`, not the current document URL, across foundation lessons, computerized-bank cards, the reader, and answer review. Render local video with a native HTML video element; keep YouTube and Vimeo on the provider embed path.

**Why:** The foundation lesson page and computerized-bank listing are separate entry points; fixing one does not fix the other. A relative path can resolve beneath a nested page and fail. MP4 playback also needs byte ranges, and review clips must seek only after media metadata loads.

**How to apply:** Use one base-aware asset resolver for both `video.src` and PDF attachment links in every entry point. Preserve `video/mp4` byte-range serving; seek answer-review clips after `loadedmetadata`.

For large Cloudflare R2 media objects, use multipart upload with 64 MiB parts above 128 MiB and verify the completed object by size and SHA-256 metadata. A direct upload around 232 MiB returned 502, while the multipart test succeeded.

**Why:** A successful S3-compatible upload path is not guaranteed for large single PUT requests; multipart is the tested path for these assets.

**How to apply:** Keep local originals until transfer verification and public-host byte-range checks both pass; an S3 endpoint's 206 response alone does not verify the public URL.
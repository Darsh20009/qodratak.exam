---
name: Local foundation video playback
description: Local MP4 foundation assets need native video rendering rather than provider iframe embedding.
---

Foundation video and PDF attachment URLs may be relative or root-leading local paths. Resolve every local asset against Vite's `BASE_URL`, not the current document URL, across foundation lessons, computerized-bank cards, the reader, and answer review. Render local video with a native HTML video element; keep YouTube and Vimeo on the provider embed path.

**Why:** The foundation lesson page and computerized-bank listing are separate entry points; fixing one does not fix the other. A relative path can resolve beneath a nested page and fail. MP4 playback also needs byte ranges, and review clips must seek only after media metadata loads.

**How to apply:** Use one base-aware asset resolver for both `video.src` and PDF attachment links in every entry point. Preserve `video/mp4` byte-range serving; seek answer-review clips after `loadedmetadata`.
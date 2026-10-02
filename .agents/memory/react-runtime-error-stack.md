---
name: React runtime error stack logging
description: Preserve source and component frames in development logs from React root error callbacks.
---

In development, format React root error callback details as explicit text containing the JavaScript error name/message/stack and React component stack. Do not rely on raw `Error` or React error-info objects being serialized faithfully by browser log collectors.

**Why:** The Replit browser console collector can reduce raw errors to their message and truncate internal React DOM frames, hiding the component ancestry needed to diagnose runtime failures.

**How to apply:** Keep richer logging behind the development guard, include both `error.stack` and `info.componentStack`, and avoid monkey-patching React or the DOM.
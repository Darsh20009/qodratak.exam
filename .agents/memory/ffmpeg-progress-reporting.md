---
name: FFmpeg progress reporting
description: Monitor long FFmpeg conversions without interrupting running encoders.
---

Configure FFmpeg progress reporting when starting a process (for example, `-progress pipe:1 -stats_period 60`). Do not send SIGUSR1 to a running FFmpeg process in this environment.

**Why:** A SIGUSR1 diagnostic attempt terminated active FFmpeg conversions and left partial files that had to be discarded.

**How to apply:** Include progress output at launch or inspect temporary output-file growth; only use signals whose support has been confirmed.
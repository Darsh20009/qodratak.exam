---
name: Landing-only store verification badge
description: User scope rule for the Saudi Business Center floating verification badge.
---

The user wants the «متجر موثّق» floating badge only on the public homepage landing page, never in any dashboard or other page.

**Why:** The user explicitly restricted this badge to the landing page. The root URL can also render an authenticated dashboard, so pathname alone cannot establish eligibility.

**How to apply:** Tie eligibility to the actual public landing view. Keep third-party injected badge and certificate UI hidden by default elsewhere, including after navigating away or resolving a signed-in session.

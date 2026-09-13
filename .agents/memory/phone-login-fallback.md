---
name: Phone login fallback
description: The reliable login path when WhatsApp OTP delivery is unavailable
---

Phone-number login should offer password authentication first and keep WhatsApp OTP as an alternate path. If OTP delivery reports that WhatsApp is unavailable, move the user to password login with a clear message rather than leaving the form unusable.

**Why:** OTP delivery depends on an external WhatsApp connection, while the server password-login path can work independently. Making OTP the only initial path caused valid users to appear unable to sign in during WhatsApp outages.

**How to apply:** Preserve this fallback in future auth UI changes, and do not treat a WhatsApp delivery failure as a failed account or session.
---
name: Phone login fallback
description: The reliable login path when WhatsApp OTP delivery is unavailable
---

WhatsApp OTP is the default phone-login option, as requested by the user. Keep password login available as an explicit fallback, alongside email/password and verified invitation-code registration. If OTP delivery is unavailable, explain the outage and offer password login rather than treating the account as nonexistent.

**Why:** The user requested WhatsApp-code login as the default. Delivery still depends on an external connection, so making it the only usable method would prevent valid users from signing in during outages.

**How to apply:** Preserve this fallback in future auth UI changes, and do not treat a WhatsApp delivery failure as a failed account or session.

Historical accounts can store equivalent Saudi numbers in different formats. A failed phone lookup does not establish that the account is missing; preserve the existing identity rather than replacing or resetting it.

**Why:** An institution owner could log in by email but not phone because the lookup did not cover historical number formats.

**How to apply:** Check number formatting and lookup behavior first. Changing an institution's contact phone must not silently transfer its owner's account or access.
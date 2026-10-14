---
name: Geidea timeout and payment authority
description: Distinguish the requested ten-minute platform wait from a provider-confirmed refusal or cancellation.
---

Geidea card subscriptions activate automatically only after the server confirms the matching provider order, amount, and currency. Administrative approval/rejection is reserved for non-Geidea flows. The user requested a ten-minute processing window and invoices in the student's account.

**Why:** A browser closing, an administrative rejection of an attempt, or a local timeout does not prove that no charge occurred. The supplied Geidea documentation describes a default fifteen-minute session lifetime; the platform's ten-minute waiting window is not evidence of provider-side cancellation. Delayed successful charges must remain recoverable without double-extending the subscription.

**How to apply:** Keep UI timeout wording distinct from a confirmed decline. Do not promise that a Geidea session was revoked unless the provider actually confirms that operation. Verify late callbacks against provider orders before activating; preserve idempotency, renewals, invoice evidence, and notification retries independently of the student's browser.

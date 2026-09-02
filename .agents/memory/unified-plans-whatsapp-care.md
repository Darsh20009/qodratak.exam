---
name: Unified plans and WhatsApp care
description: Durable rules for subscription pricing and student WhatsApp follow-up
---

All customer-facing purchase and activation paths must read the current primary subscription plan from one central setting; historical subscription records keep their stored price and dates.

**Why:** Legacy purchase routes had conflicting prices and durations, while changing old records would corrupt financial history.

**How to apply:** Use the primary plan for the public subscription page, wallet/receipt/manual activation, and future payment adapters. Treat old subscription documents as immutable history.

Daily student WhatsApp follow-ups must claim the Riyadh calendar day atomically before sending, and release the claim if delivery fails.

**Why:** The scheduler can overlap during restarts or multiple checks, and a simple read-then-write allows duplicate messages.

**How to apply:** Keep the KSA day boundary explicit and honor the student's WhatsApp opt-out before sending.
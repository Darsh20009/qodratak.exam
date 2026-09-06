---
name: Unified plans and WhatsApp care
description: Durable rules for subscription pricing and student WhatsApp follow-up
---

All customer-facing purchase and activation paths must read the current primary subscription plan from one central setting; historical subscription records keep their stored price and dates.

**Why:** Legacy purchase routes had conflicting prices and durations, while changing old records would corrupt financial history.

**How to apply:** Use the primary plan for the public subscription page, wallet/receipt/manual activation, and future payment adapters. Treat old subscription documents as immutable history.

WhatsApp outbound delivery is restricted to OTP, customer purchase confirmations, admin new-student/subscription alerts, and one end-of-day admin report. Everything must use one prioritized FIFO queue with at least three seconds between sends.

**Why:** Bulk campaigns, automated study follow-ups, bot replies, and parallel schedulers created excessive daily volume and put the linked WhatsApp account at risk of suspension.

**How to apply:** Add no direct or bulk WhatsApp send path outside the central allowlist. Keep OTP highest priority, transactional customer messages next, admin event alerts after them, and the daily report last.
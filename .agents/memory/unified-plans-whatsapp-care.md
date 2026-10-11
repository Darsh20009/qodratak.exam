---
name: Unified plans and WhatsApp care
description: Durable rules for subscription pricing and student WhatsApp follow-up
---

All customer-facing purchase and activation paths must read the current primary subscription plan from one central setting; historical subscription records keep their stored price and dates.

**Why:** Legacy purchase routes had conflicting prices and durations, while changing old records would corrupt financial history.

**How to apply:** Use the primary plan for the public subscription page, wallet/receipt/manual activation, and future payment adapters. Treat old subscription documents as immutable history.

WhatsApp outbound delivery is restricted to OTP and essential transactional alerts, including student exam results, purchase/booking confirmations and administrative notices. Everything must use one prioritized FIFO queue with at least three seconds between sends.

**Why:** Bulk campaigns, automated study follow-ups, bot replies, and parallel schedulers created excessive daily volume and put the linked WhatsApp account at risk of suspension.

**How to apply:** Add no direct or bulk WhatsApp send path outside the central allowlist. Keep OTP highest priority, transactional customer messages next, admin event alerts after them, and the daily report last.

Student result alerts are an explicitly requested transactional exception to the earlier restriction on automated study messages.

**Why:** The user asked that the student receive their result on WhatsApp when the exam result becomes available.

**How to apply:** Send server-saved results only, respect the student's WhatsApp setting and scheduled result-release time, preserve grades when delivery fails, and deduplicate per attempt. Do not bulk-send historical results. Provider acceptance is not proof of handset delivery, and cross-provider retries cannot guarantee exactly-once delivery without provider idempotency.
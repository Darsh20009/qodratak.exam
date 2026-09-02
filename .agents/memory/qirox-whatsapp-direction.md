---
name: QIROX WhatsApp direction
description: The current QIROX Project WhatsApp API supports sending messages but does not document inbound webhooks.
---

The current QIROX integration is an outbound fallback only. Interactive student replies are received through the internal Baileys WhatsApp session; keeping the QIROX send path enabled does not provide inbound messages while that session is disconnected.

**Why:** The supplied QIROX API contract documents POST send endpoints for WhatsApp, email, and a generic API channel, but no inbound webhook or event subscription.

**How to apply:** Do not promise fully interactive WhatsApp quizzes during a Baileys outage unless QIROX supplies an authenticated inbound webhook. If that becomes available, route it into the existing inbound bot handler with signature verification and message deduplication.
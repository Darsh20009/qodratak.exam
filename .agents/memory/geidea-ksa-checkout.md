---
name: Geidea KSA checkout prerequisites
description: Saudi Geidea HPP regional endpoint and sandbox merchant configuration requirements.
---

For Saudi checkout, use the KSA Geidea API and hosted-checkout domains; do not copy an Egypt-region host from a documentation example. The sandbox merchant must have online/HPP payments enabled before session creation can succeed. Geidea response code `110` with detail `080` and “Cash on Delivery and Online payment are not configured” is an account-configuration issue, not evidence of a bad signature.

**Why:** The legacy KSA session path returned 404, while the documented v2 path reached Geidea and returned the specific merchant-configuration response. The request signature and field order matched the supplied HPP documentation.

**How to apply:** Confirm the merchant's sandbox online-payment configuration before changing credentials, signatures, or request fields. Keep smoke tests sandbox-only, stop after session creation, and never log credentials or full provider response bodies.
---
name: Geidea KSA checkout prerequisites
description: Saudi Geidea HPP regional endpoint and sandbox merchant configuration requirements.
---

For Saudi checkout, use the KSA Geidea API and hosted-checkout domains; do not copy an Egypt-region host from a documentation example. Geidea's current HPP guide lists `api.ksamerchant.geidea.net` for KSA, while its Create Session API reference labels that server Saudi Arabia Production. The test-card guide requires a Geidea-provided test merchant key but does not document a separate KSA sandbox hostname. Do not guess another host or send merchant credentials to an unverified domain. Response `110/080` with “Cash on Delivery and Online payment are not configured” means the merchant/environment selected by that request is not provisioned for online payment; verify the exact key-to-environment mapping before changing signatures.

**Why:** The legacy KSA session path returned 404, while the documented v2 path reached Geidea and returned the specific merchant-configuration response. The current HPP guide confirms the endpoint, signature formula, and hosted-checkout URL format, but public docs do not identify a separate KSA sandbox host.

**How to apply:** If test credentials receive `110/080`, confirm with Geidea which API host and merchant profile those exact test keys should use before changing credentials, signatures, or request fields. Keep smoke tests sandbox-only, stop after session creation, and never log credentials or full provider response bodies.
---
name: Geidea KSA checkout prerequisites
description: Saudi Geidea HPP regional endpoint and sandbox merchant configuration requirements.
---

For Saudi checkout, use the KSA Geidea API and hosted-checkout domains; do not copy an Egypt-region host from a documentation example. Geidea's HPP guide lists `api.ksamerchant.geidea.net` for KSA, while its Create Session reference labels that server Saudi Arabia Production; public docs do not state whether a separate KSA sandbox hostname exists. Response code `110` is only the general HPP Integration error, and the published response-code table does not define detailed code `080`. Its returned message alone does not prove whether the fault is merchant configuration, environment/key mapping, or request integration.

Qodratak does not offer Cash on Delivery; when Geidea's response mentions COD and online payments, investigate HPP/online payments only and do not request COD activation.

**Why:** The documented KSA v2 session request reached Geidea and returned `110/080`; the user challenged attributing this to Geidea's account without ruling out an integration fault. The supplied HPP guide confirms the endpoint, Basic auth, timestamp shape, signature formula, and hosted-checkout URL. A minimal request without optional customer fields returned the same error.

**How to apply:** When `110/080` occurs, compare the exact request with current docs and test a minimal documented payload before assigning fault; then verify the key, merchant profile, and environment mapping. Do not guess another host or expose credentials. Keep smoke tests non-charging and stop after session creation.
---
name: Subscription entitlement consistency
description: Rules for keeping paid access, wallet charging, and subscription documents consistent.
---

Premium access must come from an active, currently valid MongoDB subscription tied to the authenticated server identity. Browser cache and duplicated user fields are mirrors only.

**Why:** independently updated subscription records, user mirrors, and browser state can accept payment while leaving features locked. Mixed legacy identities can also break renewals.

**How to apply:** resolve legacy identities only at boundaries, store the canonical account identity for new records, and refresh access from the server after activation or approval.

Wallet debit, transaction ledger creation, and subscription creation must be one atomic operation with a conditional balance check.

**Why:** a read-then-debit flow allows concurrent purchases to overdraw a wallet or charge without creating access.

**How to apply:** use a database transaction and reject the whole operation if any step fails.

Subscription documents must describe the stored transaction rather than current plan defaults.

**Why:** pending or rejected requests are not approved invoices, zero-price grants are valid, and plan duration may change later.

**How to apply:** derive stable document numbers from immutable records, use stored prices and dates, and label each document according to its actual status.
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

New paid sales use the 3-month `Pro` plan and the 6-month `Pro Life Plus` plan; legacy subscription types remain readable for historical access.

**Why:** the product now has two paid durations while existing records and premium-access checks still depend on the established MongoDB type values.

**How to apply:** map user-facing plan keys to stored types at the API boundary, and do not rewrite historical subscriptions when prices change.

The public home page is the canonical place for plan presentation; do not reintroduce a standalone legacy pricing screen.

**Why:** a separate pricing screen drifted from the current landing experience and exposed conflicting branding and plan content.

**How to apply:** route old pricing links to the home page plan section or the existing subscription flow, and keep plan copy aligned with the home page.
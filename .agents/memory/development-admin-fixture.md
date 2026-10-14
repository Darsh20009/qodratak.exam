---
name: Real administrator access
description: Demo administrator login is removed; contracts require an active traceable administrator.
---

Do not restore shared demo credentials or demo administrator authentication on `/admin`, including in the development preview.

**Why:** The user explicitly asked to remove administrator login using demonstration credentials. The former fixture fallback is no longer the desired product behavior.

**How to apply:** Use genuine active MongoDB administrators. Automated tests may create isolated temporary administrator records and remove only their own fixtures; do not reset or replace the real operator's account.

Do not turn the shared demo identity into an actual contract issuer to make institutional setup succeed.

**Why:** Institutional contracts carry the approved platform signature and stamp; issuing them requires a traceable, active administrator, not the shared demonstration login.

**How to apply:** Explain the restriction before showing the contract-creation form and direct the operator to a real admin login. Keep account recovery separate from contract authorization.
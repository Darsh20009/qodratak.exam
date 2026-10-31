---
name: Post-merge package firewall
description: Recovery path when dependency installation after a merge is blocked by Replit’s package firewall.
---

When a frozen install is denied by the package firewall, identify the blocked dependency and check its current advisory before retrying. If it is a vulnerable transitive package, update its direct parent dependency so the lockfile resolves to a patched version. Never bypass the firewall or keep the vulnerable lock entry just to make setup pass.

**Why:** On 2026-10-31, the post-merge install was blocked on `proxy-addr@2.0.7` because of CVE-2026-90711. Updating Express to a release resolving `proxy-addr@2.0.8` allowed the configured setup script to finish.

**How to apply:** Check the package advisory and current patched version, update the parent dependency, regenerate the frozen lockfile, rerun post-merge setup, then inspect workflow startup logs for any follow-on dependency resolution errors.

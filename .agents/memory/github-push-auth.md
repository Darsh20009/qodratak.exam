---
name: GitHub publishing authentication
description: Safe handling when GitHub pushes fail from this Replit workspace.
---

A successful local commit does not mean the branch was published. Confirm the remote push result and verify the remote ref. Never put a personal access token in command text, logs, or chat.

**Why:** GitHub OAuth can return 401 or an integration can be disconnected even when a connection row exists.

**How to apply:** Check integration status and write permissions; reconnect through Replit's secure flow or request a token through Replit Secrets, then retry. Do not push unrelated local commits to work around authentication.

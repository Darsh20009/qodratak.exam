---
name: GitHub publishing authentication
description: Safe handling when GitHub pushes fail from this Replit workspace.
---

A successful local commit does not mean the branch was published. Confirm the remote push result and verify the remote ref. Never put a personal access token in command text, logs, or chat.

The Replit GitHub proxy can reject a single large Git pack with HTTP 413 even when no LFS objects remain. In this workspace, fast-forward pushes split into smaller descendant commits succeeded.

**Why:** GitHub OAuth can return 401 or an integration can be disconnected even when a connection row exists.

**How to apply:** Check integration status and write permissions; reconnect through Replit's secure flow or request a token through Replit Secrets, then retry. If authentication works but a large pack gets HTTP 413, split the fast-forward update into smaller descendant commits and verify the remote ref after each push. Do not push unrelated local commits to work around authentication.

---
name: Qodratak mailbox integration
description: Rules for keeping the official mailbox authoritative over legacy email settings.
---

The official mailbox is the source of truth for platform email: use `info@qodratak.sa` with the secure `mailserver.dmail.sa` endpoints and the dedicated secret, rather than legacy QIROX/Gmail SMTP variables.

**Why:** Older workspace variables can remain configured and silently override newer mailbox settings, causing customer mail to appear to come from the retired address.

**How to apply:** Keep mailbox-specific configuration ahead of legacy SMTP fallbacks, serialize all outbound mail, and treat IMAP/SMTP credentials as secrets. The admin mailbox should use the registered admin phone for important incoming-mail alerts.
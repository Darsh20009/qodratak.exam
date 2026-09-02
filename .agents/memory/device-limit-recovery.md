---
name: Device-limit recovery
description: The two-device limit recovery flow and its security boundary.
---

When a verified login reaches the device limit, show the account's device labels and allow deletion through a short-lived, session-bound management challenge. After deletion, register the current device and complete the login; never expose device deletion as an unauthenticated general endpoint.

**Why:** the login OTP is consumed during verification, so asking the user to delete a device and then restart login would create an unnecessary second verification loop.

**How to apply:** keep the challenge short-lived and tied to the verified account, return only public device metadata, invalidate it after the login is completed, and keep WhatsApp deletion limited to the identified account's own device list.
---
name: Wouter query navigation
description: The installed wouter behavior for SPA routes that use query parameters.
---

The installed wouter browser location hook exposes the pathname through `useLocation()` and does not include `location.search`. Components whose view depends on query parameters must subscribe with `useSearch()` instead.

**Why:** Reading the query from the pathname leaves the component on its previous view after `pushState`; the browser URL changes, but React does not receive the query state from `useLocation()`.

**How to apply:** Import `useSearch` from wouter, parse its returned search string with `URLSearchParams`, and use the wouter navigation setter or `Link` for updates.
---
name: SPA metadata ownership
description: Prevent duplicate canonical and robots tags when static fallback metadata and React Helmet both manage the document head.
---

Use one route-level owner for canonical URLs and robots directives. Page-level SEO components may set titles, descriptions, social metadata, or structured data, but must not independently claim canonical or robots ownership.

**Why:** In this Vite SPA, React Helmet did not remove the static fallback canonical and robots tags during client rendering, and multiple Helmet instances accumulated duplicate tags. Search tools then read the first, stale homepage value on nested routes.

**How to apply:** Keep a useful static homepage fallback for crawlers without JavaScript, then let the route-level SEO layer reconcile client-rendered canonical and robots tags to one value after navigation. Verify the live DOM, not only source HTML.

Never remove or imperatively deduplicate head nodes that React owns. The route-level canonical and robots owner must update its dedicated static nodes without also rendering matching React/Helmet nodes.

**Why:** With React 19 and react-helmet-async 3, Helmet delegates head tags to React's native hoisting. Removing a duplicate robots or canonical node by hand left React holding a detached node and caused a `removeChild` crash during route loading, even before the guide's hide button was clicked.

**How to apply:** Keep static fallback metadata and React-owned metadata ownership separate. Check both head tag counts and a real route mount/unmount; a typecheck or an isolated DOM helper test cannot prove that React's head lifecycle is safe.
---
name: SPA metadata ownership
description: Prevent duplicate canonical and robots tags when static fallback metadata and React Helmet both manage the document head.
---

Use one route-level owner for canonical URLs and robots directives. Page-level SEO components may set titles, descriptions, social metadata, or structured data, but must not independently claim canonical or robots ownership.

**Why:** In this Vite SPA, React Helmet did not remove the static fallback canonical and robots tags during client rendering, and multiple Helmet instances accumulated duplicate tags. Search tools then read the first, stale homepage value on nested routes.

**How to apply:** Keep a useful static homepage fallback for crawlers without JavaScript, then let the route-level SEO layer reconcile client-rendered canonical and robots tags to one value after navigation. Verify the live DOM, not only source HTML.
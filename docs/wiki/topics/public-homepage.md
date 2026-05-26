---
title: Public homepage
type: topic
slug: public-homepage
role: area
date: 2026-05-04
updated: 2026-05-26
source: code
status: active
tags: [area, public, marketing]
related: [tecxwork]
---

## Scope
The unauthenticated landing page at `/`. Hero carousel, recruiter list, jobs list, footer.

## Key code
- `src/app/page.tsx` — server component composing the page.
- `src/components/hero-carousel.tsx` — autoplay carousel + touch.
- `src/components/install-prompt.tsx` — mobile PWA install reminder shown at most three times per browser, with installed/standalone sessions suppressed.
- `src/components/homepage-image-editor.tsx` — admin overlay (no longer rendered on `/` after 2026-05-04).

## History
- 2026-05-26: Niko asked to remind users to install the PWA at most three times. The install prompt now tracks shown count in browser storage, treats the legacy one-dismissal flag as one previous reminder, and stops after three shows or after the app is installed/standalone.

---
title: Public homepage
type: entity
slug: public-homepage
role: area
date: 2026-05-04
updated: 2026-05-04
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
- `src/components/homepage-image-editor.tsx` — admin overlay (no longer rendered on `/` after 2026-05-04).

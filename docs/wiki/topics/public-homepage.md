---
title: Public homepage
type: topic
slug: public-homepage
role: area
date: 2026-05-04
updated: 2026-05-27
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
- `public/manifest.json` and root metadata in `src/app/layout.tsx` — install-facing PWA name/icon metadata.
- `src/components/homepage-image-editor.tsx` — admin overlay (no longer rendered on `/` after 2026-05-04).

## History
- 2026-05-27: Niko noted that homepage company cards still used the older design. The homepage company section now reuses the shared `RecruiterCard` used by the company directory, including the larger logo/title layout, industry badge treatment, position chips, and JD availability indicator.
- 2026-05-27: Niko shared an iOS Add to Home Screen screenshot showing the event name and a fallback V icon. The PWA install metadata now uses `tecxwork` for the manifest and Apple Web App title, declares tecxwork icons explicitly, and adds an Apple touch icon route at `/apple-icon.png`.
- 2026-05-26: Niko asked to remind users to install the PWA at most three times. The install prompt now tracks shown count in browser storage, treats the legacy one-dismissal flag as one previous reminder, and stops after three shows or after the app is installed/standalone.

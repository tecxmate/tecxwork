---
title: Hero carousel
type: topic
slug: hero-carousel
date: 2026-05-04
updated: 2026-05-04
belongs_to: [public-homepage]
source: synthesis
status: active
tags: [hero, ui, i18n, mobile]
related: [photo-uploads, 2026-05-04-photo-upload-guidelines, 2026-05-04-hero-photo-localization, 2026-05-04-carousel-touch-smoothness, 2026-05-04-hero-image-contain]
---

## Summary
The homepage hero is a touch-friendly carousel of full-photo slides, one slide per visitor (locale-matched), preceded by the text+countdown slide.

## Current state
- `src/components/hero-carousel.tsx` — autoplay (8s for text slide, 5s for photos), suppressed during touch + 600 ms grace window after release; iOS momentum scrolling enabled.
- Slides use `object-contain` on `bg-background` — full photo visible, mobile horizontal fit, no top crop under sticky topbar.
- Photo aspect ratio target: **3:4 vertical**, recommended 1200×1600px.
- Visitor sees one photo matching their locale (`localeSlot[locale]` → `homepageImages[slotIndex]`), with fallback to the first non-empty slot.

## Open questions
- Should the locale-matched photo come **before** the text+countdown slide? (Discussed 2026-05-04; not yet implemented.)
- Activity-photos / event-photo grid was removed. If it returns, it must remain admin-controlled (no placeholders).

## History
- 2026-05-04 — set 3:4 vertical, removed activity-photos section ([decision](../decisions/2026-05-04-photo-upload-guidelines.md))
- 2026-05-04 — `object-contain` for full-photo display ([decision](../decisions/2026-05-04-hero-image-contain.md))
- 2026-05-04 — touch-smooth autoplay ([decision](../decisions/2026-05-04-carousel-touch-smoothness.md))
- 2026-05-04 — locale-matched single photo ([decision](../decisions/2026-05-04-hero-photo-localization.md))

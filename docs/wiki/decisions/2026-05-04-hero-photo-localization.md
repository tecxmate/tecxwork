---
title: Hero photo localization — one slot per language
type: decision
slug: 2026-05-04-hero-photo-localization
date: 2026-05-04
attributed_to: [niko]
belongs_to: [admin-panel, public-homepage]
source: chat
status: active
tags: [i18n, hero, uploads]
related: [hero-carousel, photo-uploads]
---

## Context
Niko wanted "one picture per language" instead of three pictures shared across all visitors. The question was UX: tap-to-switch vs. an admin-side language label.

## Decision
- Admin uploader exposes **three labeled slots — EN, VI, 中文** — each a single `ImageUpload` for `homepageImages[0]`, `[1]`, `[2]` respectively.
- Public homepage shows the photo matching the visitor's locale; falls back to any other slot if the matched slot is empty.
- Tap-to-switch was rejected — taps elsewhere mean "advance carousel" / "open link"; overloading was deemed confusing.

## Rationale
Per [niko]: simpler mental model for both admin and visitor. Locale switch already exists in the topbar; visitor tapping the photo to switch language would be a hidden gesture.

## Consequences
- `src/app/api/admin/homepage-images/route.ts` validates **positional** slots (length 3, empty strings preserved).
- `src/app/admin/admin-dashboard.tsx` replaces `MultiImageUpload` with three labeled `ImageUpload` slots.
- `src/components/image-upload.tsx` adds a portrait preview (`h-48 w-36`) for `type === "homepage"`.
- `src/app/page.tsx` selects the matched image via `localeSlot[locale]` with fallback.

## Provenance
- Discussed 2026-05-04 between [niko] and [claude-code]. [claude-code] presented options A/B; [niko] picked option A (one photo shown, matched).
- Implementing commit: `ca99565`.

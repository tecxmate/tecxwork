---
title: Hero image fits the page (object-contain)
type: decision
slug: 2026-05-04-hero-image-contain
date: 2026-05-04
attributed_to: [niko]
belongs_to: [public-homepage]
source: chat
status: active
tags: [ui, mobile, hero]
related: [hero-carousel]
---

## Context
With `object-cover`, the hero image was being cropped — mobile horizontals lost edges, and the topbar visually overlapped the top region.

## Decision
- Use `object-contain` on a `bg-background` container so the whole photo is visible without cropping. On mobile this also means the photo fits horizontally with letterboxing as needed.

## Rationale
Per [niko]: the photo carries event branding; nothing should be cropped, especially the title bar.

## Consequences
- `src/components/hero-carousel.tsx` slide image switched from `object-cover` to `object-contain` with `bg-background` parent.

## Provenance
- Implementing commit: `885abf4`.

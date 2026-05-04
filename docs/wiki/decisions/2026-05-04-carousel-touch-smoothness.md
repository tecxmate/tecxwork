---
title: Smooth touch swipes on hero carousel
type: decision
slug: 2026-05-04-carousel-touch-smoothness
date: 2026-05-04
attributed_to: [niko]
belongs_to: [public-homepage]
source: chat
status: active
tags: [ui, mobile, carousel]
related: [hero-carousel]
---

## Context
The carousel felt jagged on touch — the autoplay timer's `track.scrollTo({behavior: "smooth"})` fought against in-progress swipes and momentum scrolling.

## Decision
- Track touch state directly on the scroll container (`touchstart` / `touchend` / `touchcancel`).
- Suppress autoplay-driven `scrollTo` while a touch is active and for 600 ms after release (let momentum settle).
- Resume autoplay 1200 ms after touch end.
- Add `-webkit-overflow-scrolling: touch` (iOS momentum) and `overscroll-behavior-x: contain`.

## Rationale
Per [niko]: feel should match a normal native swipe.

## Consequences
- `src/components/hero-carousel.tsx` adds `touchingRef` and `userScrollUntilRef`; removes the React `onTouchStart/End` on the section.

## Provenance
- Implementing commit: `abd39c1`.

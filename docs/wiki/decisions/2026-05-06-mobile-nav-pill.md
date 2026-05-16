---
title: Mobile bottom nav → floating pill with sliding indicator
type: decision
slug: 2026-05-06-mobile-nav-pill
date: 2026-05-06
updated: 2026-05-15
attributed_to: [niko]
belongs_to: [design-system, public-homepage]
source: chat
status: active
tags: [mobile, navigation, ui]
related: [design-system, 2026-04-30-navigation-consolidation]
---

## Context
Niko shared two iOS reference screenshots (Telegram-style call-tab pill, Facebook tabbar) and asked whether the mobile bottom nav should adopt that floating-pill pattern with a smooth selector transition between pages. Existing mobile nav was a solid bottom bar with a per-item circular-bubble active indicator.

## Decision
Refactor `src/components/mobile-bottom-nav.tsx` into a centered floating pill containing a single absolutely-positioned active indicator that slides between items. Single pill (no separate outer search button). Keep `pendingHref` optimistic-active logic, prefetch-on-idle, route hide-list, and i18n labels unchanged.

## Rationale
- One sliding indicator (animating `transform` + `width`) is cheaper than animating per-item bubbles and reads more clearly as a tab indicator.
- Floating pill matches the iOS app patterns Niko cited and feels modern on mobile.
- Single pill, not pill+separate-button, was chosen for clarity and fewer moving parts.

## Consequences
- New refs/state: `containerRef`, `itemRefs` map, `indicator {x,w}`, `animateIndicator`. Measurement runs in `useLayoutEffect` and via `ResizeObserver` on container + items + `orientationchange`.
- First paint of the indicator is unanimated to avoid sliding in from `(0,0)`; subsequent updates use `transition-[transform,width] duration-300 ease-out`.
- `site-footer` mobile bottom padding bumped by ~0.875rem across browser, Android PWA, and iOS PWA so footer links clear the floating pill.
- Pre-existing /jobs route-change wobble (the bar moving down then snapping back up during URL-bar collapse/expand) became more visible with the floating layout. Mitigated by anchoring with `bottom: calc(100dvh - 100svh + max(0.5rem, env(safe-area-inset-bottom)))` so the pill stays put while Android Chrome's URL bar animates.
- iOS Safari's bottom-toolbar behavior makes that calc push the pill too high (large gap below it on scrolled state), so iOS falls back via `@supports (-webkit-touch-callout: none)` to plain `bottom: max(0.5rem, env(safe-area-inset-bottom))`. Niko confirmed Android works great and asked iOS sit lower.
- On 2026-05-13, Niko shared Android Chromium screenshots where the `/jobs` route framed incorrectly while iOS and other pages looked fine. The Android `dvh-svh` bottom offset is now scoped to non-standalone browser mode only, because standalone mode has no URL bar to stabilize. PWA viewport/manifest theme color is now the app background (`#FAFAFA`) and `colorScheme` is light. A later attempt to remove `viewport-fit=cover` was reverted because it broke iPhone rendering.
- On 2026-05-15, Niko clarified that mobile nav labels should not wrap to a second line when a tab title is too long; if any tab label is cramped, all tabs should hide their text labels and show icons only.
- On 2026-05-16, a React hydration mismatch surfaced around the mobile nav's label measurement spans and client-only device/layout calculations. The nav is now loaded through a no-SSR client wrapper so the server never emits mobile-nav HTML; the measured pill renders only after hydration.

## Provenance
- Discussed on 2026-05-06 between [niko] (owner) and [claude-code] (agent).
- Implementing commits: `546a6ba` (pill + sliding indicator + footer padding), `3b037b2` (Android URL-bar stabilizer, iOS scoping).

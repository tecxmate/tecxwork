---
title: The mobile nav pill scrolls horizontally instead of splitting into equal columns
type: decision
slug: 2026-08-12-mobile-nav-scrollable
date: 2026-08-12
updated: 2026-08-12
attributed_to: [niko]
belongs_to: [design-system, recruiter-dashboard]
source: request
status: accepted
tags: [ui, navigation, mobile, bug]
related: [2026-08-12-workspace-rail-brand-and-account, design-system]
---

## The ask

niko: *"on mobile. since you cannot show all these button on four tab of 1 floating pill, you
can make the item inside the pill horizontally scrollable?"*

## What was wrong

The pill was a CSS grid of `repeat(items.length, minmax(0, 1fr))` — it divided its width by
the number of destinations. Fine at four. An agency has **twelve**, which is about 30px each,
and the fallback made it worse: when any label failed to fit, *every* label was dropped and
the pill became twelve unlabelled icons.

## What it is now

A flex row with `overflow-x: auto`. Each item is `grow shrink-0`, so:

- four items still spread across the full pill, exactly as before;
- twelve take the width their labels need and the row scrolls.

Labels are always shown, which retires the icon-only fallback and the measuring machinery
behind it — a `ResizeObserver`, an orientation listener, a hidden measuring span per item and
a `Set` of hrefs. Horizontal scrolling makes all of it dead code.

Scrolling starts at the left rather than centring the row: `justify-center` on an overflowing
flex container pushes the first items past the scroll origin, where no gesture can reach them.

Two things had to follow:

- **The active tab scrolls itself into view.** Otherwise an agency opening Billing sees a row
  parked on Interviews with no sign of where they are. First run jumps, later ones glide.
- **The indicator is measured in content coordinates** (`+ container.scrollLeft`). It is
  absolutely positioned inside the scroll container, so it scrolls with the tabs; without the
  offset it would sit under whichever tab happened to occupy that slot on screen.

## A pre-existing bug this surfaced

The active pill **was not rendering at all on a cold load**, in any role. `mounted` gates the
whole component behind a `requestAnimationFrame`, so the first pass returns `null` — and the
measuring effects, keyed on `[measure, items.length]`, ran against a container and item refs
that did not exist yet. Their deps never changed afterwards, so they never ran again. The
indicator only appeared after a client-side navigation changed `measure`'s identity.

Adding `mounted` to the dependency arrays fixes it. Worth remembering as a shape rather than
an incident: **an effect that reads refs, in a component with a mount gate, needs the gate in
its deps** — otherwise it runs exactly once, at the moment there is nothing to read.

Found only because the scroll-into-view failed the same way and the probe printed
`directSpans: 0`.

## Verified

At 390px against a seeded agency account:

| role | tabs | labels | scrolls | active in view |
|---|---|---|---|---|
| agency recruiter, on Billing | 12 | 12 | yes (863 / 364) | yes, `scrollLeft` 442 |
| agency recruiter, on Interviews | 12 | 12 | yes | yes, `scrollLeft` 0 |
| guest | 4 | 4 | no (364 / 364) | yes |

Indicator tracks the active tab to within 1px in every case, including after scrolling the row
by hand. No page-level horizontal scroll. tsc 0, lint 0 errors.

---
title: The manual screenshots are repainted, not re-captured
type: decision
slug: 2026-08-16-screenshot-rebrand-by-repaint
date: 2026-08-16
updated: 2026-08-16
attributed_to: [niko]
belongs_to: [platform-manual]
source: chat
status: active
tags: [manual, branding, screenshots]
related: [platform-manual, demo-db-manual-capture, tecxmate, yang-luck]
---

## Context

The 63 manual screenshots were captured on 2026-08-11 against the Yang Luck demo and were
never re-taken. Every one of them carried the client's lockup in the header and the
client's name in the footer, and the repo is public.

Re-capturing means standing up a de-branded demo database, seeding it with names that
belong to nobody, and driving `capture-all.mjs` over 63 pages — a day's work that also has
to wait for the product to stop moving. Niko asked for the cheap path instead:

> *"Find the most programmatically efficient [way] to it. Replace the Yang Luck logo to
> TECXMATE branding. I think you can put tecxmate and tecxwork logo on top left ... because
> you don't have to take the screenshot all over again."*

## Decision

Repaint the brand in place rather than re-capture. Two surfaces qualified, because both are
fixed-size elements sitting on a flat background:

- **The header lockup** — 49 occurrences across 49 files, in three layouts (top bar,
  rail + top bar, and none at all on the apply/auth pages).
- **The footer line** — 62 occurrences, one per page that renders `SiteFooter`.

Everything else was left alone and is listed under Limits below.

## How

The replacement art is rendered by the same browser at `capture-all.mjs`'s device scale
factor (2, off a 1440px viewport) and downscaled by `optimize.py`'s factor (2100/2880), so
its glyphs are rasterised and resampled exactly like the pixels beside them. Fonts come
from the Next font cache in `.next/`, so it is the real Instrument Serif and Geist, not a
lookalike.

Finding the lockups is two-stage on purpose. Anchoring on the red of the Yang Luck mark is
cheap but not specific — the job-moderation table's red **Reject** buttons matched it, 210
times. Each anchor is therefore verified against a template cut from a known-good lockup;
real ones score 0.4–3.1 mean grey levels of difference, buttons do not come close. The
footer is anchored on the purple `TECXMATE.COM` link, the one unambiguous landmark in that
line, then grown left and right to the ends of the run.

Before painting, the frame just outside each fill is measured for flatness. Worst deviation
across all 111 fills was 0.63 grey levels, so no gradient or border was destroyed by a flat
fill.

Files are re-encoded at `optimize.py`'s own quality 78 / method 6. That costs the untouched
pixels one extra lossy generation; at 2x zoom on CJK body text the second pass is not
distinguishable from the first, and the set got *smaller* (7.1 MB → 6.5 MB).

Tooling lives in `docs/manual/src/rebrand/` so this is repeatable, and
`artifact-fragment.html` was rebuilt — it inlines the screenshots as base64, so patching
the `.webp` files alone would have left 56 Yang Luck captures sitting in the repo.

## Limits — what this does NOT fix

Repainting only reaches the brand furniture. Still stale in the screenshots:

- **`"Sign Up for Yang Luck 揚運"`** (pub-02) and **`"Log in to Yang Luck 揚運"`** (pub-03).
  The code already says TECXWORK; the captures predate it. Each is a bespoke measurement,
  which is where this technique stops paying for itself.
- **The homepage hero**, which reads `揚運 Yang Luck 人才媒合平台` — that is
  `event_config.event_name`, tenant data rather than product brand, and the same row Niko
  still has to update in production.
- **The demo content itself**: real client company names and pipeline rows throughout.
- **The Next.js dev-tools badge** — the dark circle bottom-left of many captures. The
  originals were taken against a dev server.
- **Git history**, which still holds the pre-repaint files.

## Consequence

Niko's call on seeing the cost of the per-string chase:

> *"if this is inefficient. hold it until the full system finishes and retake everything"*

So this is the stopping point. The systematic, machine-detectable brand surfaces are done;
the rest waits for a real re-capture against a de-branded demo, which fixes all of the
above for free and needs `NEXT_PUBLIC_BRAND` unset so `BRAND` falls back to TECXWORK.

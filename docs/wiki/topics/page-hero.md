---
name: page-hero
description: PageHero component — photo-background header for /browse and /jobs with luminance-adaptive text color and a semi-transparent scrim.
attributed_to: niko
belongs_to: [public-homepage, design-system]
source: chat 2026-05-29
date: 2026-05-29
---

# PageHero (photo-background page header)

`src/components/page-hero.tsx` replaced the old two-block layout (plain `bg-card` title section + `PageImageCarousel` strip) on `/browse` and `/jobs`. It renders the page image(s) as a full background with the title/subtitle overlaid on top.

## Design (per Niko, 2026-05-29)

- **Background**: page images crossfade (opacity transition, 6s dwell, pauses on hover, respects `prefers-reduced-motion`). Up to 3 images; dots to switch.
- **Scrim**: a semi-transparent layer between photo and text so the text stands out. Direction flips with the detected brightness — a light wash over bright photos, a dark gradient over dark photos.
- **Adaptive text color**: text switches dark↔light based on the photo's luminance so it stays readable.

## How the adaptive color works

`getCenterLuminance(url)` draws the image into a 32×32 canvas, reads the central band (rows 8–24, where the title sits), and averages relative luminance (`0.2126R + 0.7152G + 0.0722B`, normalized 0–1). `darkText = luma > 0.6`.

- Requires CORS: images load with `crossOrigin="anonymous"`. The Vercel Blob host (`*.public.blob.vercel-storage.com`) returns `access-control-allow-origin: *`, so the canvas is readable.
- **Fallback**: if pixels can't be read (tainted canvas, load error) or before detection completes (incl. SSR), `luma` is null → `darkText = false` → **light text + dark scrim**, the universally safe combo. So the first paint is always readable; it may flip to dark text once detection runs on a bright photo.

## Gotchas

- Luminance is sampled per image and indexed by the active slide; switching slides re-evaluates `darkText`.
- Text gets a `text-shadow` only in light-text mode (extra insurance over busy dark photos).
- No images → renders the original plain `bg-card` centered header (graceful fallback), so pages without uploaded images look unchanged.
- The old `PageImageCarousel` was deleted (it was only used by these two pages). See [[hero-carousel]] for the *homepage* hero, which is a separate component.

## Tuning / open items

- The dark↔light cutoff is a single constant: `darkText = luma > 0.6`. If a specific photo sits near the threshold and the text color "wrong-foots," options are: nudge the `0.6` cutoff, widen the sampled band, or add a per-page/per-image override (e.g. an admin-set `forceTextColor`). Not built yet — revisit if a real uploaded image looks wrong on the live deploy.

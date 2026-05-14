---
title: Photo uploads
type: topic
slug: photo-uploads
date: 2026-05-04
updated: 2026-05-15
belongs_to: [admin-panel, recruiter-dashboard, public-homepage]
source: synthesis
status: active
tags: [uploads, ui]
related: [hero-carousel, 2026-05-04-photo-upload-guidelines, 2026-05-04-hero-photo-localization, 2026-05-04-clear-orphan-blobs]
---

## Summary
All image uploads in the app go through `ImageUpload` / `MultiImageUpload`, persisted to Vercel Blob via `/api/upload`. Each type self-documents its size/format/aspect guideline.

## Per-type guidelines
| Type     | Aspect | Recommended size | Formats |
|----------|--------|------------------|---------|
| avatar   | 1:1    | 400×400          | JPG/PNG/WebP/GIF |
| logo     | 1:1    | 400×400          | JPG/PNG/WebP/GIF |
| gallery  | 3:2    | 1200×800         | JPG/PNG/WebP/GIF |
| homepage | 3:4 vertical | 1200×1600 | JPG/PNG/WebP |
| page      | 16:9 or 21:9 wide | 1600×700 | JPG/PNG/WebP/GIF |

Max 4MB per file. Defaults live in `UPLOAD_GUIDELINES` in `src/components/image-upload.tsx`; override with the `hint` prop.

## Storage shape
- DB column `eventConfig.homepageImages: text[]` — **positional** slots after 2026-05-04: `[en, vi, zh-TW]`. Empty strings preserved.
- DB columns `eventConfig.browsePageImages: text[]` and `eventConfig.jobsPageImages: text[]` — optional decorative images for `/browse` and `/jobs`, max two images each.
- API: `PUT /api/admin/homepage-images` — validates length 3, https + Vercel Blob hostname.
- API: `PUT /api/admin/page-images` — validates placement (`browse` or `jobs`) and max two Vercel Blob image URLs.
- Public selection: `src/app/page.tsx` picks `homepageImages[localeSlot[locale]]` with fallback.
- Public decorative carousel: `/browse` and `/jobs` render `PageImageCarousel` only when configured images exist.

## Open questions
- What happens to homepageImages on a future locale add? Today it's hardcoded length-3.

## History
- 2026-05-15 — admin-configured browse/jobs decorative page image carousels added.
- 2026-05-04 — per-type guidelines + 3:4 hero ([decision](../decisions/2026-05-04-photo-upload-guidelines.md))
- 2026-05-04 — positional locale slots ([decision](../decisions/2026-05-04-hero-photo-localization.md))
- 2026-05-04 — orphan blobs cleared ([decision](../decisions/2026-05-04-clear-orphan-blobs.md))

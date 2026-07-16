---
title: Photo uploads
type: topic
slug: photo-uploads
date: 2026-05-04
updated: 2026-07-16
belongs_to: [admin-panel, recruiter-dashboard, public-homepage]
source: synthesis
status: active
tags: [uploads, ui]
related: [hero-carousel, 2026-05-04-photo-upload-guidelines, 2026-05-04-hero-photo-localization, 2026-05-04-clear-orphan-blobs, 2026-07-16-r2-image-storage-migration]
---

## Summary
All image uploads in the app go through `ImageUpload` / `MultiImageUpload`, persisted to **Cloudflare R2** via `/api/upload` (migrated from Vercel Blob on 2026-07-16 — [decision](../decisions/2026-07-16-r2-image-storage-migration.md)). Each type self-documents its size/format/aspect guideline.

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
- API: `PUT /api/admin/homepage-images` — validates length 3, https + allowed image host (`isAllowedImageUrl` in `src/lib/image-host.ts`: R2 public host or legacy Vercel Blob host).
- API: `PUT /api/admin/page-images` — validates placement (`browse` or `jobs`) and max two image URLs via the same `isAllowedImageUrl` allow-list.
- API: `POST /api/upload` — requires auth and R2 config (`isR2Configured()`); uploads via `uploadToR2` in `src/lib/r2.ts`; returns JSON errors for missing storage config, validation failures, and upload failures.
- Public selection: `src/app/page.tsx` picks `homepageImages[localeSlot[locale]]` with fallback.
- Public decorative carousel: `/browse` and `/jobs` render `PageImageCarousel` only when configured images exist.

## Open questions
- What happens to homepageImages on a future locale add? Today it's hardcoded length-3.

## History
- 2026-07-16 — Blob pause returns HTTP 403 on existing images too; 30 of 33 company logos re-sourced from the open web and stored in `public/company-logos/` (recruiter `logo_url` → `/company-logos/<id>.<ext>`). Gallery images unrecoverable (unique event photos). Left for manual: BellWether, Futsu, 富利餐飲, KD 9 Spa.
- 2026-07-16 — storage backend migrated from Vercel Blob to Cloudflare R2 after the free-tier Blob operations cap paused store access ([decision](../decisions/2026-07-16-r2-image-storage-migration.md)). Legacy Blob URLs still allow-listed and served.
- 2026-05-19 — `/api/upload` now guards missing storage config and catches upload failures so image controls show JSON error messages instead of HTML parse errors.
- 2026-05-15 — admin-configured browse/jobs decorative page image carousels added.
- 2026-05-04 — per-type guidelines + 3:4 hero ([decision](../decisions/2026-05-04-photo-upload-guidelines.md))
- 2026-05-04 — positional locale slots ([decision](../decisions/2026-05-04-hero-photo-localization.md))
- 2026-05-04 — orphan blobs cleared ([decision](../decisions/2026-05-04-clear-orphan-blobs.md))

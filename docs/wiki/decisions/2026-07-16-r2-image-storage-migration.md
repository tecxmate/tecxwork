---
title: Migrate image uploads from Vercel Blob to Cloudflare R2
type: decision
slug: 2026-07-16-r2-image-storage-migration
date: 2026-07-16
attributed_to: [niko]
belongs_to: [photo-uploads, architecture-overview]
source: chat
status: active
tags: [uploads, storage, r2, vercel]
related: [photo-uploads, 2026-06-06-vercel-pro-upgrade]
---

## Context
The free-tier `nikolasdoans-projects` Vercel account hit 100% of Vercel Blob
"Advanced Requests" (2,000 operations). Vercel emailed (1:41 AM, 2026-07-16)
that **store access will be paused for 30 days** unless upgraded to Pro. New
image uploads (`put()`) began failing. **Confirmed 2026-07-16:** the pause also
blocks READS — existing `*.public.blob.vercel-storage.com` URLs return HTTP 403
(all 44 company logos on work.tecxmate.com are broken). Files are not deleted,
only access-paused; they return once access is restored (Pro or 30-day wait).

## Decision
Swap the upload backend from Vercel Blob to **Cloudflare R2** (S3-compatible)
rather than upgrade Vercel. New uploads go to R2 immediately; the legacy Blob
host stays allow-listed so pre-migration images keep validating and rendering.

## Rationale
- Moving to R2 removes the dependency on the gated Blob feature instead of
  paying to unlock it. No Vercel upgrade required to change providers [niko].
- R2 is S3-compatible → `@aws-sdk/client-s3`, minimal new surface.
- Keeping the legacy Blob host in the allow-list avoids a forced back-migration
  of existing images as a precondition for shipping.

## Consequences
- New dep: `@aws-sdk/client-s3`. `@vercel/blob` is now unused in code but left
  in `package.json` (useful if we later script the back-migration).
- New files: `src/lib/r2.ts` (client + `uploadToR2`), `src/lib/image-host.ts`
  (shared `isAllowedImageUrl` accepting R2 host + legacy Blob host).
- `POST /api/upload` now requires R2 env (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`) instead of
  `BLOB_READ_WRITE_TOKEN`.
- `next.config.ts` derives an extra `images.remotePatterns` host from
  `R2_PUBLIC_BASE_URL`; both admin image routes use the shared allow-list.
- **Still open:** back-migration of existing Blob images to R2 (copy files +
  rewrite DB URLs) is deferred; only needed to fully leave Blob. Requires Blob
  read access, which the 30-day pause may restrict.

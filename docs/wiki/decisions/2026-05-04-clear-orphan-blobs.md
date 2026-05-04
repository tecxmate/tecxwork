---
title: Clear pre-localization homepage images from DB and Vercel Blob
type: decision
slug: 2026-05-04-clear-orphan-blobs
date: 2026-05-04
attributed_to: [niko]
belongs_to: [admin-panel]
source: chat
status: active
tags: [cleanup, storage]
related: [photo-uploads]
---

## Context
After switching `homepageImages` to a positional locale slot model, the three previously uploaded photos were now positionally tagged (en/vi/zh-TW) by upload order — wrong attribution. Niko authorized deleting them.

## Decision
- Reset `eventConfig.homepageImages` to `[]`.
- Delete the three blob files from Vercel Blob storage.

## Affected URLs
- `https://oivok12zbb79b12m.public.blob.vercel-storage.com/homepage/9-1777883190490.jpeg`
- `https://oivok12zbb79b12m.public.blob.vercel-storage.com/homepage/9-1777883221400.jpeg`
- `https://oivok12zbb79b12m.public.blob.vercel-storage.com/homepage/9-1777883238499.jpeg`

## Rationale
Per [niko]: cleaner to start fresh than try to map legacy positional uploads to languages.

## Consequences
- Admin must re-upload one photo per language slot.
- One-off scripts used (then removed): `src/lib/db/clear-homepage-images.ts`, `src/lib/db/delete-orphan-blobs.ts`.

## Provenance
- Executed 2026-05-04 by [claude-code] under [niko]'s authorization. Not pushed (DB + blob ops only).

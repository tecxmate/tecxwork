---
title: Photo upload guidelines per type; hero set to 3:4 vertical; remove activity-photos section
type: decision
slug: 2026-05-04-photo-upload-guidelines
date: 2026-05-04
attributed_to: [niko]
belongs_to: [admin-panel, recruiter-dashboard, public-homepage]
source: chat
status: active
tags: [uploads, ui, hero]
related: [photo-uploads, hero-carousel]
---

## Context
Multiple photo uploaders existed (avatar, logo, gallery, homepage) without per-type size/format/aspect guidance. Homepage hero used 16:9 landscape but Niko wanted 3:4 vertical. The "Event Photos / Activity Photos" placeholder grid on the homepage showed empty placeholders even when the admin hadn't uploaded anything.

## Decision
- `ImageUpload` and `MultiImageUpload` self-document per-type guidelines (size, format, aspect) directly under the upload control, with an optional `hint` override.
- Homepage hero standardized at **3:4 vertical**, recommended 1200×1600px, min 900×1200px.
- The activity-photos section on `/` is removed entirely. No section, no placeholder.

## Rationale
Per [niko]: admins shouldn't have to memorize image specs across forms; placeholders that imply uploads-coming look unfinished.

## Consequences
- `src/components/image-upload.tsx` exposes `UPLOAD_GUIDELINES` and a `hint` prop on both `ImageUpload` and `MultiImageUpload`.
- `src/components/homepage-image-editor.tsx` aspect ratio, copy, and validation switched to 3:4 vertical (kept in tree but no longer rendered on `/`).
- `src/app/page.tsx` no longer imports or renders `HomepageImageEditor`.

## Provenance
- Discussed 2026-05-04 between [niko] and [claude-code].
- Implementing commit: `a688542`.

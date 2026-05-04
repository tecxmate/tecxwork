---
title: Admin panel
type: topic
slug: admin-panel
role: area
date: 2026-05-04
updated: 2026-05-04
source: code
status: active
tags: [area, admin]
related: [tecxwork]
---

## Scope
Admin-only area for configuring the event: branding, time frame, slots, homepage hero images, recruiter approvals, exports.

## Key code
- `src/app/admin/admin-dashboard.tsx` — main UI (client component).
- `src/app/admin/admin-data.ts` — server data loader.
- `src/app/api/admin/*` — admin API routes.

## Active concerns
- Time-frame form — see [topics/event-time-config.md](../topics/event-time-config.md).
- Hero photo localization — see [topics/hero-carousel.md](../topics/hero-carousel.md).

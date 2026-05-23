---
title: Admin panel
type: topic
slug: admin-panel
role: area
date: 2026-05-04
updated: 2026-05-15
attributed_to: [claude-code]
belongs_to: [tecxwork]
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
- Recruiter salary currencies are event-configured from `/admin/settings`; default is TWD, VND, USD.

## History
- 2026-05-15: `/admin/settings` now shows a sticky save-status strip (`All changes saved`, `Saving changes...`, `Changes saved`, or `Some changes failed`) and platform setting controls now show explicit saving/saved/error feedback with rollback on failed saves.

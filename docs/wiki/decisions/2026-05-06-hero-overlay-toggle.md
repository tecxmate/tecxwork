---
title: Admin toggle for hero overlay (title, countdown, CTAs)
type: decision
slug: 2026-05-06-hero-overlay-toggle
date: 2026-05-06
attributed_to: [niko]
belongs_to: [public-homepage, admin-panel]
source: chat
status: active
tags: [admin, branding, homepage, hero]
related: [public-homepage, admin-panel, hero-carousel]
---

## Context
An admin requested the ability to show only the photo carousel on the public homepage hero — hiding the overlay (title, tagline, date/time/location row, countdown clock, and "Browse Companies" / "Find Jobs" CTAs) for events where the photo set is the message.

## Decision
Added a per-event admin toggle: `event_config.hero_overlay_enabled` (boolean, defaults to `true`). When off, `src/app/page.tsx` skips rendering the overlay block, and `HeroCarousel` no longer reserves the first "details" slide — it shows the images carousel only. The toggle lives in the existing **Event Branding** collapsible in the admin dashboard.

## Rationale
- One row in `event_config` already holds all per-event admin-editable branding; adding a flag here keeps the change in the same domain and admin UI.
- `HeroCarousel` was updated to treat falsy `children` as "no overlay" — fewer indicator dots, no empty first slide, correct slide count.
- Default `true` preserves current behavior for existing rows.

## Consequences
- New DB column + idempotent migration script `src/lib/db/add-hero-overlay-toggle-column.ts` (npm script `db:update:hero-overlay-toggle`).
- `EventBranding` type, `getEventBranding`, `/api/admin/branding` GET/PUT, and `admin-data.ts` all surface the new field.
- Admin UI: Switch inside the Event Branding section.
- Migration applied on local DB on 2026-05-06; production needs the same script run before deploy.

## Provenance
- Discussed 2026-05-06 between [niko] (owner) and [claude-code] (agent).
- Files touched: `src/lib/db/schema.ts`, `src/lib/db/add-hero-overlay-toggle-column.ts`, `src/lib/event-branding.ts`, `src/app/page.tsx`, `src/components/hero-carousel.tsx`, `src/app/api/admin/branding/route.ts`, `src/app/admin/admin-data.ts`, `src/app/admin/admin-dashboard.tsx`, `package.json`.

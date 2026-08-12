---
title: Admin panel
type: topic
slug: admin-panel
role: area
date: 2026-05-04
updated: 2026-08-12
attributed_to: [claude-code]
belongs_to: [tecxwork]
source: code
status: active
tags: [area, admin]
related: [tecxwork]
---

## Scope
Admin-only area for configuring the event: branding, time frame, slots, homepage hero images, recruiter approvals, exports.

## Function list (admin capabilities)
- Event config: branding, time frame, slots, homepage hero images, salary currencies (`/admin/settings`).
- Recruiter approvals + edit a recruiter's company profile (`PATCH /api/admin/recruiters?id=`).
- Send reminder emails (`POST /api/admin/send-reminders`).
- **Export CSV** — all bookings, one row each (`GET /api/admin/export`).
- **Export Excel** — full system stats workbook (`GET /api/admin/export/stats`): 6 sheets — Summary KPIs (companies, CVs uploaded, applications, job openings, interview slots), By Event, Companies, Applicants (CVs), Applications, Job openings. Built with `exceljs`; Asia/Taipei timestamps; PII (applicant emails + CV links) included so it's admin-gated. UI: QR/Interviews block, button next to Export CSV.

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
- 2026-05-28: Admins can edit a recruiter's company profile on their behalf from the Recruiters tab (Pencil icon → modal): company, industry, contact email, website, description, and logo upload. Backed by `PATCH /api/admin/recruiters?id=<id>`. Excludes `interviewerCount` to avoid the slot-regeneration side-effect that lives in the recruiter's own profile editor. No recruiter notification in v1.
- 2026-06-28: Added **Export Excel** (`GET /api/admin/export/stats`) — a 6-sheet `.xlsx` stats workbook for the business team, alongside the existing Export CSV. New i18n key `qr.exportExcel` (en/vi/zh-TW). Added `exceljs` dependency. Replaces the prior one-off script-based export.
- 2026-08-12: The workspace gained a **persistent left rail** (`src/components/admin-sidebar.tsx`), matching the recruiter workspace — groups Moderation / Registry / Configuration, collapsible, desktop only, with the top bar and bottom nav still carrying navigation below `lg`. Kept as its own component rather than sharing one parameterised rail with `dashboard-sidebar.tsx`; the collapse preference (`tecxwork_sidebar_collapsed`) *is* shared. See [decisions/2026-08-12-admin-workspace-rail.md](../decisions/2026-08-12-admin-workspace-rail.md).

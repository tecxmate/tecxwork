---
title: Admin interview moderation page; demote Overview to Settings
type: decision
slug: 2026-05-13-admin-interview-moderation
date: 2026-05-13
attributed_to: [niko]
belongs_to: [admin-panel, recruitment-workflows]
source: chat
status: active
tags: [admin, bookings, navigation]
related: [admin-panel, recruitment-workflows]
---

## Context
Admins could already cancel a booking through the recruiter/applicant-shared `DELETE /api/bookings/[id]` endpoint, but there was no UI surface for it — they had to go through the recruiter/applicant view or hit the DB by hand (we just deleted niko.tecx@gmail.com test bookings via a one-off script). Recruiters can already cancel their own bookings, but admins need a cross-recruiter sweep capability, especially for test data before an event.

Separately, `/admin` (the Overview tab) had become the platform-settings page — event branding, time-frame config, mode toggles, allowed domains, feedback inbox, exports. The "Overview" label undersold it, and giving it a primary nav slot pushed more frequently-used pages further away.

## Decision
- Replace `Overview` in the admin top nav with `Interviews`. New top nav: **Recruiters · Jobs · Applicants · Interviews**.
- Move the settings content to `/admin/settings`. Reach it via a gear icon in the desktop topbar and a `Settings` entry in the mobile hamburger (under the role pill).
- `/admin` 307-redirects to `/admin/interviews` so old bookmarks land somewhere useful.
- The new `/admin/interviews` page reuses the existing `BookingsTable` and `DELETE /api/bookings/[id]` endpoint (which already supports admin auth, slot release, rejection email, and waitlist promotion). It adds:
  - Status filter chips: Active (default) / Cancelled+Rejected / All.
  - Per-row soft-cancel trash button.
  - "Bulk cancel by email substring" form: match against `applicant_email`, optional admin note shared across all matching active bookings.

All cancels stay **soft** — bookings rows are kept with `status='cancelled'`, slots released, applicants notified. Admin-confirmed in the scoping questions.

## Rationale
- The cancel/notify/release-slot/waitlist-promote logic is non-trivial and already correct in `DELETE /api/bookings/[id]`. Walking that endpoint N times for bulk cancel keeps one code path; the admin tradeoff (latency vs correctness) favored correctness.
- Substring match on email is sufficient for the dominant use case (sweep `niko.tecx@`, `test-`, etc. before an event). Whole-domain regex was deferred.
- A separate `POST /api/admin/bookings/bulk-cancel` endpoint was considered and rejected — would have duplicated waitlist/email logic.
- Hard delete from the UI was considered and rejected — Niko wants an audit trail. The one-off DB script we used for niko.tecx@ stays a one-off; everyday admin cleanup goes through soft cancel.

## Consequences
- `src/lib/navigation.ts`: dropped `Overview` entry, added `Interviews` with the `CalendarClock` icon.
- `src/app/admin/page.tsx` → simple `redirect("/admin/interviews")`.
- `src/app/admin/interviews/page.tsx` and `src/app/admin/settings/page.tsx` added.
- `src/app/admin/admin-dashboard.tsx`: `AdminSection` type renamed `overview → settings`, added `interviews`. New `InterviewsSection` component appended; `handleBulkCancelBookings` added next to the existing `handleCancelBooking`.
- `src/components/app-topbar.tsx`: admin-only gear-icon link to `/admin/settings` in the desktop overflow area.
- `src/components/app-topbar-account-actions.tsx`: `Settings` row in the mobile hamburger for admin role.
- No DB/schema changes; no new API routes.
- i18n: the new InterviewsSection ships with English strings only. Existing `admin.people`/`admin.bookings` translations are reused for the table; the filter chips and bulk-cancel form copy are not yet localized. Acceptable since the surface is admin-only and English-fluent in practice.

## Provenance
- Discussed 2026-05-13 between [niko] (owner) and [claude-code] (agent). Scoping decisions captured via `AskUserQuestion`: soft cancel only, flat list layout, settings moved to `/admin/settings`.
- Implementing commit: `15bd038`.

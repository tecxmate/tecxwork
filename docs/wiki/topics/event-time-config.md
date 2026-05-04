---
title: Event time configuration
type: topic
slug: event-time-config
date: 2026-05-04
updated: 2026-05-04
belongs_to: [admin-panel, tecxwork]
source: synthesis
status: active
tags: [scheduling, timezone]
related: [2026-05-04-time-setting-bugs]
---

## Summary
The event time frame (start/end hour-minute, slot duration, buffer, event date) is configured in `eventConfig` and consumed by all slot generation paths. The event timezone is fixed at **Asia/Taipei**.

## Current state

### DB columns (`eventConfig`)
- `startHour`, `startMinute`, `endHour`, `endMinute` (integers).
- `slotDurationMinutes`, `bufferMinutes`.
- `eventDate`, `eventEndDate` — `timestamp with time zone`.

### Slot regeneration algorithm (shared)
Iterate absolute minutes from `startMinutes = startHour*60 + startMinute` to `endMinutes = endHour*60 + endMinute`, stepping by `slotDuration + bufferMinutes`. Emit a slot only if `t + slotDuration <= endMinutes`. Build the start `Date` from `${eventDate}T${HH}:${MM}:00+08:00`, where `eventDate` is the event day formatted via `Intl` `timeZone: "Asia/Taipei"`.

### Sites that regenerate slots
- `src/app/api/admin/timeframe/route.ts` — admin saves time frame; regenerates for all recruiters.
- `src/app/api/me/recruiter/route.ts` — recruiter changes interviewer count; regenerates for that recruiter.
- `src/lib/recruiter-onboarding.ts` (`ensureDefaultRecruiterSlots`) — first-time slot seed for a new recruiter.

All three use `getEventBranding()` and the shared algorithm.

### Admin form (`<input type="datetime-local">`)
Round-trips event start/end through Asia/Taipei via `isoToTaipeiLocal` / `taipeiLocalToIso` helpers in `src/app/admin/admin-dashboard.tsx`. Without this, browser-local parse + UTC raw display caused a per-save timezone shift.

## Open questions
- Multi-day events — `eventEndDate` exists but slot regen still treats the event as single-day.

## History
- 2026-05-04 — three-bug fix pass: loop cadence, end bound, datetime-local roundtrip, getDate UTC drift ([decision](../decisions/2026-05-04-time-setting-bugs.md)).

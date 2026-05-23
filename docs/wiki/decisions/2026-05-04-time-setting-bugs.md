---
title: Time setting bug fixes — slot loop, datetime-local roundtrip, getDate UTC drift
type: decision
slug: 2026-05-04-time-setting-bugs
date: 2026-05-04
attributed_to: [niko]
belongs_to: [admin-panel, tecxwork]
source: chat
status: active
tags: [bugfix, timezone, scheduling]
related: [event-time-config]
---

## Context
Niko reported the admin time setting "never registered the correct time when I set it." Audit surfaced three independent bugs.

## Bugs and fixes

1. **Slot regen cadence drift across hours.** The loop reset the minute counter every hour, so non-60-dividing slot durations (e.g. 45 min) restarted the cadence at the top of each hour: `10:00, 10:45, 11:00, 11:45` instead of `10:00, 10:45, 11:30, ...`. Fixed by iterating absolute minutes from `startMinutes` to `endMinutes`.

2. **Slot end past event end.** A 60-min slot at 17:00 was created even when event ended 17:30. Fixed by emitting only when `t + slotDuration <= endMinutes`.

3. **`<input type="datetime-local">` mixed-timezone roundtrip** (likely the root of "wrong time"). On display, `branding.eventDate.slice(0, 16)` extracted the **UTC** characters. On save, `new Date(e.target.value).toISOString()` parsed input as **browser-local**. For a Taipei admin this shifted the value by 8 hours each save/reload. Fixed: round-trip both directions through Asia/Taipei explicitly.

4. **`getDate()` on UTC server.** Slot regen built the event-day string from `dateObj.getFullYear/Month/Date`, which on Vercel (UTC) returns the previous day if the event starts between 00:00 and 08:00 Taipei. Fixed: format the day with `Intl` `timeZone: "Asia/Taipei"`.

## Decision
Apply all four fixes in:
- `src/app/api/admin/timeframe/route.ts` — loop + day string.
- `src/app/admin/admin-dashboard.tsx` — `isoToTaipeiLocal` / `taipeiLocalToIso` helpers.
- `src/app/api/me/recruiter/route.ts` — switch to live `getEventBranding()`, apply loop + day-string fixes.
- `src/lib/recruiter-onboarding.ts` — same migration; `ensureDefaultRecruiterSlots` now async.

## Rationale
Per [niko]: scheduling correctness is critical — a wrong-day or wrong-time slot ruins bookings.

## Consequences
- All slot generation paths now share the same algorithm and event timezone semantics.
- Admin event start/end roundtrip is stable across saves/reloads regardless of the browser's timezone.

## Provenance
- Implementing commits: `e31a887` (loop), `c7536f8` (timezone roundtrip + getDate UTC + me/recruiter migration).
- Discussed 2026-05-04 between [niko] and [claude-code].

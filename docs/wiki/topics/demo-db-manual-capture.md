---
title: Demo DB state for manual/screenshot capture
type: topic
slug: demo-db-manual-capture
date: 2026-08-08
updated: 2026-08-08
attributed_to: [claude-code]
belongs_to: [neon-account-topology, data-privacy]
source: observation
status: active
tags: [demo, database, screenshots, pipa]
related: [platform-manual, neon-account-topology, data-privacy, event-time-config]
---

## The PII trap (important)

`.env.local` on `demo/yang-luck` points at the **production** database
(`ep-delicate-lab-aos3iphg`, ap-southeast-1) — 175 real applicants with real names, emails
and CVs, 320 real bookings, `admin@vgen.tw`. It has **no `applications` table**, so the ATS
pipeline 500s against it.

Never screenshot or demo against that host. `seed-demo-applicant.ts` already hard-refuses it
(`/delicate-lab|bitter-hill/` guard) — trust that guard as the canonical prod-host test.

## The right target

Neon project **`tecxwork-yl-demo`** (`green-paper-12737860`, us-east-2), endpoint
`ep-floral-boat-ajbkmkbl-pooler`. Isolated, entirely fictional. Run the dev server with
`DATABASE_URL=...` in the environment — Next.js does not let `.env.local` override an
already-set process env, so the demo URL wins.

> Note: `add-ats-tenancy.ts`'s header comment says "demo = lingering-sun". That is the
> *deployed* yangluck.tecxmate.com DB. `tecxwork-yl-demo` is the one carrying the seeded ATS
> data and is what local capture should use.

## What had to be fixed before capture (all applied 2026-08-08)

1. **Schema drift — ATS.** The demo DB predated this branch's ATS work; `recruiters.org_id`
   was missing and `/dashboard/pipeline` 500'd. Fixed by running all seven migrations in
   order: `tenancy → pipeline → agency → compliance → collab → pii → pools`. All additive and
   idempotent. They also seed compliance docs (48), scorecards (10), notes (15), pools (4).
2. **Schema drift — non-ATS.** `recruiters.verified` was missing, 500ing `/` and
   `/recruiter/[id]` via `fetchRecruiters`. Added manually; `client_kind in ('agency','subsidiary')`
   set verified. **Do not use `drizzle-kit push` here** — it wants to truncate `orgs`.
3. **No applicant login.** Ran `seed-demo-applicant.ts` → `student@yangluck.demo` / `demo1234`.
   (The 26 `co-*@yangluck.demo` client-company recruiters also use `demo1234`.)
4. **Zero bookings.** Seeded 384 slots on the event date plus 15 bookings spanning every
   status (8 accepted, 4 pending, 1 reschedule_proposed, 1 rejected, 1 cancelled), mostly on
   recruiter 4 (揚宏營造 / `co-yanghong@`) so one login shows a rich Applicants + Interviews screen.

## Bug found: SlotPicker ignores the configured event date

`src/components/slot-picker.tsx:36` does `setSelectedDate(startOfDay(EVENT_CONFIG.date))` —
the **build-time constant** from `src/lib/data.ts` (June 6, 2026), not
`event_config.event_date` from the DB. Everything else in the app reads the DB value via
`getEventBranding()`.

Consequence: an admin changing the date under Settings → Interview Time Frame updates the
rest of the app, but the student's slot picker still opens on the old day and shows
"No available slots on this day" — the booking flow looks broken.

Worked around for capture by aligning the demo data to 2026-06-06 rather than patching app
code. **Should be fixed before the next live event** — see [[event-time-config]].

## Reproducing

```bash
export DATABASE_URL="<tecxwork-yl-demo pooled URL>"   # never .env.local's value
npm run dev
node scratchpad/capture-all.mjs      # 56 screenshots, 5 role passes
python3 scratchpad/build.py          # inline WebP -> manual.html
```

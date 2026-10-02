---
title: Neon compute cost — what actually bills, and what kept it awake
type: topic
slug: neon-compute-cost
date: 2026-09-30
updated: 2026-09-30
attributed_to: [claude-code]
belongs_to: [tecxwork]
source: observation
status: active
tags: [neon, cost, performance, polling, notifications]
related: [2026-09-30-stop-the-notification-heartbeat, request-memoisation, architecture-overview]
---

## The one thing to understand

Neon bills **CU-hours = compute size × time the compute is AWAKE.** An idle compute
suspends (default five minutes) and stops billing. Storage is billed separately and
keeps costing nothing extra while suspended.

The consequence is counter-intuitive and worth saying plainly: **query count is
almost irrelevant to the bill.** A page that fires twenty queries in one burst and
then goes quiet is cheap. A page that fires one query a minute forever is
expensive, because it never lets the compute sleep.

So the expensive thing an app can build is not a slow query. It is a heartbeat.

## What we had

`tecxwork-db-sg` hit 80.4 of its 100 CU-hour monthly allowance on 2026-09-30, on
an app with a handful of users. The cause was a heartbeat, and it was doubled:

`NotificationBell` ran `setInterval(fetch, 60_000)` in a `useEffect`, and the bell
renders in **two** places — the top bar and the sidebar footer. At every viewport
one of the two is hidden by CSS, but hidden is still mounted, and a mounted
interval still fires. Measured in Chromium:

| | requests to `/api/notifications` in 190s |
|---|---|
| before, visible tab | **6** (two pollers, 60s each) |
| before, hidden tab | 0 — Chromium's background throttling, not our design |
| after | **3** visible-and-active, **0** hidden, **0** visible-but-idle |

Nothing in the old code stopped the polling when the tab was not being looked at.
Chromium happens to throttle background timers hard, but that is the browser's
mercy rather than the app's intent, Safari's throttling differs, and **a tab that
is visible but unattended is throttled by nobody** — a dashboard parked on a second
monitor pinned the compute awake for as long as it was open.

## What was ruled out

Worth recording, so nobody re-investigates these:

- **CI is not on Neon.** `.github/workflows/ci.yml` runs the 301-test suite against
  a `postgres:16` service container. Zero Neon compute per run.
- **`/api/event-pulse` is bounded.** It is public and `public/event-pulse.html`
  polls it every 5 seconds, which looks alarming — but the response carries
  `Cache-Control: public, max-age=5, stale-while-revalidate=25` so pollers hit the
  CDN, and `vercel.json` redirects `/event-pulse.html` to `/`. (The page does
  hardcode the absolute production URL, so a surviving copy elsewhere would still
  reach the API; the CDN cache is what keeps that cheap.)
- **Middleware never touches the database.** `src/proxy.ts` has no `db` import, so
  crawler and bot traffic cannot wake the compute.
- **The cron is daily.** One `/api/cron/prune-notifications` firing at 19:00.

## Console-side levers, which no commit can pull

If the usage is still high after the heartbeat is gone, these are where to look,
in order of how much they move the number:

1. **Which endpoint burned the hours.** Neon Console → the project → Monitoring /
   Usage breaks CU-hours down per compute endpoint. Confirm it is the production
   branch before optimising the app any further — a forgotten branch has its own
   compute and its own bill.
2. **The autoscaling minimum.** CU-hours are size × time, so the floor multiplies
   everything. A minimum of 1 CU costs four times a minimum of 0.25 for identical
   awake time.
3. **Scale-to-zero delay.** Shorter means less tail per wake.
4. **Idle branches.** Every branch has its own compute endpoint. Delete the ones
   nothing uses.
5. **Vercel preview deployments.** If previews inherit the production
   `DATABASE_URL`, every preview someone opens wakes the production compute. Given
   how many PRs this repo opens, that is worth checking.

## The rule going forward

Before adding any `setInterval`, `refetchInterval`, or polling loop that reaches
the database, ask what it costs when nobody is looking at it. If the answer is
"the same as when somebody is", it needs a visibility check and an idle cutoff —
`src/lib/notification-feed.ts` is the pattern.

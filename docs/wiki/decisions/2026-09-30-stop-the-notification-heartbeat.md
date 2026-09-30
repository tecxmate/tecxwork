---
title: Poll only while somebody is looking — the notification bell was keeping Neon awake
type: decision
slug: 2026-09-30-stop-the-notification-heartbeat
date: 2026-09-30
updated: 2026-09-30
attributed_to: [niko, claude-code]
belongs_to: [neon-compute-cost, tecxwork]
source: observation
status: active
tags: [neon, cost, polling, notifications, performance]
related: [neon-compute-cost, request-memoisation]
---

## Context

[niko], 2026-09-30, forwarding Neon's warning:

> Your project tecxwork-db-sg has used 80% (80.4 CU-hours) of its 100 CU-hour
> monthly compute allowance.

80 CU-hours is roughly 320 hours of a 0.25 CU compute — about thirteen days of
running without pause, on an app with a handful of users. That shape says the
compute is not sleeping, not that the queries are heavy.

## What was found

`NotificationBell` ran `setInterval(fetch, 60_000)` in a `useEffect`, and the bell
renders in two places: the top bar and the sidebar footer. At every viewport one
of the two is hidden by CSS, but **hidden is still mounted, and a mounted interval
still fires**. Measured in Chromium — two bells mounted, one visible, at 1440px and
at 390px alike, and six requests to `/api/notifications` in 190 seconds.

Nothing stopped it when nobody was looking. Chromium throttles background timers
hard (measured: zero requests in 190s hidden), but that is the browser's mercy
rather than the app's design, Safari's throttling differs, and a tab that is
**visible but unattended** is throttled by nobody.

## The decision

One module-level poller shared by every bell on the page
(`src/lib/notification-feed.ts`), running only while the document is visible AND
somebody has interacted in the last fifteen minutes. Returning to the tab fetches
immediately, so nothing is staler than the moment you looked at it.

**The 60-second interval is deliberately unchanged.** The billed quantity is awake
time, and while somebody is actively using the app the compute is awake regardless
of the bell — so a longer interval would trade freshness for almost nothing. The
entire saving is in not polling when nobody is there, and that is what the
visibility check and the idle cutoff buy.

## What was ruled out, and why that mattered

Three plausible culprits were checked and cleared before touching anything:

- **CI** runs the suite against a `postgres:16` service container, not a Neon
  branch. Zero compute per run — which is worth knowing, because "CI hammers the
  database" is the obvious guess and it is wrong here.
- **`/api/event-pulse`** is polled every five seconds by `public/event-pulse.html`,
  which looks like a second heartbeat — but the response is CDN-cached
  (`max-age=5, stale-while-revalidate=25`) and the page is redirected to `/` in
  `vercel.json`.
- **Middleware never touches the database**, so crawler traffic cannot wake the
  compute.

Had any of those been the cause, the bell fix would have changed the bill by
nothing, and the wrong lesson would have been recorded.

## What this cannot fix

CU-hours are size × awake-time, and a commit only moves the second factor. The
autoscaling **minimum CU** multiplies everything, idle **branches** each carry
their own compute, and **Vercel previews** inheriting the production
`DATABASE_URL` wake production on every preview opened. Those are console-side and
are listed in [neon-compute-cost](../topics/neon-compute-cost.md).

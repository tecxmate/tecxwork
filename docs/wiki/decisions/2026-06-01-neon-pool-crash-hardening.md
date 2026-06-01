---
title: Neon Pool Crash Hardening (WebSocket error handler + fetch queries)
type: decision
slug: 2026-06-01-neon-pool-crash-hardening
date: 2026-06-01
attributed_to: [niko]
belongs_to: [tecxwork]
source: document
status: active
tags: [database, neon, reliability, serverless]
related: [architecture-overview, booking-engine]
---

## Context
Production (`work.tecxmate.com`) function instances were crashing with repeated
`Error: Unhandled error.` traces ending in `WebSocket.<anonymous>` /
`reportStreamError`. Correlated DB errors: `Control plane request failed`,
`Failed to acquire permit to connect to the database. Too many database
connection attempts are currently ongoing`, and 300s Vercel runtime timeouts.

Root cause: `src/lib/db/index.ts` uses the Neon **WebSocket** `Pool`
(`@neondatabase/serverless` + `drizzle-orm/neon-serverless`). Two problems:
1. No `pool.on('error')` listener. When Neon drops an idle pooled client's
   socket (control plane overloaded), the `'error'` EventEmitter event was
   unhandled, which Node escalates to an uncaught exception → the whole
   function instance dies.
2. Every request opened a WebSocket to Neon, exhausting connection permits
   under load and triggering the socket drops in (1).

Could not switch to the HTTP `neon-http` driver wholesale because interactive
`db.transaction(...)` is used in ~8 routes and neon-http doesn't support it.

## Decision
Keep the WebSocket pool (transactions need it) and add an idle-client
`pool.on('error')` handler that logs and swallows, so a dropped socket no longer
crashes the instance (the affected query still rejects normally).

## Reverted: poolQueryViaFetch (caused a prod outage)
The first version of this fix also set `neonConfig.poolQueryViaFetch = true`.
That backfired badly. The repo's `main` branch deploys to **two** Vercel
projects (`app` — the live site — and the redundant `tecxwork`), so the push
triggered two simultaneous production builds. With `poolQueryViaFetch`, each
build's ~83 static-prerender queries became independent HTTP connection
attempts. Two builds × 83 fetches overwhelmed the small free-tier Neon DB
(`ep-lingering-sun-an5htstv`, c-6, 0.25 CU), which returned "Too many database
connection attempts are currently ongoing" — taking the live runtime down too.
Both builds ERRORED and `work.tecxmate.com` went down (~19:13). Cancelling the
in-flight builds drained the storm and the DB/site recovered within minutes
(only ~15 connections once builds stopped).

Lesson: don't route build-time prerender queries over per-query fetch on a tiny
free-tier DB, especially while two projects build the same branch. The WS pool
reuses ~1 connection per build worker and is far gentler at build time.

## Implementation
`src/lib/db/index.ts` — only the `pool.on('error')` handler. No call-site
changes. See also the duplicate-Vercel-project issue noted in the log.

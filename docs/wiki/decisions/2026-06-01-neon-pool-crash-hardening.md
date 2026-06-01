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
Keep the WebSocket pool (transactions need it) but harden it:
- Add an idle-client `pool.on('error')` handler that logs and swallows, so a
  dropped socket no longer crashes the instance (the affected query still
  rejects normally).
- Set `neonConfig.poolQueryViaFetch = true` so single (non-transaction) queries
  go over HTTP fetch instead of opening a WebSocket per request. Transactions
  still use the pool's WebSocket.

## Implementation
`src/lib/db/index.ts` — both changes. No call-site changes needed.

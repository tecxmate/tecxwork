---
title: Cache event_config reads; ISR rejected (pages are cookie-dynamic)
type: decision
slug: 2026-06-01-event-config-cache
date: 2026-06-01
attributed_to: [niko]
belongs_to: [tecxwork]
source: document
status: active
tags: [performance, caching, resilience, nextjs]
related: [2026-06-01-neon-pool-crash-hardening, 2026-06-01-tokyo-region-migration]
---

## Context
After moving to Singapore (DB co-located with functions), per-request DB
latency is ~ms, so the remaining concern is DB *load* on the free-tier
connection ceiling — the exact failure that caused the 2026-06-01 outage. The
`select ... from event_config` query runs on **every** request via the root
layout's `generateMetadata` (`getEventBranding`) and was the query flooding the
logs during the outage.

## Decision
**Win #1 — cache event_config (done).** `getEventBranding` now reads through the
Vercel runtime cache (`@vercel/functions` `getCache`, the same pattern as
`getCachedRecruiters` in `lib/cache.ts`): 1h TTL, tag `event-config`, invalidated
via `invalidateEventConfigCache()` from the two admin routes that write
branding/timing fields (`/api/admin/branding`, `/api/admin/timeframe`). Kept the
React `cache()` wrapper (per-request dedup) and the static fallback. Dates are
rehydrated with `new Date()` because the cache serializes to JSON.

Used `getCache` (not Next `unstable_cache` + `revalidateTag`) because this Next
16.2.2 has a non-standard `revalidateTag(tag, profile)` signature tied to the new
cache model; the `@vercel/functions` pattern is already proven in this codebase.

**Win #2 — ISR/static public pages: REJECTED.** Every public page reads the
session + locale cookies server-side (`getSession`/`getStudentLocale` →
`cookies()`/`headers()`), so the production build classifies them all as
`ƒ (Dynamic)`. `export const revalidate` would be a no-op. Making them
edge-cacheable would require a cross-cutting auth/i18n refactor (move
session/locale out of server render), and — since the DB is now co-located —
the latency upside is small. Not worth it now; revisit only if edge-served
public pages become a goal.

## Files
`src/lib/event-branding.ts`, `src/app/api/admin/branding/route.ts`,
`src/app/api/admin/timeframe/route.ts`.

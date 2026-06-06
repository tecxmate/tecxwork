---
title: Event-Day Load Readiness
type: topic
slug: load-readiness
date: 2026-06-06
updated: 2026-06-06
belongs_to: [tecxwork, v-gen-trident-2026]
source: observation
status: active
tags: [scalability, db, rate-limit, concurrency, event-day]
related: [architecture-overview, 2026-06-01-event-day-burst-hardening, 2026-05-13-event-day-burst-hardening, 2026-06-06-vercel-pro-upgrade]
---

## Summary
Load-readiness audit for the V-GEN TRIDENT event (target: 1000 students, 38 recruiters, 1–3 interviewers each). Conducted 2026-06-06 with live prod probes. Verdict: **slot integrity and DB capacity are sound; the one real event-day risk is the per-IP rate limit falsely locking out the venue's shared NAT.**

## Verified capacity facts (live prod probe, 2026-06-06)
- Prod DB `ep-delicate-lab-aos3iphg` (`ap-southeast-1`, **pooled/PgBouncer** endpoint). NOT in the Tecxmate Neon org — it's a separate account, so the Neon MCP (Tecxmate org) cannot see it; probe via `DATABASE_URL` connection string.
- **`max_connections = 901`** → compute autoscales to ~2 CU, **not** 0.25 CU as earlier notes assumed. At probe time: 17 total connections, 1 active. **Connection exhaustion is not a real risk.** The earlier advice to cap the pool at `max:5` would *throttle* throughput and should NOT be applied.
- Live data volume: 167 applicants, 38 recruiters, 477 slots (385 available), 297 bookings (103 pending, 92 accepted). Tables are small — **sequential scans on un-indexed booking columns are sub-millisecond at this scale; missing secondary indexes are not a bottleneck for this event.**
- Pool is a module-level singleton with a `pool.on('error')` handler (see [[2026-06-01-neon-pool-crash-hardening]]).

## Slot-booking concurrency — PROTECTED
- Accept paths (`/api/bookings/review`, `respond-proposal`, `reverse`) use `pg_advisory_xact_lock(applicant+time)` + `UPDATE slots ... FOR UPDATE SKIP LOCKED` inside a transaction.
- DB-level `unique_recruiter_slot_interviewer` constraint makes physical double-booking of an interviewer slot impossible.
- Covered by a race test (`src/test/booking-race.test.ts`): 5 concurrent accepts → exactly 1 wins.

## Open questions / residual risks (lower severity)
- **#1 (real, event-day):** Per-IP rate limit. `/api/recruiters` & `/api/external-jobs` are fetched **client-side** (`directory.tsx`, `job-directory.tsx`) once per page mount + on search/pagination, carrying the venue's NAT IP. `auth` endpoints (login/verify-code) also use a 60/min/IP outer ring. The limiter is backed by Vercel Runtime Cache, which is **region-shared** (single region `sin1`), so 60/min/IP is enforced venue-wide. 1000 students behind a handful of NAT IPs will exceed 60/min/IP → 429. Failure mode: `/browse` and `/jobs` show "failed to load"; mass on-site login could 429. The core apply action (`POST /api/bookings`) is NOT IP-limited, so booking itself keeps working. Fix: raise the `api` per-IP ceiling (e.g. 60→600/min) and/or exempt the cached public-read endpoints; keep the per-email `auth` 5/min bucket (the actual brute-force defense) unchanged.
- **#2:** `POST /api/bookings` (initial apply) has no DB unique constraint and relies on a read-then-insert check → two concurrent submits could create duplicate *pending* applications (same student+time, or same student+recruiter+position). No slot corruption. Low severity.
- **#3:** Booking cancellation (`/api/bookings/[id]` DELETE) runs slot-release + status-update + waitlist-promotion as separate statements (not one transaction); a mid-sequence failure could leave an inconsistent state. Rare; medium severity.

## History
- 2026-06-06: Initial audit (3 parallel code agents + live DB probe). Corrected the 0.25 CU / connection-exhaustion assumption; identified the per-IP venue-NAT rate-limit lockout as the top real risk.

---
title: Event-day burst hardening — slot SKIP LOCKED + venue-NAT rate limit
type: decision
slug: 2026-05-13-event-day-burst-hardening
date: 2026-05-13
attributed_to: [claude-code]
belongs_to: [tecxwork, recruitment-workflows]
source: chat
status: active
tags: [reliability, booking, rate-limit, event-day]
related: [2026-04-28-double-booking-prevention]
---

## Context
Walkthrough of running V-GEN TRIDENT (200 students, 20 recruiters × 2 interviewers, 2 admins) surfaced two real burst-load problems:

1. **Slot picking** in `/api/bookings/review` and `/api/bookings/reverse` did `SELECT … ORDER BY random() LIMIT 1` then `UPDATE … WHERE status='available'`. Two concurrent acceptances at the same recruiter+time can pick the same `random()` row; the loser sees "Slot was just taken" even though another free interviewer exists. Recruiter has to manually retry — degrading UX exactly when the system is busiest.

   Also found a side-effect bug in `reverse/route.ts`: the transaction returned `{ ok: false }` after the applicant slot was already updated to `booked` if the recruiter slot update raced and failed. Drizzle commits on return, so the applicant slot would leak as booked with no matching `bookings` row.

2. **Auth rate limit** was `rateLimit(ip, "auth")` = 5 req/min/IP across `login`, `forgot-password`, `verify-code`. The event venue puts ~200 students behind one NAT; the 6th login attempt anywhere in the room would 429 the entire venue.

## Decision

**Slot claim — atomic SKIP LOCKED:** replace the two-step random-pick + CAS with a single statement using the canonical Postgres job-queue pattern:

```sql
UPDATE slots SET status='booked'
WHERE id = (
  SELECT id FROM slots
  WHERE recruiter_id=$1 AND start_time=$2 AND status='available'
  ORDER BY random() FOR UPDATE SKIP LOCKED LIMIT 1
) RETURNING id, start_time, end_time;
```

Two concurrent transactions never see the same row in their subquery → no spurious "slot taken" → no UX retries. `reverse/route.ts` now claims the recruiter slot FIRST and only then updates the applicant slot, with an explicit revert of the recruiter slot if the applicant slot is no longer free (avoids the leaked-applicant-slot bug).

**Auth rate limit — two-tier:** every auth endpoint now applies two limits:

- Outer: `rateLimit(ip, "api", "...-ip")` = 60/min/IP. Generous enough that a shared venue NAT (200 students) won't lock everyone out, strict enough to kill runaway scripts.
- Inner: `rateLimit(email, "auth", "...")` = 5/min per email. The actual brute-force defense — keyed to the account, not the IP.

The inner ring is keyed by user-supplied email, so an attacker can rotate emails to bypass it, but the outer IP cap holds them to 60/min total — well below useful brute-force throughput.

## Out of scope
- Real distributed rate limit (atomic INCR on Upstash/Postgres) — the cache-based limiter still has a small overshoot window under burst, documented in `src/lib/rate-limit.ts`.
- Per-email failure tracking on `/api/auth/login` (would need a `loginFailures` table; verify-code already has `failed_attempts`).
- Pre-warming Neon compute and Resend tier for event day.

## Files
- `src/app/api/bookings/review/route.ts` — slot claim via SKIP LOCKED
- `src/app/api/bookings/reverse/route.ts` — slot claim via SKIP LOCKED + recruiter-slot-first ordering + revert path
- `src/app/api/auth/login/route.ts` — two-tier limit
- `src/app/api/auth/verify-code/route.ts` — two-tier limit
- `src/app/api/auth/forgot-password/route.ts` — two-tier limit

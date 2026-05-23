---
title: Harden password-reset code verification against brute force
type: decision
slug: 2026-05-13-password-reset-brute-force-fix
date: 2026-05-13
attributed_to: [claude-code]
belongs_to: [tecxwork]
source: security-review
status: active
tags: [security, auth, password-reset]
related: [tecxwork]
---

## Context
A whole-system security review (Claude Code, /security-review) flagged `/api/auth/verify-code` as exploitable: the 6-digit reset code had **no per-code failed-attempt counter and no rate limit**, while `/api/auth/forgot-password` silently issued codes for any known email (up to 3 per hour) and the code itself was generated with `Math.random()`. An attacker who knew a target email could trigger a code and then enumerate the full 1,000,000 keyspace inside the 10-minute validity window, yielding the `resetToken` that `/api/auth/reset-password` accepts — full account takeover, including admin accounts.

Contrast: `/api/auth/verify-email` already implemented the correct pattern (latest-code lookup + 5-attempt cap via `failed_attempts` column).

## Decision
Mirror the verify-email hardening on the password-reset path:

1. **Schema**: add `failed_attempts integer NOT NULL DEFAULT 0` to `password_reset_codes` (`drizzle/0004_password_reset_failed_attempts.sql`, `src/lib/db/schema.ts`).
2. **`/api/auth/verify-code`**: rewrite to look up the latest unexpired/unused code by email, reject after 5 failed attempts, increment `failed_attempts` on mismatch, and gate the route with `rateLimit(ip, "auth", "verify-code")` (5 req/min/IP).
3. **`/api/auth/forgot-password`**: gate with `rateLimit(ip, "auth", "forgot-password")` and replace `Math.random()` with `crypto.randomInt(0, 1_000_000)` so codes aren't predictable from a process-wide PRNG state.

## Out of scope
- Per-email lockouts beyond the existing 3-codes-per-hour cap.
- Switching the rate-limit backend to an atomic store (the comment in `src/lib/rate-limit.ts` already notes this for credential-stuffing-grade defenses).

## How to apply
Run `pnpm db:migrate` (or `pnpm db:push`) before deploying so the new column exists; otherwise the verify-code route errors on `latest.failedAttempts`.

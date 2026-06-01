---
title: Move Vercel + Neon to Tokyo (latency for Taiwan users)
type: decision
slug: 2026-06-01-tokyo-region-migration
date: 2026-06-01
attributed_to: [niko]
belongs_to: [tecxwork]
source: document
status: active
tags: [infrastructure, latency, vercel, neon, region, runbook]
related: [project_vercel_deploy_topology, architecture-overview]
---

## Context
Users are in **Taiwan** (all 171 schools are Taiwan cities — Taipei, New Taipei,
Kaohsiung, etc.; event at MCUT, New Taipei). Both Vercel functions (`iad1`,
Virginia) and the Neon DB (`us-east-1`, Virginia) are in US East, so every
dynamic request crosses the Pacific (~180–220ms each way). DB is only 11 MB.

## Decision
Co-locate **both** in **Singapore**: Vercel `sin1`, Neon `ap-southeast-1`.

> **Revised from Tokyo → Singapore.** Tokyo was the latency-optimal pick
> (Taiwan→Tokyo ~35ms vs →Singapore ~50ms), but Neon does not offer
> `ap-northeast-1` (Tokyo) in this account's region list — only Singapore,
> Sydney, US, EU, SA. Singapore still saves ~130–170ms vs the current ~200ms to
> US-East; the 15ms Tokyo edge isn't worth it. **Vercel must be `sin1`** (not
> `hnd1`) to stay co-located with the Singapore DB.

**Hard rule:** functions and DB must stay co-located. Move the DB first; only
flip the Vercel region after the DB is live in Tokyo (the app fires several
sequential queries per request — split across the Pacific it would be far
slower, not faster).

## Runbook

### Pre-reqs
- `pg_dump`/`pg_restore` (PG 17). Not installed locally → `brew install libpq`
  then use `$(brew --prefix libpq)/bin/pg_dump`.
- Old DB stays untouched throughout = instant rollback.

### Steps
1. **Provision Singapore DB** — Neon project in `ap-southeast-1` (Tokyo not
   offered). Created manually in Neon console (MCP create_project has no region
   param; cached neonctl token was expired). Grab its pooled connection string.
2. **Dump → restore** (11 MB, ~seconds):
   `pg_dump "<OLD_URL>" -Fc -f /tmp/tecxwork.dump`
   `pg_restore --no-owner --no-acl -d "<NEW_URL>" /tmp/tecxwork.dump`
3. **Verify** row counts match across all 20 tables (esp. users, recruiters,
   job_openings, schools=171, event_config).
4. **Cutover** (brief window; do at low traffic):
   - Set `app` env `DATABASE_URL` + `POSTGRES_*` → new Tokyo host (all targets).
   - `vercel.json`: add `"regions": ["sin1"]`; commit + push.
   - Redeploy `app`; verify site 200s + DB reachable from Tokyo.
   - Update local `.env.local`.
5. **Rollback if needed**: revert env vars to old US-East host + region back to
   `iad1`, redeploy. Old DB still intact.

### Risks / notes
- Writes during the dump→cutover window are lost (acceptable: low traffic, event
  is June 6, 5 days out). For zero-loss, freeze writes during the window.
- The new project is on the **free** Neon plan — the 0.25 CU / connection-attempt
  ceiling that caused the 2026-06-01 outage persists regardless of region.
  Consider upgrading if traffic spikes on event day. See
  [[2026-06-01-neon-pool-crash-hardening]].
- Secrets (dump file, connection strings) kept out of git; temp files removed.

## Execution log
(filled in as steps complete)

### Execution (2026-06-01, completed)
- New Neon project `tecxwork` in `ap-southeast-1` (Singapore), PG 17, Neon Auth OFF. Host `ep-delicate-lab-aos3iphg`.
- `pg_dump -Fc` (direct host) → `pg_restore --no-owner --no-acl` (direct host). 402 KB dump.
- Verified: all 20 tables row-for-row identical (users=150, applicant_profiles=113, recruiters=36, job_openings=127, schools=171, slots=432, external_jobs=503, etc.). 0 mismatches.
- Cutover: `app` env `DATABASE_URL` + `DATABASE_URL_UNPOOLED` repointed to Singapore (all targets); `vercel.json` `regions:["sin1"]`; pushed `0fa373b`; redeployed.
- Verified live: `x-vercel-id` shows `sin1`; site 200s; Singapore DB shows live app connections.
- `.env.local` DATABASE_URL updated to Singapore. Dump file shredded.
- **Old US-East DB (`ep-lingering-sun-an5htstv`, Vercel-Marketplace-managed) left intact as rollback** — delete it once confident (a few days).

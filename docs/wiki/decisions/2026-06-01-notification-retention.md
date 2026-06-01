---
title: Notification retention — prune older than 90 days (daily cron)
type: decision
slug: 2026-06-01-notification-retention
date: 2026-06-01
attributed_to: [niko]
belongs_to: [tecxwork]
source: document
status: active
tags: [notifications, retention, privacy, cron]
related: [data-privacy, taiwan-compliance, architecture-overview]
---

## Context
`notifications` rows (recipient_email, title, message text, metadata jsonb) were
**never deleted** — no TTL/cleanup anywhere. They accumulate forever (201 rows,
oldest ~1 month, mostly booking_pending) and contain mild PII (applicant names,
emails). The bell only ever shows the latest ≤50, so old rows are invisible but
retained indefinitely — against data-minimization norms.

## Decision
Add a daily cron `GET /api/cron/prune-notifications` that deletes notifications
older than **90 days**. Caps growth and bounds PII retention. Invisible to users
(bell shows ≤50 recent anyway).

- Route mirrors the existing crawl-jobs cron auth (`CRON_SECRET` bearer).
- Schedule `0 19 * * *` (03:00 Taipei), staggered after crawl-jobs (`0 18`).

## Incidental fix: CRON_SECRET was missing
`CRON_SECRET` was not set on the `app` project, so the cron routes returned 503.
The crawl-jobs cron had no successful `crawl_logs` since 2026-04-29 — consistent
with it failing on the missing secret. Set `CRON_SECRET` (app env, all targets),
which both enables the prune cron and should revive crawl-jobs. Verify crawl-jobs
resumes after the next 18:00 UTC run.

## Files
`src/app/api/cron/prune-notifications/route.ts`, `vercel.json` (crons).

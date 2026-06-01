---
title: Consolidate to one Vercel project (delete redundant tecxwork)
type: decision
slug: 2026-06-01-vercel-project-consolidation
date: 2026-06-01
attributed_to: [niko]
belongs_to: [tecxwork]
source: document
status: active
tags: [vercel, infrastructure, web-push]
related: [2026-06-01-neon-pool-crash-hardening, architecture-overview]
---

## Context
The GitHub repo was connected to **two** Vercel projects that both auto-deployed
`main`: `app` (the live site, `work.tecxmate.com`, ~515k req) and `tecxwork` (no
real domain, only `tecxwork-six.vercel.app`). Every push triggered two
concurrent production builds against the same small free-tier Neon DB — which is
what doubled the connection load and contributed to the 2026-06-01 outage.

## Decision
Delete the redundant `tecxwork` project; `app` is the single source of truth.

Pre-checks before deleting: no real domain pointed at `tecxwork`; its daily cron
`/api/cron/crawl-jobs` was already duplicated on `app` (crawling continues); it
lacked `JWT_SECRET`/`RESEND_API_KEY` so it was never a functional serving project.

## Actions taken
- Copied the VAPID web-push keys (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY`) from `tecxwork` to `app` (all targets) — `app` had been
  missing them, so web-push only started working on the live site after this.
  NB: the values carried a trailing literal `\n` corruption that had to be
  stripped (correct lengths: public 87, private 43 chars, url-safe base64).
- Deleted the `tecxwork` Vercel project.
- Relinked the local repo (`.vercel/project.json`) to `app`.
- Redeployed `app` so the public VAPID key (a `NEXT_PUBLIC_*`, inlined at build)
  took effect.

## Consequence
Pushes now build once. Combined with reverting `poolQueryViaFetch`
([[2026-06-01-neon-pool-crash-hardening]]), the double-build connection storm
can no longer recur.

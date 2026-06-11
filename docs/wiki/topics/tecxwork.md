---
title: tecxwork web app
type: topic
slug: tecxwork
role: product
date: 2026-05-04
updated: 2026-06-11
attributed_to: [niko]
belongs_to: [tecxmate]
source: code
status: active
tags: [product]
related: [admin-panel, recruiter-dashboard, public-homepage]
---

## What it is
Career-fair platform connecting recruiters and applicants. Multi-language (en, vi, zh-TW). Event timezone is Asia/Taipei.

## Stack
- Next.js (App Router, modified per `AGENTS.md` — do not assume stock APIs).
- Drizzle ORM + Postgres (Neon).
- Vercel Blob for image uploads.
- Resend for transactional email.
- Hosted on Vercel.

## Sub-areas
- [Admin panel](admin-panel.md)
- [Recruiter dashboard](recruiter-dashboard.md)
- [Public homepage](public-homepage.md)

## Development Notes
- 2026-06-01: After switching from a Mac environment to a fresh Linux PC checkout, full lint surfaced `react-hooks/set-state-in-effect` from the current `eslint-config-next` / `eslint-plugin-react-hooks` install. The failing job browser pattern was not Linux-specific; the fresh dev dependency tree made the rule active. Fixed `src/components/recruiter-jobs-browser.tsx` by deriving the visible selected job for the desktop detail pane instead of synchronously correcting selection state inside an effect.

## Operations Notes
- 2026-06-06: Investigated a live report that the platform was stuck because too many people were using it at once. Public production checks from the local machine showed the homepage, jobs, login, browse, recruiter API, and external-jobs API responding normally; Vercel production `main` logs showed no recent 429/500/504 rows; direct Neon read-only probing completed in ~1.3s with only two visible DB sessions and no duplicate/orphan accepted slot integrity issues. Current counters observed: 167 applicants, 38 recruiters, 295 bookings, 89 accepted, 105 pending, 388 available recruiter slots, 89 booked slots. The local `/api/event-pulse` route was not live because production was still on `main` commit `3bda796`, while the route existed only on `preview/event-pulse-visualizer`.
- 2026-06-06: Vercel dashboard showed Hobby usage had exceeded free resources due to Fluid Active CPU at 5h23m / 4h. Recommendation: upgrade the live `app` project to Pro for the event period because the platform is now production/commercial event infrastructure and Hobby cannot buy extra on-demand usage once caps are hit; set a hard spend limit after upgrading.
- 2026-06-10: `RESEND_API_KEY` and `EMAIL_FROM` are configured in the Vercel `app` project for Production. Local `.env.local` had no Resend key, so the Production env was pulled to a temporary file and only those two email variables were merged into `.env.local` without changing the rest of the local env.
- 2026-06-10: GitHub traffic showed a temporary public exposure of the repository with elevated clone counts. Treat the source code as copied, but local checks found `.env*` files ignored and untracked, no `.env*` Git history, no secret-looking file paths in Git object history, and no matches for common high-signal token/private-key/credential URL formats across current tracked content or Git history; no dedicated secret scanner was installed locally.
- 2026-06-10: Commercial/IP framing for the temporary public exposure: because tecxwork is proprietary software intended for sale, treat the exposure as a business-risk event even without leaked secrets. Practical posture is to assume source availability to unknown cloners, keep repo private going forward, document copyright/proprietary ownership, and rely on product execution, deployment access, data, customer relationships, and follow-on roadmap as defensibility.
- 2026-06-11: Investigated a report that `work.tecxmate.com` was down after a DNS provider/nameserver move. Current DNS delegates `tecxmate.com` to Cloudflare (`jewel.ns.cloudflare.com`, `johnathan.ns.cloudflare.com`); `work.tecxmate.com` resolves from local, Cloudflare, and Google resolvers to Cloudflare proxy A/AAAA records; no parent DS record was present, so stale DNSSEC was not the active failure. The page returned HTTP 200 but streamed a Next/React boundary error with digest `1131362588`. Vercel production logs showed Neon rejecting homepage/job/notification queries with `Your account or project has exceeded the compute time quota. Upgrade your plan to increase limits.` Root cause is Neon free-plan compute quota exhaustion, not DNS.
- 2026-06-11: Cloudflare is not a drop-in managed Postgres replacement for Neon. Cloudflare Hyperdrive accelerates/pools connections to an existing Postgres/MySQL database, while Cloudflare D1 is managed serverless SQL with SQLite semantics. For the current Drizzle/Postgres app, the lowest-risk outage recovery remains upgrading Neon or migrating to another Postgres-compatible host, not moving to D1.
- 2026-06-11: Neon console screenshot confirmed the production project `tecxwork-db-sg` on the Free plan had `Limit reached` with compute usage `110.55 / 100 CU-hrs` since 2026-06-01, while storage (`0.04 / 0.5 GB`) and network transfer (`0.89 / 5 GB`) were below free limits. This confirms compute quota, not data volume, as the blocking resource.

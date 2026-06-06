---
title: tecxwork web app
type: topic
slug: tecxwork
role: product
date: 2026-05-04
updated: 2026-06-06
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

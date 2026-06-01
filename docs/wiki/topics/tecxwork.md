---
title: tecxwork web app
type: topic
slug: tecxwork
role: product
date: 2026-05-04
updated: 2026-06-01
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

## Planning Artifacts
- 2026-06-01: `docs/tecxwork-feature-list.csv` mirrors the column structure of `/home/niko/taildrop/PRD iMood_MVP_Function_List.xlsx` and lists 105 Tecxwork features across current MVP, next-phase SaaS, and future platform work.

## Development Notes
- 2026-06-01: After switching from a Mac environment to a fresh Linux PC checkout, full lint surfaced `react-hooks/set-state-in-effect` from the current `eslint-config-next` / `eslint-plugin-react-hooks` install. The failing job browser pattern was not Linux-specific; the fresh dev dependency tree made the rule active. Fixed `src/components/recruiter-jobs-browser.tsx` by deriving the visible selected job for the desktop detail pane instead of synchronously correcting selection state inside an effect.

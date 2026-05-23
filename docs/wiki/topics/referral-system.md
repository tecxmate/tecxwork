---
title: Referral System
type: topic
slug: referral-system
date: 2026-05-24
updated: 2026-05-24
attributed_to: [niko]
belongs_to: [tecxwork]
source: chat
status: active
tags: [referrals, professional-network, students]
related: [recruitment-workflows, data-privacy]
---

## Summary
The referral system lets working professionals create professional profiles, appear in a public network directory, receive student referral requests, and accept requests by writing endorsements that become student referrals.

## Current state
- Revived the old `feature/referral-system` branch and merged it with current `main` on 2026-05-24.
- Added `professional` as a user role, professional profile tables, referrals, and referral requests in `src/lib/db/schema.ts`.
- Routes currently include `/network`, `/professional/signup`, `/professional/dashboard`, `/api/professionals`, `/api/professionals/me`, `/api/professionals/signup`, `/api/referral-requests`, and `/api/referral-requests/[id]/respond`.
- Professionals must now be admin-verified before they appear in `/network` or can receive/respond to referral requests; admins manage this at `/admin/professionals`.
- Referral requests create in-app notifications for professionals, and professional responses create in-app notifications for applicants.
- Accepted public referrals now appear on recruiter/admin applicant profile pages at `/applicant/[id]`.
- Deployment can create the referral enum/tables with `npm run db:update:referral-system`.
- The database update was run successfully on 2026-05-24 after loading `.env.local`.
- The updated branch passes `npm run build`; `npm run lint` has the same existing warning baseline as `main`.

## Open questions
- Whether professional signup should reuse the current email verification and localized auth flows.
- Whether accepted referrals should also appear on student-owned profile views or recruiter search/list summaries.

## History
- 2026-05-24: Added admin verification for professionals, in-app referral notifications, verified-only public professional discovery, and applicant-profile referral display.
- 2026-05-24: Hardened professional signup and referral request APIs with current validation/auth helpers, removed the old JWT fallback secret path, and added `src/lib/db/add-referral-system-tables.ts`.
- 2026-05-24: Merged current `main` into `feature/referral-system`, resolved conflicts around auth roles, DB connection setup, and role selection, then added professional nav coverage.

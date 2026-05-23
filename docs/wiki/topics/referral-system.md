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
- The updated branch passes `npm run build`; `npm run lint` has the same existing warning baseline as `main`.

## Open questions
- How referrals should surface on student profiles and recruiter applicant views.
- Whether professionals require admin verification before students can request referrals.
- Whether referral requests should send email or in-app notifications.
- Whether professional signup should reuse the current email verification and localized auth flows.

## History
- 2026-05-24: Merged current `main` into `feature/referral-system`, resolved conflicts around auth roles, DB connection setup, and role selection, then added professional nav coverage.

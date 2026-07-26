---
title: CBtalent (NTUT) competitive audit → directory-quality improvements
type: decision
slug: 2026-07-26-competitive-audit-cbtalent
date: 2026-07-26
attributed_to: [niko]
belongs_to: [tecxwork, saas-strategy]
source: chat
status: active
tags: [competitive, ats, browse, trust, yang-luck]
related: [2026-07-18-yang-luck-demo, saas-strategy]
---

## Context
Niko spotted `ntut.cbtalent.tw` (a Facebook-promoted link) and worried tecxwork was
being copied. It is **not** a copy: CBtalent is a Taiwanese white-label campus-recruiting
SaaS; `ntut.` is National Taipei University of Technology's instance. It resembles tecxwork
only because both target SEA-talent → Taiwan. Different channel (university job board vs
tecxwork's agency/employer ATS). Treated as competitive intel, not a threat.

## Observed CBtalent weaknesses (verified via WebFetch)
- Salary chaos: `面議`/Negotiable/`-` with no range; mixed NTD/RM and unlabelled VND.
- Empty states leak: companies with `0 Job Vacancies`; a `placehold.co` placeholder logo in prod.
- Half-done i18n: Chinese/Vietnamese/English collide inside single cards.
- No result count / no pagination on job & company lists.
- Duplicate listings (same role ×2; `PouChen` vs `POU CHEN` as two companies).
- Thin trust layer: no verified-employer badge, no posted/closing dates (only "Last Edited").

## Decision — what we changed in tecxwork (`demo/yang-luck`)
- **#4 (counts/pagination): already ahead** — `/browse` Directory shows `"{n} companies · Page X of Y"`
  with search + numbered pagination; `/jobs` has a results count. No change needed.
- **#2 Empty-state gating:** `getCachedRecruiters` (cache.ts) now filters out companies with
  zero approved jobs. Existing clean logo fallback (Building2 box) retained — we never ship a
  broken placeholder.
- **#5 Dedup:** dedupe position titles per company + collapse duplicate company rows by
  normalized name in the directory read path. (DB unique index on `(recruiter_id, title)`
  recommended as the durable guard at merge time — not yet pushed.)
- **#6 Trust:** new `recruiters.verified` boolean (default **false** — ordinary sign-ups are NOT
  auto-verified; honest, not decorative). Agency-vetted client companies seeded verified →
  `BadgeCheck` on company card + detail header. Seeded jobs given a closing date so the
  application-deadline badge renders. Positioning line: *"They post jobs. We place candidates."*

## Root cause of "I only see Yang Luck as one company"
The **demo DB (Neon `lingering-sun`) was never migrated** to the post-refactor schema — it lacked
the `applications` table and the client-company recruiters. Fixed by `drizzle-kit push` +
FK-safe reseed against lingering-sun only (prod hosts `delicate-lab`/`bitter-hill` guarded out).
Result: 25 non-agency companies, all verified, all with ≥1 approved job + a closing date.

## Env hazard noted
In the `demo/yang-luck` preview env, `DATABASE_URL_UNPOOLED` points at **delicate-lab (prod)**
while `POSTGRES_URL`/`PGHOST` point at the demo `lingering-sun`. `DATABASE_URL` is sensitive
(blank on pull). Anything touching the demo DB must key off the lingering-sun URL and refuse
prod hosts. See [[project_stale_unpooled_db_url]].

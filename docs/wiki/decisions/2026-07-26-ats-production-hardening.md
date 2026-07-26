---
title: ATS production hardening — roadmap & decisions
type: decision
slug: 2026-07-26-ats-production-hardening
date: 2026-07-26
attributed_to: [niko]
belongs_to: [tecxwork, saas-strategy]
source: chat
status: active
tags: [ats, pipeline, rbac, multi-tenant, security, pii, yang-luck]
related: [2026-07-18-yang-luck-demo, 2026-07-26-competitive-audit-cbtalent, saas-strategy]
---

## Context
Turn the demo ATS pipeline into a **production-grade, secure ATS** that Yang Luck (a Taiwan manpower **agency**) and a large corporate HR team could actually run — "what CBtalent can't show under the hood." Full detailed plan lives at `~/.claude/plans/glowing-wiggling-eich.md` (not in-repo).

## Decisions (locked)
- **Tenancy:** Yang Luck first, **multi-tenant-ready** — `org_id` on every ATS table, org-scoped queries from day one; only Yang Luck onboarded now.
- **Model:** **Unified agency + corporate** — a job can be an internal requisition OR a client "job order"; candidates/pipelines/submissions serve both.
- **PII:** **Design for it, stage the tooling** — build security foundations + schema (consent/retention/erasure columns) now; enforcement jobs later.

## Reference architecture (researched)
- **Agency spine (Bullhorn):** `client → contact → job_order → submission → interview → placement`; talent pools, redeployment, commission/margin (bill-rate vs pay-rate), and a first-class **compliance_documents** table with expiry alerts (ARC/work-permit — the migrant-labor differentiator).
- **Corporate (Greenhouse/Lever/Ashby):** **configurable per-job stages as ROWS, not an enum** + an **append-only stage-transition log** (all funnel/time-in-stage reporting derives from it); scorecards (categories→attributes→focus); RBAC = org-tier × per-job role with salary/EEOC/private-notes gated separately.
- **Security:** app-layer org scoping + Postgres RLS on PII tables (org_id leading index); audit log insert-only, **PII-by-reference (hashes, not raw PII)** so erasure never breaks the chain; authorize-then-presign R2.
- **⚠️ Legal:** Vietnam PDPL (Law 91/2025) effective **2026-01-01** — extraterritorial, 72h erasure SLA, cross-border TIA filing. Taiwan PDPA purpose-limitation affects agency talent-pool re-use. Confirm with counsel before real VN/ID candidate PII.

## Reuse (don't rebuild)
Existing engines: `applications`/pipeline spine + kanban board; the concurrency-safe `bookings`/`slots` interview-scheduling subsystem (advisory locks + audit) → the Interview stage; JWT auth (`getRecruiterFromSession`); R2 uploads; cache; rate-limit; `bookingActionLogs` audit pattern; moderation gate; recruiter i18n.

## Roadmap (phased, each shippable)
- **Phase 0 — DONE + verified live (2026-07-26).** Code-only, no migration: `getPipelineBoard()` recruiter-scoped (agency keeps super-view); `PATCH /api/applications/:id` auth-gated + ownership-checked (was open); applying to a job now creates a real `applied` card (idempotent). Commit `3b8a167`. Verified: unauth stage-move → 401; agency sees all, client recruiter scoped (no cross-company leak).
- **Phase 1a — DONE + verified live (2026-07-26).** Tenancy + RBAC + audit foundation. Migration `db:update:ats-tenancy` (commit `5a5c4a6`): `orgs`, `memberships` (member_role), `audit_log`, `org_id` on recruiters/job_openings/applications, backfilled to one "Yang Luck" org (27 memberships, 26 recruiters + 36 applications scoped). Wiring (commit `669868d`): `getMember()` + `canMoveStage()`/`isOrgManager()` RBAC; `PATCH /api/applications/:id` enforces tenant isolation + row ownership + writes a `move_stage` audit row; board org-scoped; new applications stamped with org_id. Verified: agency move → 200 + audit_log row written; client moving another company's card → 403; scoping intact.
- **Phase 1b — DONE + verified live (2026-07-26).** Configurable pipeline. Migration `db:update:ats-pipeline` (commit `646534a`): `pipeline_templates`, `pipeline_stages` (stage_kind), append-only `application_stage_transitions`, `applications.stage_id`; seeded a default "Standard placement" template (5 stages) for the Yang Luck org, backfilled stage_id, seeded 1 transition/app. Board now renders columns from `board.stages` (per-org template), grouped by stageId, labels/colours by stage_kind (still bilingual); drag PATCHes `{stageId}`. `PATCH /api/applications/:id` validates the target stage ∈ member's org, updates stage_id + writes an append-only transition (txn) + audit. Legacy `applications.stage` enum kept only as a render fallback. Verified: agency stageId move → 200 + transition row; client moving another company's card → 403; board renders + scoping intact.
  - **⚠️ Reseed caveat:** `seed-yang-luck.ts` predates multi-tenancy — it recreates recruiters WITHOUT org_id and doesn't create memberships/templates/stage_id. After any reseed you MUST re-run `npm run db:update:ats-tenancy && npm run db:update:ats-pipeline` (both idempotent) or scoped boards return null. Harden the seed when Phase 2 rewrites it (clients/job_orders/submissions).
- **Phase 2 — DONE + verified live (2026-07-26). Approach = LAYER, not replace** (user decision): the agency spine mirrors existing recruiter/job/application data; the student-facing model is untouched.
  - **2a** (migration `db:update:ats-agency`, commit `c391a80`): `clients`, `contacts`, `job_orders` (client_order|internal_req), `submissions`, `placements`, each linked to its source row. Backfilled: 25 clients + 25 contacts, 35 job_orders, 37 submissions, 2 placements.
  - **2b** (commit `db121ab`): `getAgencyCrm()` roll-up + `ClientsCrmView` (totals, submission funnel, per-client table) on a new agency-only **Clients** tab (`/dashboard/clients`); non-agency redirected — verified no client-list leak to a client recruiter.
  - Agency-only nav tabs (Clients/Compliance) are now hidden from non-agency recruiters (commit 18b31d2, verified). Board→submissions convergence still deferred.
- **Phase 3 (compliance docs) — DONE + verified live (2026-07-27).** The Yang-Luck differentiator. Migration `db:update:ats-compliance` (commit `128b234`): `compliance_documents` (doc_type enum: passport/visa/arc/work_permit/medical/…), unique per (candidate, doc_type). Seeded 48 docs across 12 in-process candidates — 6 expired, 8 expiring ≤30 days. `getAgencyCrm()` computes expiry status LIVE (expired/expiring_soon/valid, 30-day window; no cron). Compliance is its OWN agency tab (`/dashboard/compliance`, `ComplianceView` — commit `5b4d163`, split out of Clients per niko's "Client is client, ARC is ARC" feedback): expired/expiring/valid alert cards + attention table. Verified: Compliance tab shows ARC/work-permit + status; Clients tab is clean.
  - **Phase 3 remaining (TODO):** talent pools, polymorphic activity feed, resume/document R2 upload type + signed URLs.
- **Phase 4 (reporting) — DONE + verified live (2026-07-27).** Agency-only **Reports** tab (`/dashboard/reports`, commit `bd6c087`) reading the append-only transition log: `getPipelineReport()` → candidate/placement metrics + placement rate, current funnel distribution per stage with avg days-in-stage, and an aging list (candidates longest in an active stage). `PipelineReportView` = metric cards + funnel bar chart + aging table. `seed-report-demo` backdates demo apps/transitions ~8 weeks for a realistic spread. Verified: funnel/metrics/aging render; Reports tab hidden from client recruiters.
- **Phase 4b (notes + scorecards) — DONE + verified live (2026-07-27).** Commit `6192b21`. Migration `db:update:ats-collab`: `activity` (per-application notes + stage_change events) + `scorecards` (recommendation enum + ratings jsonb + comment); seeded 15 notes + 10 scorecards. Shared `authorizeApplication()` authz. APIs: `GET/POST /api/applications/:id/timeline`, `POST /api/applications/:id/scorecard`; stage moves also write a stage_change event. `CandidateTimeline` in the pipeline drawer: fetch-on-open, shows scorecards (recommendation + star ratings + comment) + notes timeline, with add-note + submit-scorecard. Verified: unauth→401, GET returns seeded data, add note (author resolved) + add scorecard persist.
  - **Phase 4 remaining (TODO):** @mentions/notifications on notes.
- **Phase 5** — staged PII tooling (consent capture, retention timers, erasure), optional client portal.

## Not merging to main
This whole line stays on `demo/yang-luck` (the flagship dev branch); nothing surfaces on `main`. See [[project_stale_unpooled_db_url]] for the demo DB (lingering-sun) topology.

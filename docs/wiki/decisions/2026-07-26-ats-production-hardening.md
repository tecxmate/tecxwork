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
- **Phase 1b — TODO.** Configurable pipeline: `pipeline_templates`/`pipeline_stages` + `stage_kind` + append-only `submission_stage_transitions`; migrate the fixed `pipeline_stage` enum to a default template. (The riskier half — touches the board UI + PATCH + a data migration.)
- **Phase 2** — agency spine: clients, contacts, job_orders (type-flagged), migrate `applications → submissions`, placements.
- **Phase 3** — migrant-labor compliance_documents (expiry sweep→tasks), talent pools, activity feed, resume/doc R2 + signed URLs.
- **Phase 4** — scorecards/evaluations, funnel/time-in-stage reporting, notes/@mentions.
- **Phase 5** — staged PII tooling (consent capture, retention timers, erasure), optional client portal.

## Not merging to main
This whole line stays on `demo/yang-luck` (the flagship dev branch); nothing surfaces on `main`. See [[project_stale_unpooled_db_url]] for the demo DB (lingering-sun) topology.

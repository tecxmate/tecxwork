---
title: Yang Luck is the ESA licensee — the moat is the client-facing compliance clock
type: decision
slug: 2026-07-27-yang-luck-licensee-positioning
date: 2026-07-27
attributed_to: [niko]
belongs_to: [yang-luck, saas-strategy, taiwan-compliance]
source: chat
status: active
tags: [strategy, positioning, compliance, competitive, moat]
related: [yang-luck, taiwan-compliance, saas-strategy, taiwan-mol, 2026-07-26-ats-production-hardening, 2026-07-26-competitive-audit-cbtalent, 2026-07-18-yang-luck-demo]
---

## Context

[niko] raised a competitive-anxiety question — HR/recruiting sites in the Vietnam–Taiwan corridor launch constantly, and even non-technical incumbents now ship credible portals. Three comparables reviewed:

- **ntu.cbtalent.tw** — a **Crossbond** product, white-labelled per university. [niko] supplied the business model: Crossbond clones the portal for every school it can sign, funded by the school in exchange for running job fairs and events. The portal is the deliverable that justifies an institutional budget line; revenue is school contracts + event sponsorship. The software is a cost of sale, deliberately thin. (Extends [2026-07-26-competitive-audit-cbtalent](2026-07-26-competitive-audit-cbtalent.md), which audited the NTUT instance's quality defects; this adds *why* it is thin.)
- **tuyendungviettrien.com** — Việt Triển International. Vietnamese-first job board, 30+ industries, "trusted connector" positioning. A listings/SEO volume play.
- **pointsup.co** — Taoyuan, 繁中/EN/VN, full- and part-time, sells 企業方案 and 評點制方案 (Taiwan's points-based intermediate-skilled worker scheme), plus staffing dispatch.

**All three compete on the discovery layer** — more listings, better search, more SEO. That is the layer whose cost collapsed, which is why a new entrant appears weekly. No moat: zero switching cost, two-sided cold start.

## Decision

**Yang Luck is confirmed by [niko] as the ESA licensee** (私立就業服務機構), not a customer of a third-party unlicensed tool. This scopes the licensing-avoidance posture in [taiwan-compliance](../topics/taiwan-compliance.md) §1 to the Tecxmate-independent-product case only. Regulated matching and placement activity are available product surface for the Yang Luck deployment.

**The strategic conclusion — validated by, not additive to, the existing build:** the moat is the regulated placement lifecycle, and the next unit of leverage is **putting the compliance clock in the client's own hands**, not adding more internal tooling.

## What was already true (correcting a stale survey)

A sub-agent inventory run on 2026-07-27 surveyed branch `worktree-yang-luck-logo` @ `ee7df2e` (based on `db6c9ae`, 2026-07-18) and reported the ATS as a thin unsecured demo. **That base was ~30 commits stale.** Per [2026-07-26-ats-production-hardening](2026-07-26-ats-production-hardening.md), Phases 0–5 shipped and were verified live on 2026-07-26/27:

- Pipeline recruiter-scoping and `PATCH /api/applications/:id` auth+ownership — Phase 0, `3b8a167`.
- Apply → real `applied` card, i.e. the bookings/applications seam — Phase 0.
- `orgs`/`memberships`/`audit_log`/`org_id` tenancy + RBAC — Phase 1a.
- Configurable stages as rows + append-only `application_stage_transitions` — Phase 1b.
- Agency spine `clients → contacts → job_orders → submissions → placements` — Phase 2.
- **`compliance_documents` with ARC/work-permit expiry status and a Compliance tab — Phase 3, `128b234`/`5b4d163`.**
- Funnel/aging reporting off the transition log — Phase 4. Notes + scorecards — Phase 4b. PII consent/retention/erasure + retention-sweep cron — Phase 5. Talent pools.

The prior hardening doc independently reached the same conclusion, calling compliance documents "the migrant-labor differentiator." This decision does not redirect that work; it names the commercial thesis behind it and identifies what is still missing.

## What is genuinely still open

Ranked by strategic leverage, not effort:

1. **Client portal — the actual moat, currently deferred.** The hardening doc defers it as "a large separate build (new auth surface for client contacts)." But every compliance feature built so far serves *Yang Luck staff*. Lock-in only materialises when **factory HR logs in and sees their own workers' permit expiries**. At that point the employer cannot leave without losing their compliance clock. This converts the whole Phase 3 investment from an internal efficiency tool into a switching cost.
2. **Real document storage.** `compliance_documents` tracks expiry, but the demo has placeholder `cvLink`s and no uploaded files; signed-URL R2 storage is still TODO. For a compliance product the document *is* the artifact — an expiry date nobody can click through to is not auditable.
3. **MOL 評鑑 evidence pack — not in any roadmap.** Licensed agencies face MOL's periodic 私立就業服務機構評鑑, a scored, publicly-published audit. The evidence is largely derivable from data already captured (`audit_log`, `application_stage_transitions`, `activity`, `compliance_documents`). Small build, outsized commercial value — and it sells to employers worried about their own exposure.
4. **Fee ledger / RBA Employer-Pays export — not in any roadmap, no schema.** Tier-1 electronics manufacturers supplying RBA-member brands are audited against zero worker-paid recruitment fees. A broker who can *prove* Employer-Pays compliance with an exportable per-worker itemised trail wins a premium, sticky segment no job board can serve. Requires knowing Yang Luck's actual fee structure first (see Open questions).
5. **Recruiter-side Vietnamese.** `src/messages/recruiter/` is zh-TW/en only and the kanban has its own inline bilingual literal, against a trilingual spec.

## Rationale

- Competitors cannot follow. Copying the compliance lifecycle requires holding a licence and accepting audit exposure; copying a job board requires a weekend.
- Crossbond's thinness is structural — nobody there invests in ATS depth because software is not where the revenue is. The operational layer is uncontested.
- The already-built booking engine ([2026-04-20-custom-booking-engine](2026-04-20-custom-booking-engine.md)) — bi-directional slots, `SKIP LOCKED` + advisory-lock claiming, burst-hardened, full audit — is a second uncontested asset. Every named competitor runs events; none can run one that does not fall over.
- Retained commitment: free for workers/students. Originally a licensing-avoidance artifact; now a marketing position, since worker-paid fees are the corridor's defining reputational problem.

## Consequences

- Positioning line: **"the system of record for a compliant Vietnam→Taiwan placement"** — sold to factories, trusted by workers. Complements the existing *"They post jobs. We place candidates."*
- Client portal is promoted from deferred to the next major build.
- Stop benchmarking against job boards in roadmap discussions.
- **Deferred idea (recorded, not chosen):** Crossbond's model pointed upstream — white-label the ATS to Vietnamese-side partners with captive candidate supply (DOLAB-licensed sending agencies, vocational colleges, DOLISA offices). Same playbook, one link earlier in the chain.
- **Process note:** always `git fetch` and survey `origin/demo/yang-luck`, not a local worktree branch. The stale-base survey above produced a materially wrong picture of the product's maturity.

## Open questions

- Revenue split between Taiwan-side employer service fees and any Vietnam-side fee component. Asked, unanswered. Gates how aggressively fee transparency can be used publicly and whether item 4 is viable.
- Yang Luck's current MOL evaluation grade (A/B/C) — sets urgency on item 3.

## Provenance

- Discussed on 2026-07-27 between [niko] (owner) and [claude-code] (agent).
- Competitor pages read via WebFetch; Crossbond business model supplied directly by [niko].
- Corrected against `origin/demo/yang-luck` @ `6ffdc42` after an initial survey of a stale local base.
- No implementing commits — direction only.

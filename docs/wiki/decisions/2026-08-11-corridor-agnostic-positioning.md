---
title: The platform is corridor-agnostic — Vietnam→Taiwan is the first corridor, not the model
type: decision
slug: 2026-08-11-corridor-agnostic-positioning
date: 2026-08-11
updated: 2026-08-11
attributed_to: [niko]
belongs_to: [tecxwork, saas-strategy]
source: chat
status: active
tags: [strategy, positioning, product-scope, billing]
related: [saas-strategy, tecxwork, yang-luck, 2026-07-27-yang-luck-licensee-positioning, taiwan-compliance]
---

## Decision

[niko]: **do not assume the candidate supply is Vietnam and the hiring side is Taiwan. Treat
it as a generic job platform.**

Vietnam→Taiwan is the **first corridor** — the one Yang Luck operates and the one V-GEN
TRIDENT served. It is not the product's model, and it must not be baked into how the
platform, its pricing, or its roadmap questions are framed.

## What this changes

The framing, not the system. The live product is already corridor-agnostic and this decision
records that as an intended property rather than an accident, so it does not get eroded.

**Reframed — the revenue-split question.** [2026-07-27-yang-luck-licensee-positioning](2026-07-27-yang-luck-licensee-positioning.md)
left an open question worded as *"revenue split between Taiwan-side employer service fees and
any Vietnam-side fee component."* That phrasing builds the corridor into the question, so any
answer inherits it. The question is now:

> **Which side of a placement carries the fee — the hiring employer, the supply-side partner
> who sourced the candidate, or both — and in what proportion?**

Roles, not countries. The Taiwan/Vietnam instance is one substitution into it. This also keeps
the retained commitment (free for workers/candidates) legible as a *platform* position rather
than a corridor-specific one.

## What is already generic (verified, not assumed)

Checked against `demo/yang-luck` @ `9924e63`:

- `applicant_profiles.nationality` — free text, empty default. No enum, no Vietnam default.
- **The fee model carries no geography.** `clients.fee_basis` + `fee_value`,
  `placements.fee_amount`, `fee_source`, and the invoice/credit-note chain are all
  country-neutral.
- No user-facing copy in `src/messages/` asserts a Vietnam→Taiwan direction.
- The three UI locales (en / vi / zh-TW) are a *market* choice for the first corridor, not a
  structural one — adding or swapping a locale needs no model change.

## The one hardcoded exception (and why it is not worth a migration)

`external_jobs.is_vietnamese_job` (default `true`), set by `isVietnameseRelatedJob()` in the
104 and 1111 crawlers and used to filter what the crawl keeps.

This is confined to the **external-jobs subsystem, which is dead**: `external_jobs` is
referenced nowhere outside the crawler and `schema.ts`, and `/api/external-jobs` has no
in-app caller since the jobs page was rebuilt onto recruiter-posted openings. Genericising a
dead subsystem is wasted work — the live decision is whether to **remove** it (see
Consequences), and that is a separate call.

## Jurisdiction is not direction

Deliberately **not** genericised, because these follow from *where the operator is licensed*,
not from an assumption about who supplies candidates. Any Taiwan-licensed operator needs them
regardless of where its candidates come from:

- `DEFAULT_TAX_RATE_BP` — 5% 營業稅.
- ESA / 私立就業服務機構 licensing and the obligations in [taiwan-compliance](../topics/taiwan-compliance.md).
- ARC and work-permit expiry tracking in `compliance_documents`.
- `months_salary` as a fee basis — the local convention, but already one option beside
  `percent_annual`, so it is parameterised rather than baked.

A second corridor would add its own jurisdiction layer beside this one; it would not replace it.

## Consequences

- Roadmap and pricing questions get phrased in **roles** — employer side, supply side,
  candidate — not in country names. The corridor is an instance, supplied per deployment.
- Yang Luck's pages keep their Vietnam→Taiwan description. That is a true fact about that
  **client**, not a claim about the platform, and flattening it would lose real information.
- **Open:** whether to delete the external-jobs crawler outright. It is dead code carrying
  the only corridor assumption in the schema, but an API route may have consumers outside this
  repo. Not decided here.
- The RBA Employer-Pays export (item 4 of the 07-27 decision) is **strengthened** by this
  framing, not weakened: "the employer pays, never the worker" is a principle that travels to
  any corridor, and is exactly the kind of claim a generic platform can make portable.

## Provenance

- Stated by [niko] on 2026-08-11 in chat, correcting the framing of the revenue-split question.
- Codebase claims above verified against `origin/demo/yang-luck` @ `9924e63` by [claude-code].

---
title: tecxwork's contribution to marketecx is aggregates, not rows
type: decision
slug: 2026-09-14-marketecx-tecxwork-contribution
date: 2026-09-14
updated: 2026-09-15
attributed_to: [niko, claude-code]
belongs_to: [marketecx, tecxwork]
source: chat
status: proposed
tags: [marketecx, pipa, integration, design-system]
related: [marketecx, saas-strategy, 2026-09-15-flagship-is-bizmap-tecxwork-feeds-it]
---

## Context

[niko] is combining three Tecxmate systems into one market-intelligence product,
**marketecx**: bizmap (every registered business in Taipei, geocoded from the tax registry),
alphatecx (TWSE/TPEX flows, monthly revenue, supply-chain nodes) and tecxwork. The stated
shape is a queryable Claude connector — ask Claude about a street, and it queries marketecx
alongside Google Maps and reasons about the difference.

tecxwork's role in that is employment data: open roles, categories, locations, salary bands.
The full proposal lives in bizmap at `docs/marketecx.md`; this page records only what binds
*this* repo.

## Decision

**Only aggregates leave tecxwork.** No applicant row, and nothing derived from one that could
re-identify a person, reaches marketecx. tecxwork publishes a
`/api/market-pulse`-shaped endpoint — openings by category × city × salary band, with a
minimum cell size — modelled on `src/app/api/event-pulse/route.ts`, which is already public,
CORS-open, rate-limited, cached, and derived-counts-only.

**`clients.unified_business_no` becomes the join key and gets backfilled.** The column already
exists (`src/lib/db/schema.ts:682`, validated 8 digits in `src/lib/validation-agency.ts`) and
is optional, unverified free text. Resolving client names against bizmap's registry populates
and verifies it.

## Rationale

`applicant_profiles` carries `pipa_consent`, `consent_at`, **`consent_purpose`**,
`retention_until` and `anonymized_at` — consent was designed in, and the purpose is
recruitment for a named event and employer. Market intelligence is not that purpose, and no
amount of aggregation at the *consumer* end fixes a row that should not have been sent. The
boundary therefore sits at tecxwork's own API, not in marketecx.

Job openings are employer-side and a different matter, but a small employer's single posting
is close enough to identifying that the aggregate needs a floor before publication.

The 統編 backfill pays for itself twice: marketecx gets a join key that is not Chinese
company-name matching, and tecxwork gets *verified* client identity, which the ESA-licensee
compliance story ([2026-07-27](2026-07-27-yang-luck-licensee-positioning.md)) wants anyway.

## Consequences

- A new public route in tecxwork, on the `event-pulse` pattern: rate-limited, cached, no PII,
  minimum cell size. It is the only surface marketecx may read.
- A backfill for `clients.unified_business_no`, resolving against bizmap's registry.
- **A testable claim before anything is built on it.** The reason tecxwork belongs in
  marketecx at all is the hypothesis that *hiring leads revenue* — openings here against
  alphatecx's `raw_monthly_revenue`, using its existing `q_lead_lag` / `q_cointegration_pair`
  machinery. It should be tested on history, not assumed. If it fails, tecxwork's role in
  marketecx is much smaller than this page assumes.
- **The design system has no dark mode, and that is now a cross-product problem.** The
  Tecxmate design system document is a light-only specification; `src/app/globals.css`'s
  `.dark` block is the only place a Tecxmate dark palette exists anywhere. bizmap's admin
  panel needed one on 2026-09-14 and had to source it from here. The fix is one published
  `tecxmate-tokens.css` carrying both modes, consumed by all three products — otherwise each
  new surface re-derives a dark theme, differently.

## Update, 2026-09-15 — the boundary holds, and gains a second reason

[niko] settled the commercial shape: bizmap/marketecx is the flagship and the only surface
sold; tecxwork's data supports it and is not monetised
([decision](2026-09-15-flagship-is-bizmap-tecxwork-feeds-it.md)). Nothing above changes —
the aggregates-only rule was set by `consent_purpose`, which no commercial decision moves.
What changes is that **no revenue is taken for anything derived from `applicant_profiles`**,
and the minimum cell size becomes load-bearing: derived employment counts inside a *sold*
product are a harder §20 question than the same counts published freely.

## Provenance

- Discussed 2026-09-14 between [niko] (owner) and [claude-code] (agent).
- Full proposal: `tecxmate/bizmap` → `docs/marketecx.md`, PR
  [tecxmate/bizmap#32](https://github.com/tecxmate/bizmap/pull/32).
- Nothing implemented in this repo yet.

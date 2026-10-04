---
title: bizmap/marketecx is the flagship; tecxwork's data feeds it and is not sold
type: decision
slug: 2026-09-15-flagship-is-bizmap-tecxwork-feeds-it
date: 2026-09-15
updated: 2026-09-15
attributed_to: [niko]
belongs_to: [tecxwork, marketecx, saas-strategy]
source: chat
status: active
tags: [strategy, positioning, monetization, compliance, marketecx, pipa, esa]
related: [marketecx, saas-strategy, taiwan-compliance, 2026-09-14-marketecx-tecxwork-contribution, 2026-07-27-yang-luck-licensee-positioning, 2026-08-12-saas-tenancy-and-commercial-model]
---

## Context

[niko], 2026-09-15:

> monetizing tecxwork and alphatecx both touch legal gray zone, probably need to leverage
> their data to support bizmap only, bizmap, marketecx system is our flagship product

This lands across three repos. It answers a question bizmap's `docs/marketecx.md` had left
open — whether marketecx is a product or a research tool — and it retires alphatecx's
2026-08-08 plan to sell a Stripe-gated MCP connector. What it means *here* needs stating
precisely, because tecxwork already has a shipped commercial model with a licensing
rationale behind it.

## Decision

**bizmap/marketecx is the flagship and the commercial surface. tecxwork's data supports it
and is not itself monetised.**

Concretely, and this changes nothing about the boundary already set on 2026-09-14: the only
thing that leaves this repo for marketecx is derived counts above a minimum cell size, and
that stays true whether or not marketecx is sold. The decision adds a reason rather than a
restriction — the aggregates-only boundary now also means **no revenue is taken for anything
derived from `applicant_profiles`**, which is the cleanest possible answer to a
`consent_purpose` that says recruitment.

## Which gray zone, exactly

Two readings of "monetizing tecxwork … touches legal gray zone", and they lead to different
work, so the interpretation is recorded rather than assumed:

**The reading taken.** The gray zone is
[taiwan-compliance](../topics/taiwan-compliance.md) §1: an ESA licence
(私立就業服務機構) is required for platforms that actively match employers with job seekers
**for profit**, and the avoidance strategy there — position as event-operations software —
is scoped explicitly to "the unlicensed Tecxmate independent product". That is the thing the
directive retires. It is the same shape as alphatecx's problem, which is investment-advice
licensing: in both cases the exposure is *Tecxmate selling a regulated activity without
holding the licence for it.*

**What the reading leaves standing, and why.** The
[Yang Luck deployment](2026-07-27-yang-luck-licensee-positioning.md) is not in that
position — [yang-luck] **is** the ESA licensee, which is precisely why regulated matching and
placement are available product surface there. And
[2026-08-12-saas-tenancy-and-commercial-model](2026-08-12-saas-tenancy-and-commercial-model.md)
sells per-seat software to licensed agencies through sales-led provisioning, chosen partly
*because* it "fits ESA licensing". Selling software to a licensee is not the unlicensed
matching-for-profit that §1 describes.

So the working interpretation is: **the independent unlicensed Tecxmate product in
[saas-strategy](../topics/saas-strategy.md) is what the directive retires; the licensed
agency line is not.** If [niko] meant the wider reading — that tecxwork stops being sold at
all — say so and this page is revised; that would also supersede 2026-08-12 and change what
the Yang Luck build is for, which is too large a consequence to infer from one sentence.

## The principle underneath all three systems

Stated once so it does not have to be re-derived per repo: **sell where the licence is
already held, or not needed.**

| | What would be sold | Licence position |
|---|---|---|
| bizmap/marketecx | access to a census built from government open data | 政府資料開放授權條款第1版, **不限目的** — commercial use is expressly permitted |
| alphatecx | a connector giving investment context to funded investors | no investment-advice licence; market data obtained for personal use |
| tecxwork, independent product | matching employers and job seekers for profit | no ESA licence |
| tecxwork, Yang Luck / licensed agencies | software to a licensee | the customer holds the licence |

bizmap is the only one of the four whose commercial basis is affirmative rather than
absent — the licence does not merely fail to forbid the sale, it permits it by name. That is
why it is the flagship, and it is a better reason than product-market fit.

**The corollary, which is easy to get wrong: a licence travels with the data, not with the
repository it sits in.** Deciding tecxwork is not sold does not make an applicant-derived
figure sellable by aggregating it into something that is. The boundary stays at this repo's
own API, which is what 2026-09-14 already decided and why.

## Consequences

- **No change to the build.** The `/api/market-pulse`-shaped endpoint and the
  `clients.unified_business_no` backfill are unaffected; the aggregates-only rule is
  unchanged and now has a second reason.
- [saas-strategy](../topics/saas-strategy.md) is qualified: the multi-tenant B2B SaaS pivot
  is no longer a Tecxmate revenue line in its own right under this reading, though every
  capability it produced still serves the licensed-agency deployment.
- **A commercial framing does not help the aggregates' case, it hurts it.** Publishing
  derived employment counts as part of a sold product is a harder §20 question than
  publishing them freely. The minimum cell size is now load-bearing rather than tidy.
- `clients.unified_business_no` remains worth backfilling on this repo's own terms —
  verified client identity is what the 評鑑 evidence pack wants — so it does not depend on
  marketecx being sold.

## Provenance

- Stated by [niko] on 2026-09-15; recorded by [claude-code].
- Companion records: `tecxmate/bizmap` → `docs/marketecx.md` §11 and the export tripwire in
  `docs/legal.md`; `nikolasdoan/alphatecx` →
  `docs/wiki/decisions/2026-09-15-alphatecx-feeds-bizmap-not-sold.md`.
- No code changed in this repo.

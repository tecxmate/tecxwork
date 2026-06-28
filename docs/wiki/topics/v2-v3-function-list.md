---
title: V2/V3 Function List & Cost Model
type: topic
slug: v2-v3-function-list
date: 2026-06-29
updated: 2026-06-29
attributed_to: [niko]
belongs_to: [tecxwork, saas-strategy]
source: synthesis
status: active
tags: [roadmap, cost, spec, marketplace, scale, security]
related: [saas-strategy, taiwan-compliance, taiwan-legal-operational-framework, architecture-overview, load-readiness, data-privacy]
---

## Summary
Full V2/V3 capability spec + ballpark cost model for handing to the dev team (effort/cost estimation) and business team (financial-model validation). Scopes TECXWORK from a career-fair tool into an **always-on cross-border (VN↔TW) job marketplace + flagship event engine**, benchmarked vs 104/1111/CakeResume. Lives at `docs/specs/tecxwork-v2-v3-function-list.md`.

## Key decisions captured
- **Vision:** Marketplace + events (not event-only, not full pivot). Event engine = wedge/moat; Talent Passport carries event data into the marketplace.
- **Platforms:** Web + PWA first (all roles), event kiosk/tablet mode, then Capacitor store wrappers in V3. **Native Android/iOS deferred** — recommendation for a 10-person team: PWA delivers ~85–90% of "an app" without a second/third codebase, app-store release trains, or a separate security surface.
- **Cost basis:** Ballpark $ + effort sizing. Blended rate assumption **~$1,500/person-week** (anchored to the tecxmate NT$1M≈US$31K 2-month MVP reference). All $ scale with this rate.

## Headline numbers (planning-grade)
- V2 engineering: ~230–300 pw ≈ **$345K–450K** (~9–12 mo).
- V3 engineering: ~150–210 pw ≈ **$225K–315K** (~6–9 mo).
- Infra/year: Tier 1 **$11K–48K** · Tier 2 **$100K–340K** · Tier 3 **$480K–1.5M**.
- Maintenance/year: **$145K–300K** (Tier 1) → up to **$2.7M** (Tier 3).
- **Non-engineering gate:** Taiwan ESA license (500K NTD capital, 3–4 mo, certified employment professional) — separate OPEX; stay positioned as "event/scheduling software" during validation.

## Open questions (for the teams) — answered §11
Product recommendations now in spec §11: (1) monetize software/ads first, placements only post-ESA-license; (2) don't pre-buy the ESA license — start ~2 quarters before placement revenue; (3) Tier-2-ready, Tier-1-priced; (4) wrap LLMs + pgvector, don't build ML; (5) VN supply, TW demand; (6) SG/JP storage + consent is PIPA-compliant, keep TW-region optionality; (7) plan at $1,500/pw, sell the 3–4× Taiwan-shop savings story (~$2.0M–2.7M equiv). Still need the teams to ratify.

## History
- 2026-06-29 — Created the V2/V3 function list + cost model; grounded in [[taiwan-compliance]], [[taiwan-legal-operational-framework]], [[architecture-overview]], [[load-readiness]], [[data-privacy]], [[saas-strategy]].

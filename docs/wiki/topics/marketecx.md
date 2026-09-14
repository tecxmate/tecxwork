---
title: marketecx
type: topic
slug: marketecx
date: 2026-09-14
updated: 2026-09-14
belongs_to: [tecxmate]
source: synthesis
status: proposed
tags: [marketecx, integration, mcp, pipa]
related: [2026-09-14-marketecx-tecxwork-contribution]
---

## Summary

marketecx is [niko]'s proposed market-intelligence product joining three Tecxmate systems:
**bizmap** (255,637 Taipei business registrations, 98% geocoded from the tax registry and the
city's house-number file), **alphatecx** (TWSE/TPEX institutional flows, monthly revenue,
supply-chain classification, 48 read-only MCP tools in production) and **tecxwork** (open
roles, categories, locations, salary bands). The intended surface is a queryable Claude
connector, so that a question like "what restaurants are on 永康街" can be answered from the
registry and compared against Google Maps — the gap between the two being itself the product.

## Current state

Proposed, not started. The full design lives in `tecxmate/bizmap` → `docs/marketecx.md`.

What tecxwork contributes, and the boundary it must not cross, is
[2026-09-14](../decisions/2026-09-14-marketecx-tecxwork-contribution.md).

Three facts from that proposal that constrain this repo:

- **統一編號 is the join key.** bizmap is its canonical holder; tecxwork has the column
  (`clients.unified_business_no`) unpopulated and unverified; **alphatecx has no 統編 at all**,
  only `ticker_id`. One column on alphatecx's `dim_ticker` closes the triangle.
- **The read model centralizes into Cloudflare D1; the systems of record do not.** Each
  producer *pushes* an extract on its own schedule. Nothing pulls — in particular nothing may
  reach alphatecx's Postgres, which has TLS disabled outright.
- **tecxwork is the only one of the three holding personal data under 個資法**, which is why
  its contribution is an aggregate endpoint rather than a table.

## Open questions

- Is marketecx a product or an internal research tool? The answer decides whether the PIPA
  and market-data licensing questions arrive all at once or barely at all.
- Does *hiring lead revenue*? This is the whole justification for tecxwork's involvement and
  it is testable against history before anything is built on it.
- Does the connector answer as bizmap or as marketecx? A census connector is useful on its
  own and could ship first.

## History

- 2026-09-14 — proposed by [niko]; all three codebases read and the design written up in
  bizmap ([PR #32](https://github.com/tecxmate/bizmap/pull/32)). tecxwork's contribution
  scoped to aggregates.

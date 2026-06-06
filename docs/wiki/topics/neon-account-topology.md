---
title: Neon account topology & MCP wiring
type: topic
slug: neon-account-topology
date: 2026-06-06
updated: 2026-06-06
attributed_to: [claude-code]
belongs_to: [tecxwork]
source: observation
status: active
tags: [neon, mcp, database, infra, auth]
related: [architecture-overview, stale-unpooled-db-url]
---

# Neon account topology & MCP wiring

The Neon MCP server (`https://mcp.neon.tech/mcp`, OAuth) does **not** authenticate to the
account that owns the live app databases. This is a wiring quirk to keep straight.

## Two distinct Neon worlds

**MCP-visible account — org "Tecxmate"** (`org-muddy-hill-84308768`, free plan):
- Projects: `dental-ai`, `alphatecx` — both us-east-1. **Neither is the job platform.**
- This is the account the Neon MCP OAuth is currently logged into.

**Live app databases — a *different* Neon login** (not visible to the MCP, not shared in):
- Primary `DATABASE_URL` → `ep-delicate-lab-aos3iphg`, **ap-southeast-1 (Singapore)**, project the app actually reads.
- `POSTGRES_URL*` → `ep-bitter-hill-a44dek8n`, us-east-1, project `lucky-thunder-02244525`.
  The `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` / `POSTGRES_URL_NO_SSL` naming is the
  signature of the **Vercel↔Neon marketplace integration**.

## Consequence

Neon MCP tools (`run_sql`, `describe_project`, etc.) operate on the Tecxmate org's DBs, **not**
the production job-platform DB. Don't assume MCP queries hit live data until the MCP is
re-authed.

## Fix: re-auth the MCP to the correct login

The MCP uses OAuth, so switching accounts is interactive (`/mcp` → Neon → Clear authentication →
re-authenticate). Critical step: **log out of the Tecxmate Neon session in the browser first**,
or Neon SSO silently hands the same session back. Sign in with the other Neon login that owns
`delicate-lab` / `bitter-hill`. Confirmed by niko (2026-06-06) that a separate login owns them.

See also [[stale-unpooled-db-url]] — a related "wrong Neon DB" footgun in `.env.local`.

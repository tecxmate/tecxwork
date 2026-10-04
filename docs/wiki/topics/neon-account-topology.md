---
title: Neon account topology & MCP wiring
type: topic
slug: neon-account-topology
date: 2026-06-06
updated: 2026-08-16
attributed_to: [claude-code]
belongs_to: [tecxwork]
source: observation
status: active
tags: [neon, mcp, database, infra, auth]
related: [architecture-overview, stale-unpooled-db-url, demo-db-manual-capture]
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

## 2026-08-16 production credential hygiene

A production Neon `DATABASE_URL` password for the primary `ep-delicate-lab-aos3iphg`
database was pasted into a chat transcript. Treat that credential as compromised: rotate the
password in Neon and update Vercel's production `DATABASE_URL` before running more production
diagnostics. Do not preserve the old password in shell history, wiki notes, logs, or command
transcripts.

For one-off diagnostics, export the URL without echoing or storing it:

```bash
read -rs DATABASE_URL && export DATABASE_URL
```

The read-only `db:doctor` script from PR #32 imports `./seed-sql`, so it must live beside that
module at `src/lib/db/doctor.ts`; copying it to `/tmp/doctor.ts` breaks module resolution. On a
branch where `package.json` has the script, run `npm run db:doctor` after exporting
`DATABASE_URL`. Otherwise, fetch the branch and materialize only `src/lib/db/doctor.ts` into that
same path, then run `npx tsx src/lib/db/doctor.ts`.

The 2026-08-16 doctor run against the primary production pooled host found the ATS tables present
but the saas-tenancy migration missing: `orgs.status`, `orgs.plan`, `orgs.seat_limit`,
`orgs.trial_ends_at`, `orgs.billing_email`, and `event_config.org_id` were absent. Production had
zero `orgs`, zero `memberships`, no `org_invites` table, and one platform-default `event_config`
row. Verdict: the agency schema exists, but agency routes that read the new commercial tenancy
columns will 500 until the additive PR #32 `add-saas-tenancy.ts` migration runs.

Later on 2026-08-16, Niko approved applying that additive production migration. The migration
completed successfully against the primary pooled host: no org rows existed to backfill,
`org_invites` was created with zero rows, and the singleton platform-default `event_config` row
remained. A follow-up doctor run reported: ATS schema present, saas-tenancy applied, and verdict
`Ready`.

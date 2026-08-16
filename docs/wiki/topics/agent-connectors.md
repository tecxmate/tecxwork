---
title: Agent Connectors & SaaS Readiness Audit
type: topic
slug: agent-connectors
date: 2026-08-12
updated: 2026-08-12
attributed_to: [niko, claude-code]
belongs_to: [tecxwork, saas-strategy]
source: chat
status: active
tags: [mcp, connectors, oauth, api-keys, saas, multi-tenancy, agent-ready]
related: [saas-strategy, architecture-overview, data-privacy, taiwan-compliance]
---

## The question

niko: make the platform agent-ready by exposing connectors to Claude, the way Apollo.io
and Buffer do. How far are we from a full SaaS, and what does connector-readiness take?

This page is the audit that answers it. Nothing here is decided yet — it is a survey of
what exists, what is missing, and the order the missing pieces have to arrive in.

## What already exists (the expensive half)

The hard prerequisites for a connector are the ones most products lack, and this codebase
has them:

- **Real multi-tenancy.** `orgs` + `memberships` (unique on `org_id, user_id`); every
  agency route filters by `orgId`. Tenant isolation is enforced, not aspirational.
- **Capability-based RBAC.** `src/lib/permissions.ts` — 7 roles × 15 capabilities
  (`client:read`, `candidate:read`, `stage:move`, `offer:approve`, `invoice:write`, …).
  These strings are usable as OAuth scopes verbatim.
- **One authorization gate.** `requireAgency(capability)` in `src/lib/agency-auth.ts` is
  the single choke point for agency requests, with `getAgencyActor()` as its server-component
  twin. Adding a second *transport* (bearer token) is a change to one function, not to 84 routes.
- **Append-only audit log.** `audit_log.actor_type` is already `user | system | job` — the
  column that attributes an action to a non-human actor exists and is unused.
- **Per-operation Zod schemas.** `src/lib/validation-agency.ts` holds a validated input
  schema for each mutation. Under Zod 4 these convert to JSON Schema, which is what an MCP
  tool definition needs.
- **PII discipline.** Erasure (`anonymizedAt`) is respected in `searchCandidates`; documents
  are never served directly; the audit log deliberately stores field *names*, not values.

## What is missing

### 1. Machine authentication — the hard blocker
Every authenticated route resolves identity from the `vgen_session` cookie (JWT + revocable
`sessions` row). There are **no API keys, no OAuth, no bearer auth** anywhere except
`CRON_SECRET` on the two cron routes. A connector cannot hold a browser cookie, so today
there is no way for any external agent to authenticate at all.

### 2. Session-coupled service layer
`getAgencyCrm()` and `getPipelineBoard()` take no arguments — they read the cookie
internally. They cannot be called on behalf of a token-authenticated actor without a
refactor. (`searchCandidates(filters)` and the `billing.ts` helpers are already pure and
are the model to follow.)

### 3. Not self-serve
`insert(orgs)` appears **only in tests**. Orgs are provisioned by hand. Recruiter signup
(`/api/recruiters/signup`) creates a recruiter row gated by an `allowed_domains` allowlist,
never an org. The platform is multi-tenant in architecture and single-customer in practice.

### 4. No subscription layer
`src/lib/billing.ts` is *placement-fee* invoicing — the customer billing **its** clients.
That is product, not monetization. There are no plans, entitlements, metering, or payment
processor. Nothing charges anyone for using tecxwork.

### 5. Rate limiting is the wrong shape for agents
`rateLimit()` buckets per-IP on Vercel Runtime Cache and documents its own non-atomicity.
Agents burst from shared egress IPs; the limiter needs a per-key/per-tenant bucket on an
atomic store before it faces machine traffic.

### 6. Single-org-per-user
`getMember()` takes `limit(1)` and the schema comments call multi-org "a later extension".
Fine for one client; a constraint for any consultant or multi-agency user.

### 7. No public API surface
The 84 routes under `/api` are internal browser endpoints — unversioned, undocumented, and
free to change. No OpenAPI, no outbound webhooks (`ERROR_WEBHOOK_URL` is error alerting).

## What Apollo and Buffer actually shipped

Both expose a **remote MCP server over HTTP with OAuth 2.1**, not a local stdio server:
Apollo publishes authorization-server metadata at `mcp.apollo.io/.well-known/oauth-authorization-server`;
Buffer authorizes through the client's connector UI with an API key as fallback. In both
cases the tools mirror an API surface that already existed, and the scopes mirror
permissions that already existed. The MCP layer is the thin part — the auth and scope model
underneath it is the product work. That is the same order this codebase has to follow.

## The path, in dependency order

**Phase 0 — actor decoupling (prerequisite, small).** Introduce an `Actor` type
(`orgId`, `userId | null`, `recruiterId`, `role`, granted capabilities, `source`). Split
`resolveAgencyActor` into session and token resolvers that both return it. Thread the actor
into `getAgencyCrm` / `getPipelineBoard` as an explicit argument.

**Phase 1 — API keys.** An `api_keys` table (org-scoped, hashed, prefixed, scoped to a
subset of `Capability`, expiring, revocable), a bearer branch in the gate, effective
permission = key scopes ∩ role capabilities, audit rows written with a non-`user`
`actor_type`, per-key atomic rate limiting, and admin UI to mint and revoke. After this the
platform is machine-accessible.

**Phase 2 — MCP server.** One `/api/mcp` Streamable-HTTP route, tools generated from the
existing Zod schemas. Two rules that decide whether it is safe: **no tool ever accepts
`orgId` as a parameter** (tenancy comes from the token, always), and destructive or
financial operations (`offer:approve`, invoice issue/void, candidate erasure) stay out of v1.
The natural first tool set is read-heavy and centred on the moat: candidate search, pipeline
board and stage moves, clients and job orders, placements, and the expiring-compliance clock.

**Phase 3 — OAuth.** This is the step that turns "paste a key into a config file" into a
"Connect" button, and it is what Apollo and Buffer have. Needs authorization-server metadata,
dynamic client registration (RFC 7591), auth code + PKCE, a consent screen that names the
scopes, refresh tokens, and per-grant revocation. Scopes are the existing capability strings.

**Phase 4 — SaaS completion (orthogonal).** Self-serve org provisioning and invites,
multi-org membership, plans/entitlements/metering, versioned public API + docs, webhooks.

## Status update — 2026-08-12

niko chose to do **Phase 4 first**. Gaps 3 (not self-serve) and 4 (no subscription layer)
above are now closed, and gap 6 (single-org-per-user) is still open. See
`decisions/2026-08-12-saas-tenancy-and-commercial-model.md`.

What that changes for connectors: `orgs` now carries commercial state, the gate already
refuses suspended tenants and off-plan features, and `api_access` exists as a plan feature
on `scale` — so when machine auth arrives it has a tenant to belong to and a flag to gate
on. Phase 0 (actor decoupling) is still the next step and is still the prerequisite; the
provisioning module was written actor-free from the start as a down payment on it.

## Status — 2026-08-16: the connector ships

Phases 0–2 of the recorded path are done. `/api/mcp` is live behind bearer auth.

| Phase | State |
|---|---|
| 0 — actor decoupling | done |
| 1 — API keys + bearer in the gate | done, with a minting UI and an atomic per-key limiter |
| 2 — `/api/mcp` Streamable HTTP | done, 5 read-only tools |
| 3 — OAuth 2.1 + dynamic client registration | open |

**The two rules recorded in 2026-08 held, and a third was forced by building it.** No tool
accepts `orgId`; nothing destructive or financial ships in v1; and **no tool returns
candidate PII**, because the lawful basis for streaming candidate data to a model provider
is still unanswered and is not this codebase's decision to make.

Two things that rule turned up, both worth acting on independently of connectors:

- **`searchCandidates()` has no org filter at all.** Access rests entirely on the
  `candidate:read` capability, so the pool it searches is platform-wide rather than
  per-tenant. That may be intended — students register once on a marketplace — but it is
  not currently *stated* anywhere, and the screen above it calls the pool "the agency's own
  asset", which reads the other way. Worth settling regardless of the connector.
- **`AgencyCrm.compliance.attention` carries candidate names**, so `get_compliance_summary`
  deliberately reads past it to the totals. The compliance clock keeps its value as counts.

## Open questions

- **PIPA basis for agent access.** A connector streams candidate names, schools, ARC and
  work-permit data to a third-party model provider. The erasure and audit design is strong,
  but the lawful basis, the data-processing agreement, and whether PII-bearing tools ship at
  all in v1 are unresolved and are niko's call, not an engineering default.
- **API keys before OAuth, or wait for OAuth?** Keys unblock internal agents in weeks;
  OAuth is what an outside customer expects. Sequencing is a commercial question.
- **Is self-serve actually wanted?** Yang Luck is a named, hand-provisioned client. "Full
  SaaS" may be a positioning decision more than a backlog.

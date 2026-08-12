---
title: "SaaS tenancy and the commercial model: subdomain tenants, per-seat plans, no processor"
type: decision
slug: saas-tenancy-and-commercial-model
date: 2026-08-12
updated: 2026-08-12
attributed_to: [niko]
belongs_to: [tecxwork, saas-strategy, agent-connectors]
source: chat
status: accepted
tags: [multi-tenancy, saas, billing, provisioning, subdomain, entitlements, seats]
related: [agent-connectors, saas-strategy, architecture-overview, taiwan-compliance]
---

## Context

The agent-connector audit (`topics/agent-connectors.md`) found the platform multi-tenant in
architecture and single-customer in practice. niko's call: **do the commercial and
multi-tenant work before connectors** — exposing MCP tools on a hand-provisioned deployment
that nobody can buy monetises nothing.

Three findings framed the work:

- `insert(orgs)` and `insert(memberships)` appeared **nowhere in `src/` outside tests**. The
  entire agency/ATS product was reachable only via hand-written database rows.
- `event_config` was a **global singleton** read with `.limit(1)` — branding, event timing,
  moderation policy and imagery were platform-wide.
- Tenancy was done **by deployment**: Yang Luck ran on its own domain against an isolated
  Neon database.

## Decision

Four choices, each taken deliberately over a named alternative.

**Per-seat tiers** (over per-placement, flat, or hybrid usage). The ATS industry standard,
and it enforces against `memberships`, which already exist. A plan supplies a *default*
seat count; `orgs.seat_limit` carries the *contracted* number, because sales-led deals
negotiate away from list price.

**No payment processor** (over Stripe, ECPay/NewebPay, or both). Taiwan-domestic B2B needs
統一發票, which Stripe cannot issue — so "just add Stripe" was never the cheap option it
looks like. With a handful of named customers, entitlement columns plus offline invoicing is
the honest build. `orgs.status` / `plan` / `seat_limit` **are** the subscription; a gateway
later writes the same columns on webhook receipt and every enforcement point keeps working.

**Sales-led provisioning** (over self-serve, or self-serve behind approval). Fits ESA
licensing, PIPA duties and employer vetting, and matches how the product is actually sold.
An unapproved self-serve tenant is still a row holding candidate PII.

**Subdomain per tenant** (over single-domain switcher or path prefix). Already how the demo
runs, gives each customer a branded public careers site, and makes `event_config`
resolution unambiguous.

## What shipped

- **`lib/plans.ts`** — plan catalog and entitlements. The key move is `CAPABILITY_FEATURE`:
  every agency route already declares the capability it needs, so the gate derives the
  feature from the capability. **All 84 routes gained plan enforcement without being
  edited.**
- **`orgs` commercial columns** (`status`, `plan`, `seat_limit`, `trial_ends_at`,
  `billing_email`) and **`org_invites`**, the table that finally gives `insert(memberships)`
  a caller.
- **`proxy.ts`** — Next 16 renamed Middleware to Proxy. Parses the Host header into
  `x-tenant-slug` and **always overwrites it**, so a client cannot address another tenant by
  sending the header itself. No database access: the docs are explicit that Proxy is not for
  data fetching. The file already held the app's role-based route guards; tenant resolution
  needs a broad matcher and the guards a narrow one, so the matcher is broad and the guards
  are prefix-checked inside — the JWT is only read on paths that need it.
- **`lib/tenant.ts` / `lib/tenant-host.ts`** — host→slug parsing kept pure and
  framework-free, then org lookup with commercial-state checks.
- **`lib/provisioning.ts`** — `createOrg` (seeds a default pipeline so the board is never
  empty), invites with SHA-256-only token storage, `acceptInvite`, seat accounting.
- **`agency-auth.ts`** — the single gate now checks tenant match, then commercial state,
  then plan, then role. Ordering is deliberate: "suspended", "not on your plan" and "not
  your job" are different problems that send people to different people.
- **`event_config.org_id`** with a `coalesce(org_id, 0)` unique index, and a reader that
  resolves tenant row → platform default.

## Consequences and things deliberately accepted

- **Backward compatible by design.** When the host names no tenant (apex domain, localhost,
  the test suite), the caller's own membership stands. All 201 pre-existing tests passed
  unchanged; the suite is now 246.
- **Seat checks are not atomic.** Two simultaneous invitations can overshoot by one. Left as
  a check rather than a lock: a seat is a commercial limit, not a security boundary, and the
  worst case is one extra line on an invoice. The tenant boundary — which *is* a security
  boundary — is enforced separately.
- **Existing tenants were backfilled to `growth`/20 seats, not to a trial.** A live customer
  waking up on a 3-seat trial would have locked their team out on deploy.
- **`member:invite` is admin-only**, deliberately narrower than the commercial capabilities:
  a seat is a line on the customer's bill, so the people who negotiate the contract should
  not also be able to inflate it.
- **A `.js`-suffixed path bypasses the proxy matcher.** Safe today because no route resolves
  there, but it is the kind of assumption worth re-checking if the matcher is ever loosened.

## Follow-up shipped the same day — the onboarding loop closes

Provisioning existed but a customer could only be onboarded with `curl`. Now:

- **`sendOrgInviteEmail` + `buildInviteUrl`** — the link points at the tenant's own
  subdomain so the invitee lands on the workspace they are joining, already branded. The
  raw token is returned in the API response **only when the send failed**, so a mail outage
  does not force a revoke-and-re-invite round trip.
- **`/invite`** — the landing page. It deliberately reveals nothing about the invitation
  before acceptance (not the invited address, not the role, not whether the token is real):
  the token travels in a URL, which reaches browser history and referrer headers, so
  confirming "yes, this is valid for finance@client.com" would leak workspace membership to
  anyone holding a stale link.
- **`/admin/workspaces`** — the platform console: provision, change plan, adjust contracted
  seats, suspend and reactivate. Standalone rather than a section of the 4,000-line admin
  dashboard, because running an event and deciding which customers exist are different axes.
- **`?next=` support on login**, guarded by a new `lib/safe-redirect.ts`. An invitation has
  to survive the sign-in round trip, and a post-login redirect taken from the query string
  is an open redirect. Rejects other origins, `//evil.example` (which a naive
  `startsWith("/")` would allow), the `/\` variant, and control characters.

## Still open

- Wildcard DNS and per-tenant custom domains are unconfigured; `PLATFORM_ROOT_DOMAIN` must
  be set or every host resolves to the apex site (deliberate — a missing variable must not
  let a Host header pick a tenant).
- No **members** screen inside a workspace yet — invitations are sent via `/api/org/invites`
  and there is no UI listing current members or their roles.
- Multi-org-per-user still unresolved: `getMember()` takes `limit(1)`.
- The PIPA question from the connector audit is untouched and still niko's call.

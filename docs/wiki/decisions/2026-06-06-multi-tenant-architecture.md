---
title: Multi-tenant architecture — plan & migration runbook
type: decision
slug: 2026-06-06-multi-tenant-architecture
date: 2026-06-06
updated: 2026-06-06
attributed_to: [niko]
belongs_to: [saas-strategy, architecture-overview, tecxwork]
source: chat
status: proposed
tags: [multi-tenant, saas, architecture, migration, drizzle, plan]
related: [saas-strategy, architecture-overview, booking-engine]
---

# Multi-tenant architecture — plan & migration runbook

**Status: in progress.** Recon + plan produced on 2026-06-06 (branch `multi-tenant-exploration`).
**Phase 0 implemented** (post-event) — additive schema only, typechecks, not yet applied to
prod. Remaining phases pending. See "Implementation status" below.

## Implementation status

- **Phase 0 — DONE (code):** `src/lib/db/schema.ts` gains tables `organizations`, `events`,
  `memberships`, `event_participants` (+ enums `event_status`, `membership_role`) and a nullable
  `event_id` FK on `event_config`, `recruiters`, `job_openings`, `slots`, `applicant_slots`,
  `bookings`, `allowed_domains`, `recruiter_email_approvals`. Applied via idempotent raw-SQL
  scripts, **not** `drizzle-kit generate` — the `drizzle/` snapshots have drifted from 18 raw
  `add-*` scripts, so the generator demands interactive rename resolution. New npm scripts:
  `db:update:multi-tenant` (DDL) and `db:backfill:multi-tenant` (default org/event + stamp
  `event_id` + seed memberships/participants). **Applied + verified in prod 2026-06-06**: all 8
  event-scoped tables have 0 NULL `event_id` (recruiters 38, job_openings 142, slots 477,
  applicant_slots 252, bookings 314, allowed_domains 4, approvals 5, event_config 1); org `vsatw`,
  event `v-gen-trident` (active), 39 memberships (1 org_admin + 38 recruiter), 170 participants.
- **NOT NULL enforcement deferred to end of Phase 2** (was "after backfill"). Correction: the live
  app doesn't write `event_id` on inserts yet, so enforcing NOT NULL now would break new
  signups/bookings. Enforce only once every insert path sets `event_id`.
- **Phase 1 — DONE (code):** `src/lib/tenant.ts` (new, server-only): `getTenantContext()` resolves
  the active event from the `x-event-slug` header (injected by `proxy.ts` for `/e/[slug]`), falling
  back to the single active event on flat routes — so behavior is unchanged until Phase 3 routing.
  Helpers: `getActiveEventBySlug`, `getDefaultEvent`, `resolveEventSlug`, and membership-based
  authz (`requireMembership`, `requireOrgAdmin`, `getSessionMembership`, `getUserMemberships`).
  `proxy.ts` extracts the `/e/[slug]` slug into the `x-event-slug` request header (DB lookup stays
  server-side — middleware has none) and adds `/e/:path*` to its matcher. JWT shape is unchanged
  (existing sessions stay valid); membership is resolved from the DB per request. Typechecks + lints;
  not yet imported by any route (that wiring is Phase 2).
- **Phase 2a — DONE (code):** `event_config` singleton reads/writes are now event-scoped. Every
  `.from(eventConfig).limit(1)` gained `.where(eq(eventConfig.eventId, <ctx>))` across 16 files
  (central `event-branding.ts` cached reader, `page-images.ts`, `admin-data.ts`, `recruiter-data.ts`,
  `page.tsx`, and the bookings/applicants/me-jobs/admin-mode/branding/timeframe/page-images/homepage-images
  routes). `getTenantContext()` is now React-`cache()`-memoized; added `currentEventId()`. The
  runtime cache key/tag for the config row is per-event (`event-config:row:v2:{eventId}` /
  `event-config:{eventId}`); `invalidateEventConfigCache(eventId)` takes an arg. Added a cross-request
  runtime cache for event *resolution* itself (`getDefaultEvent`/`getActiveEventBySlug`, tag `events`,
  300s) so the hot path doesn't add a per-request DB hit — preserving the free-tier connection-storm
  protection. Behavior identical (all resolves to the single event). Typechecks, lints, `next build` OK.
  Not yet deployed.
- **Phase 2b (reads), 2c (inserts + NOT NULL), Phases 3–5 — pending.**

## Decisions (niko, 2026-06-06)

1. **Tenant model: Organization → Events.** An `organization` owns many `events`.
   Event-scoped data: recruiters, slots, applicant_slots, bookings, job_openings,
   event_config, allow-lists. **Applicants stay global** (the "Talent Passport") and join
   each event via a participation table.
2. **Routing: path-based `/e/[slug]`** (e.g. `work.tecxmate.com/e/v-gen-trident`). No
   wildcard DNS/cert work. Root `/` 301-redirects to the active event during the transition.
3. **Isolation: shared schema, discriminator column** (`event_id` / `org_id`) on a single
   Neon DB. No schema-per-tenant or db-per-tenant — overkill for free-tier Neon and this scale.

## Current single-tenant assumptions (baseline)

- `event_config` is a **singleton**, read via `.limit(1)` in ≥6 places: `app/admin/admin-data.ts`,
  `app/dashboard/recruiter-data.ts`, `api/admin/{mode,branding,timeframe}/route.ts`,
  `api/applicants/route.ts`.
- JWT payload is `{userId, email, role}` — **no tenant**. `src/lib/auth.ts`.
- Roles: `admin | recruiter | applicant` (`user_role` enum). Single hardcoded admin
  (`admin@vgen.tw`, `src/lib/db/seed.ts`).
- No `org_id`/`event_id` on any of the 21 tables. Queries scope by `recruiterId`/`userId` only.
- Flat routing (`/admin`, `/dashboard`, `/browse`); `src/proxy.ts` does role redirects only,
  no host/slug logic.
- Scale to retrofit: **55 API routes, 30 pages, 21 tables.**

## Target data model

New tables:
- `organizations` — `id, slug (unique), name, branding…, created_at`.
- `events` — `id, org_id FK, slug (globally unique for /e/[slug]), name, status, created_at`.
  Event-level config columns currently in `event_config` move here (or `event_config` gains
  `event_id` FK and becomes one-row-per-event).
- `memberships` — `id, user_id FK, org_id FK, role (org_admin|recruiter), created_at`.
  Replaces the single global admin; a user can belong to multiple orgs.
- `event_participants` — `id, applicant_id FK (global), event_id FK, status, created_at`.
  How global applicants opt into a specific event (Talent Passport join).

Add `event_id` FK (nullable → backfill → NOT NULL) to: `recruiters`, `job_openings`, `slots`,
`applicant_slots`, `bookings`, `allowed_domains`, `recruiter_email_approvals`.

Stay **global** (no `event_id`): `applicant_profiles` (Talent Passport), `users`, `schools`,
`external_jobs`/`crawl_logs` (crawled, not event-specific), `email_logs`, `push_subscriptions`,
`feedback_reports`. (`notifications` optionally gains `event_id` for filtering.)

Roles enum expands: `platform_owner | org_admin | recruiter | applicant`.

## Phased plan

**Phase 0 — Schema foundation (2–3 d, low risk, additive).**
Create org/event/memberships/event_participants tables. Insert default org (VSATW) + default
event from the existing `event_config` row (slug `v-gen-trident`). Add nullable `event_id` FKs,
backfill all event-scoped rows to the default event, backfill memberships (admin→org_admin,
each recruiter→recruiter), then set FKs NOT NULL. **No behavior change yet.**

**Phase 1 — Auth & tenant context (2–3 d).**
`getTenantContext()` helper resolves the active event from the `/e/[slug]` route param (via
`proxy.ts` → header injection), not from the JWT. Add membership checks. Expand roles.

**Phase 2 — Query retrofit (~1 wk, HIGH risk, the bulk).**
Thread `ctx.eventId` through all ~55 routes + data loaders: add `.where(eq(t.eventId, ctx.eventId))`
to every event-scoped query; replace each `event_config` `.limit(1)` with a per-event lookup.
Namespace cache keys in `lib/cache.ts` by eventId (`recruiters:{eventId}`, `event_config:{eventId}`).
Do this *behind the default event* so the live event's behavior is byte-identical.

**Phase 3 — Routing (3–4 d).**
Move public/admin pages under `/e/[slug]/…`. Root `/` → 301 to active event. `proxy.ts` parses
the slug, looks up `eventId` (cached), 404s unknown slugs, enforces membership.

**Phase 4 — Org-admin UX (1–2 wk).**
Platform-owner org list; org_admin create-event flow, recruiter invites, per-event branding,
onboarding checklist.

**Phase 5 — Talent Passport (3–5 d).**
Applicant participation per event via `event_participants`; profile persists across events.

## Migration runbook (Phase 0, additive-first)

1. Create `organizations`, `events`, `memberships`, `event_participants`.
2. Insert default org `VSATW`; insert default event from current `event_config` row, slug `v-gen-trident`.
3. Add **nullable** `event_id` to event-scoped tables.
4. `UPDATE … SET event_id = <default>` on every event-scoped table.
5. Backfill `memberships`: admin user → `org_admin`; every recruiter's user → `recruiter`.
6. `ALTER … SET NOT NULL` on the `event_id` columns once backfill verified.
7. Deploy tenant-aware code (Phases 1–3) with root→`/e/v-gen-trident` redirect for continuity.

## Risks & notes

- **Concurrency:** booking atomicity uses Postgres advisory locks. Verify the lock key is
  per-slot (slotId is a globally-unique serial → already safe) so one event's 9am booking storm
  can't block another event's. If any lock keys on a shared/global constant, namespace by eventId.
- **Free-tier Neon:** more tenants = more connections on a 0.25 CU instance. Upgrade off free-tier
  before onboarding a second live event. See [[architecture-overview]] DB-resilience notes.
- **Cross-tenant leak test:** seed a second org/event and assert no query returns the other
  event's recruiters/slots/bookings. This is the acceptance gate for Phase 2.
- **Sequencing rule:** additive (nullable FK + backfill) before enforcing (NOT NULL); query
  retrofit before routing; never deploy during a live event.

## Effort summary

- **~2 weeks** for a working structural MVP (multi-tenant under the hood, existing event = first tenant).
- **~4–6 weeks** for production-grade with org self-service + branding + (later) billing.

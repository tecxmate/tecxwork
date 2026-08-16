---
title: Production carried an abandoned branch's schema — park it, don't drop it
type: decision
slug: 2026-08-11-prod-schema-drift-legacy-parking
date: 2026-08-11
updated: 2026-08-11
attributed_to: [niko, claude-code]
belongs_to: [tecxwork, neon-account-topology, backup-dr]
source: observation
status: active
tags: [database, migration, schema-drift, incident, drizzle, production]
related: [neon-account-topology, drizzle-sql-gotchas, demo-db-manual-capture, 2026-06-01-neon-pool-crash-hardening]
---

## What happened

Bringing `main` up to the ATS codebase needed the production database migrated to the current
schema. `drizzle-kit push` against prod immediately began asking **create-vs-rename questions**
— roughly thirty of them, covering enums, tables and columns.

Those questions were the finding. Drizzle asks "is this new, or renamed from X?" only when the
database holds an object the schema does not. Thirty prompts meant thirty unexplained objects.

The cause: commit **`41183dd`** ("Multi-tenant Phase 0: schema foundation") on
`multi-tenant-exploration`, 2026-06-06. Its own message reads *"Applied + verified in prod:
all 8 event-scoped tables have 0 NULL event_id; default org `vsatw` + event `v-gen-trident`,
39 memberships, 170 participants."* **The branch was never merged to `main` or
`demo/yang-luck`** — but its migration was applied to the live database and left there for two
months. No merged code has ever declared those objects.

Prod was carrying:

| Object | Rows | |
|---|---|---|
| `organizations` | 1 | table |
| `events` | 1 | table |
| `event_participants` | 170 | table |
| `memberships` | 39 | table — **name collision, see below** |
| `event_id` | — | column on 9 tables |
| `membership_role`, `event_status` | — | enums |

Plus `external_jobs` (503) and `crawl_logs` (24), left behind when the crawler subsystem was
deleted in #17 — expected, and recorded at the time.

## The dangerous part: a silent ALTER, not a prompt

`memberships` exists in **both** the old exploration schema and the new ATS schema, with the
same name and different meaning:

| | Prod (exploration) | New (ATS) |
|---|---|---|
| `org_id` FK | → `organizations.id` | → `orgs.id` |
| `role` enum | `membership_role` | `member_role` |
| unique index | `(user_id, org_id)` | `(org_id, user_id)` |

Because the table already existed, drizzle would **not** have prompted about it. It would have
emitted an `ALTER` to reshape it in place: repointing a foreign key at a table those 39 rows
have no matching keys in, and recasting the enum column. Best case the apply errors partway.
Worst case the ATS's **access-control table** — the one `getAgencyActor()` reads to decide who
may see candidate PII — ends up holding 39 rows of unrelated event-era data.

Every visible prompt was answerable correctly. The one real hazard was the one that produced
no prompt at all.

## Decision

**Park the orphans in a `legacy` schema rather than letting `push` drop them.**

`drizzle-kit`'s `schemaFilter` defaults to `["public"]`, so moving an object to another schema
removes it from drizzle's view entirely — no drop proposed, no rename offered, and the rows
stay queryable and recoverable. A drop is a decision that cannot be revisited at 2am; a move is
one that can.

Applied 2026-08-11 as a single transaction:

- `memberships`, `event_participants`, `events`, `organizations` → `legacy`
- `external_jobs`, `crawl_logs` → `legacy`
- enums `membership_role`, `event_status`, `job_source`, `job_type` → `legacy`
  (an enum still referenced by a parked table cannot be dropped, so it has to travel with it)
- `event_id` **dropped** from the 8 remaining public tables — exactly one event existed, so
  every value was identical and the column carried no information

After that the push was **purely additive: 22 tables created, zero prompts, zero drops.**

## Consequences

- **That is now the acceptance test for a prod migration.** A clean `drizzle-kit push` against
  production should ask *nothing*. Any rename prompt or proposed `DROP` means the database holds
  something the schema does not, and the run should stop until it is explained.
- `legacy` retains ~737 rows. Nothing reads them. `DROP SCHEMA legacy CASCADE` whenever the
  backup and the running system have both been confirmed good.
- The eight `event_id` columns are gone; recoverable only from a dump if ever wanted.

## The rule this establishes

**Never apply a migration to production from an unmerged branch.** An exploration branch's
schema outlived the exploration by two months and was rediscovered only because a later
migration tripped over it. If a schema change is real enough to run against prod, it is real
enough to merge first — otherwise the database becomes the only record of a decision nobody
can find in the code.

Corollary, learned the same day: **the repository is not a description of production.** Both
agents working this problem reasoned from `schema.ts` and were wrong about what the database
contained. The database is the authority; check it before planning against it.

## Provenance

- Discovered 2026-08-11 while migrating prod ahead of fast-forwarding `main` to the ATS
  codebase ([2026-07-27 positioning](2026-07-27-yang-luck-licensee-positioning.md) line of work).
- The interactive `push` was being driven by a second agent (Codex) on [niko]'s machine; its
  create-vs-rename answers were all correct. The collision it could not have seen was found by
  reading `41183dd` out of the repo's history.
- Prod state confirmed by direct inspection (`information_schema`, `\d memberships`) before any
  change was applied.

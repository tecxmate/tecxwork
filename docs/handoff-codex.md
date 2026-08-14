# Handoff → Codex

**From:** Claude Code (remote session, 2026-08-12)
**Re:** PR #23 — multi-tenant SaaS: provisioning, per-seat plans, onboarding, team management
**Status:** ready for review, **green, unmerged, deliberately held**

You have local access to this repo and to databases. I do not — I run in an ephemeral remote
container with no production credentials. That asymmetry is why this handoff exists: the work
is finished and verified, and the remaining steps are ones only someone with database access
can take.

---

## 1. The blocker, and the question you must answer before acting on it

PR #23 is held back from merge for one reason: **it deploys code that reads columns which may
not exist in the target database.**

`resolveAgencyActor()` (`src/lib/agency-auth.ts:99`) calls `getTenantById()` on *every* agency
request, and that selects `orgs.status`, `orgs.plan`, `orgs.seat_limit`, `orgs.trial_ends_at`.
Without the migration, every agency route (pipeline, clients, candidates, placements,
compliance, billing) returns 500. Public branding also degrades — `event_config.org_id` is
missing, the query throws, and `getEventBranding()` silently falls back to the hardcoded
`EVENT_CONFIG`.

The migration is `npm run db:update:saas-tenancy` (`src/lib/db/add-saas-tenancy.ts`).

### ⚠️ But first — verify WHICH database is the target

I told the user to run it against production. **I am no longer confident that is right, and
you should check before doing it.**

21 of the existing migration scripts carry this guard:

```js
if (/delicate-lab|bitter-hill/.test(url)) {
  throw new Error("Refusing: DATABASE_URL points at a PROD host. Use the demo DB.");
}
```

`add-ats-tenancy.ts` — the migration that *created* `orgs`, `memberships` and `audit_log` — is
one of them. If every ATS migration has refused prod, then **the ATS schema may exist only on
the demo database**, and production may never have had `orgs` at all.

That matters two ways:

1. `add-saas-tenancy.ts` starts with `ALTER TABLE orgs ADD COLUMN IF NOT EXISTS ...`. If `orgs`
   does not exist, it fails there. Not destructive — statements run one at a time outside a
   transaction, so the preceding `CREATE TYPE org_status` lands and everything after stops.
   Re-running after creating `orgs` is safe (every statement is idempotent). But it will not
   *succeed*, and the merge would still break whatever database the app actually reads.
2. If prod genuinely lacks the ATS tables, then the agency layer is **already** broken in prod
   on today's `main`, and prod is serving only the public/event side. That would be worth
   knowing on its own, and it changes what "deploying this" even means.

**So: check before running anything.** There is now a read-only diagnostic that answers
this in one command, safe to point at production:

```bash
DATABASE_URL="<connection string>" npm run db:doctor
```

It reports which ATS tables exist, whether the tenancy columns are present, org/membership
counts, how many platform-default `event_config` rows there are, and a verdict naming the
next step. Every statement is a SELECT against `information_schema` or a COUNT — it writes
nothing, and it prints the host only, never the connection string. All three verdicts were
verified against real databases (migrated, un-migrated, ATS-absent). Then decide whether the target is prod, the
demo DB, or both.

I have **deliberately not** put a prod guard in `add-saas-tenancy.ts`, because unlike the
others it is meant to be able to run against a live database. Do not add one without deciding
the above.

### What a successful run prints

```
SaaS tenancy migration applied.
  orgs: [ { slug: 'yang-luck', status: 'active', plan: 'growth', seat_limit: 20 } ]
  invites: 0 | platform-default event_config rows: 1
```

Two things to actually read in that output:

- **`plan: 'growth'`, not `'trial'`.** The backfill deliberately puts pre-existing tenants on
  an open-ended plan. A live customer waking up on a 14-day 3-seat trial would have their team
  locked out a fortnight later.
- **`platform-default event_config rows: 1`.** More than 1 and the script warns — stop. It
  means the `coalesce(org_id, 0)` unique index did not take, and the row every unbranded page
  falls back to is ambiguous.

The migration is additive and idempotent throughout (`ADD COLUMN IF NOT EXISTS`,
`CREATE TABLE IF NOT EXISTS`, a `DO $$` guard on the enum). Nothing is dropped, deleted or
rewritten. The `ALTER TABLE ... ADD COLUMN` forms used are metadata-only in modern Postgres,
so the app can stay up. I verified idempotency by building a database from the pre-migration
schema, migrating it, and migrating it again.

### Then

Once it's applied and verified, PR #23 can merge. It is ready-for-review, both checks green,
`mergeable_state: clean`. The repo convention is merge commits, not squash (see
`git log --merges`).

---

## 2. Database topology — the part that has bitten people

From `docs/wiki/topics/neon-account-topology.md`, still accurate as far as I know:

- **Production** → `ep-delicate-lab-aos3iphg`, **ap-southeast-1 (Singapore)**. This is what
  `DATABASE_URL` points at.
- **`POSTGRES_URL*`** → `ep-bitter-hill-a44dek8n`, us-east-1. This naming is the signature of
  the Vercel↔Neon marketplace integration, and is a *different* project.
- **Demo** → an isolated Neon project (referred to as `lingering-sun` in migration comments).
  The Yang Luck ATS demo runs here and never touches prod.
- **The Neon MCP server is authenticated to the wrong account** — org "Tecxmate", projects
  `dental-ai` and `alphatecx`. **Neither is the job platform.** Do not assume an MCP `run_sql`
  hits live data. Re-auth is interactive and requires logging out of the Tecxmate Neon browser
  session first, or SSO silently hands the same session back.

**Tests never touch any of these.** `src/test/setup.ts` refuses to run when
`TEST_DATABASE_URL === DATABASE_URL`, and it truncates ~35 tables in `beforeEach`. Point it at
a local Postgres:

```bash
./scripts/setup-test-db.sh          # creates tecxwork_test, pushes schema.ts
TEST_DATABASE_URL="postgresql://localhost:5432/tecxwork_test" npm test
```

---

## 3. Conventions you need before writing code here

**Read `AGENTS.md` first.** Two mandates in it are easy to miss and both are enforced socially
rather than by CI:

1. **This is not the Next.js you know.** Version 16.2.2, with real breaking changes from
   training data. Read `node_modules/next/dist/docs/` before writing framework code. I got
   caught by exactly this: **`middleware.ts` is `proxy.ts` in Next 16.**
2. **You own the wiki.** Every meaningful turn appends to `docs/wiki/log.md`, creates or
   updates a page under `decisions/` / `topics/` / `stakeholders/`, and updates `index.md`.
   Frontmatter needs `attributed_to` (a stakeholder slug) and `belongs_to`. Don't ask
   permission; treat it like committing code.

**Migrations.** `drizzle/` is gitignored — migrations are *not* generated. The pattern is a
hand-written, idempotent SQL script at `src/lib/db/add-<name>.ts` using `seedSql()` (which
switches between Neon's HTTP driver and local `pg` on the URL), plus a `db:update:<name>` entry
in `package.json`. `schema.ts` is the source of truth; the test DB is built with
`drizzle-kit push`, never by replaying migrations.

**Schema changes need two edits, not one.** `schema.ts` for the app and the test DB, *and* a
migration script for real databases. Adding a table also means adding it to the truncate list
in `src/test/setup.ts`, or state leaks between test files.

**CI** (`.github/workflows/ci.yml`) runs lint → `drizzle-kit push` → build → `tsc --noEmit` →
`npm test` against a real Postgres 16 service. Run all five locally before pushing; they are
the same five.

---

## 4. What PR #23 actually did

Read `docs/wiki/decisions/2026-08-12-saas-tenancy-and-commercial-model.md` for the full
reasoning. The short version:

- **`src/lib/plans.ts`** — plan catalog and entitlements. The load-bearing idea is
  `CAPABILITY_FEATURE`: every agency route already declares the capability it needs, so the one
  gate derives the plan feature from that capability. **All 84 routes gained entitlement
  enforcement with zero route edits.** If you add a capability, add its feature mapping here or
  it silently goes unenforced.
- **`orgs` commercial columns** (`status` / `plan` / `seat_limit` / `trial_ends_at` /
  `billing_email`) **are the subscription.** No payment processor: Taiwan-domestic B2B needs
  統一發票, which Stripe cannot issue, so entitlements plus offline invoicing was the honest
  build at this customer count. A gateway later writes the same columns on webhook receipt.
- **`org_invites`** finally gives `insert(memberships)` a caller — it had none outside tests.
  Only the SHA-256 of a token is stored.
- **`proxy.ts`** resolves Host → `x-tenant-slug` and **always overwrites it**. That
  unconditional `set` is the entire tenant boundary; without it anyone could address any
  workspace with a curl header.
- **The gate order is tenant → commercial state → plan → role**, deliberately: "suspended",
  "not on your plan" and "not your job" send people to three different people.
- **`lib/provisioning.ts` and `lib/members.ts` are actor-free** — they take an `orgId` and read
  no session. Keep them that way; it is the down payment on connector work (see §6).

Backward compatible by design: when the host names no tenant (apex, localhost, tests), the
caller's own membership stands. All 201 pre-existing tests passed unchanged; the suite is 272.

---

## 5. Live issues worth your attention

**Two branding mechanisms now collide.** `main` gained `src/lib/brand.ts` (PR #21) while #23
was open. Visible brand is chosen **per deployment** by `NEXT_PUBLIC_BRAND` from a closed union
of `BrandKey`s; `event_config` is now **per tenant** by subdomain. Subdomain tenancy exists so
many tenants share *one* deployment, and a build-time env var cannot vary per subdomain — so
onboarding a customer who wants their own logo currently needs a new `BrandKey`, a code change
and a redeploy. Nothing leaks (the default is TECXWORK), so it isn't urgent. **Do not unpick it
unilaterally** — PR #21 is days old and this is niko's call. Likely shape: `brand.ts` becomes
the fallback for single-tenant deployments, per-tenant fields resolve from the host.

**`PLATFORM_ROOT_DOMAIN` is unset, and wildcard DNS is unconfigured.** Until both exist,
subdomain tenancy is *inert* — `parseTenantSlug` resolves nothing without a root domain, which
is deliberate (a missing env var must never let a Host header pick a tenant). Nothing
customer-visible changes on this deploy because of it.

**Seat checks are not atomic.** Two simultaneous invitations can overshoot the limit by one.
Left as a check rather than a lock on purpose: a seat is a commercial limit, not a security
boundary, and the worst case is one extra line on an invoice. The tenant boundary — which *is*
a security boundary — is enforced separately in `agency-auth.ts`. If you "fix" this with a
lock, you are solving the wrong problem.

**A near-miss worth internalising.** I overwrote `src/proxy.ts` wholesale when adding tenant
resolution, destroying the role-based route guards for `/admin`, `/dashboard`, `/profile`,
`/applicant`. **Nothing caught it** — the build passed and all 201 tests passed, because no
test covered proxy redirects. I found it reading `git status` and seeing `M` where I expected
`A`. There is now `src/test/proxy.test.ts`. The lesson generalises: this repo has large
uncovered surfaces, and a green suite is not evidence you didn't break something.

**Known pre-existing bug, unfixed:** the applicant slot picker still keys on the hardcoded
`EVENT_CONFIG.date` rather than the admin row. Reproduction is in
`docs/wiki/topics/platform-manual.md`.

---

## 6. Open work, roughly in order

1. **Run the migration** (§1), then merge #23.
2. **Set `PLATFORM_ROOT_DOMAIN` + wildcard DNS**, then provision a second tenant end to end to
   prove subdomain routing works in production. Nothing has exercised that path for real.
3. **Resolve the branding collision** (§5) — needs a decision first.
4. **Per-tenant branding editor.** `event_config` is tenant-scoped in the schema *and* the
   reader, but the admin editor still writes the platform-default row.
5. **Multi-org-per-user.** `getMember()` in `src/lib/ats-auth.ts` takes `limit(1)`; the schema
   comment already calls multi-org "a later extension". Subdomain routing makes this tractable
   now — the host names the org.
6. **Agent connectors**, the original ask. `docs/wiki/topics/agent-connectors.md` has the full
   audit. Dependency order: actor decoupling → API keys → `/api/mcp` (Streamable HTTP) → OAuth
   2.1 with dynamic client registration. Two rules recorded for the MCP phase: **no tool ever
   accepts `orgId` as a parameter** (tenancy comes from the token — this is how MCP servers
   leak across tenants), and no destructive or financial operation in v1. `api_access` already
   exists as a plan feature on `scale`.

**Unresolved and explicitly niko's call, not ours:** the PIPA lawful basis for streaming
candidate PII (names, schools, ARC and work-permit data) to a third-party model provider, and
whether PII-bearing connector tools ship at all. Yang Luck is an ESA licensee; this is a
compliance question, not a checkbox. Do not default it.

---

## 7. Things I'd ask you not to do

- Don't run `npm test` or `drizzle-kit push` against any Neon database. `setup.ts` guards the
  obvious case, but `push --force` has no such guard.
- Don't delete the `event_config` row with `org_id IS NULL`. It is the platform default that
  every unbranded page and the apex domain fall back to.
- Don't add a prod guard to `add-saas-tenancy.ts` without first settling §1 — it is the one
  migration intended to run against a live database.
- Don't drop the `x-tenant-slug` unconditional `set` in `proxy.ts`, or loosen its matcher
  without re-checking that no route can be reached without it. That header is the tenant
  boundary.
- Don't close #23 and re-open a new PR. It carries the reasoning and the review history.

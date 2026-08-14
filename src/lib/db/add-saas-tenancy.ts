/**
 * SaaS tenancy migration — commercial state on orgs, invitations, per-tenant event config.
 *
 * Additive + IDEMPOTENT (IF NOT EXISTS / DO $$ guards), safe to re-run.
 *
 * Three things arrive here:
 *   1. `orgs` gains the columns that ARE the subscription (status / plan / seat_limit /
 *      trial_ends_at / billing_email). No payment processor is involved — these columns
 *      are read by lib/agency-auth.ts on every request.
 *   2. `org_invites`, the table that finally gives `insert(memberships)` a caller. Before
 *      it, memberships could only be created by hand.
 *   3. `event_config.org_id`, which turns a platform-wide singleton into per-tenant
 *      branding. The existing row is left with org_id NULL on purpose: that is now the
 *      PLATFORM DEFAULT serving the apex domain, and every tenant falls back to it until
 *      it customises its own.
 *
 * Run with DATABASE_URL pointing at the target:
 *   DATABASE_URL="<target>" npm run db:update:saas-tenancy
 */
import { seedSql } from "./seed-sql";

const DDL: string[] = [
  // org_status enum (CREATE TYPE has no IF NOT EXISTS)
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_status') THEN
       CREATE TYPE org_status AS ENUM ('active','suspended','cancelled');
     END IF;
   END $$`,

  // ---- 1. commercial state on orgs ----
  `ALTER TABLE orgs ADD COLUMN IF NOT EXISTS status org_status NOT NULL DEFAULT 'active'`,
  `ALTER TABLE orgs ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'trial'`,
  `ALTER TABLE orgs ADD COLUMN IF NOT EXISTS seat_limit integer NOT NULL DEFAULT 3`,
  `ALTER TABLE orgs ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz`,
  `ALTER TABLE orgs ADD COLUMN IF NOT EXISTS billing_email text`,

  // ---- 2. invitations ----
  `CREATE TABLE IF NOT EXISTS org_invites (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     email text NOT NULL,
     role member_role NOT NULL DEFAULT 'recruiter',
     token_hash text NOT NULL,
     invited_by_user_id integer REFERENCES users(id),
     expires_at timestamptz NOT NULL,
     accepted_at timestamptz,
     revoked_at timestamptz,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS org_invites_token_hash_idx ON org_invites (token_hash)`,
  `CREATE INDEX IF NOT EXISTS org_invites_org_email_idx ON org_invites (org_id, email)`,

  // ---- 3. per-tenant event config ----
  `ALTER TABLE event_config ADD COLUMN IF NOT EXISTS org_id integer REFERENCES orgs(id)`,
  // Indexed on coalesce(org_id, 0), not org_id: NULL is not equal to itself in a UNIQUE
  // index, so the natural spelling would police tenant rows and let the platform-default
  // row silently duplicate. No org has id 0, so the two cases cannot collide.
  `CREATE UNIQUE INDEX IF NOT EXISTS event_config_org_idx ON event_config (coalesce(org_id, 0))`,
];

const BACKFILL: string[] = [
  // Existing tenants predate the commercial columns and are live customers, not trials.
  // Give them an open-ended plan with room to work rather than a 3-seat trial that would
  // lock their team out on the next deploy.
  `UPDATE orgs
      SET plan = 'growth', seat_limit = GREATEST(seat_limit, 20), trial_ends_at = NULL
    WHERE plan = 'trial' AND trial_ends_at IS NULL`,

  // Seats are contracted, so an org that already has more members than its limit gets the
  // limit raised to match reality. Enforcing downward here would evict people.
  `UPDATE orgs o
      SET seat_limit = m.n
     FROM (SELECT org_id, count(*)::int AS n FROM memberships GROUP BY org_id) m
    WHERE m.org_id = o.id AND m.n > o.seat_limit`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = seedSql(url);

  for (const stmt of [...DDL, ...BACKFILL]) {
    await sql.query(stmt);
  }

  const orgRows = await sql`SELECT slug, status, plan, seat_limit FROM orgs ORDER BY id`;
  const [invites] = await sql`SELECT count(*)::int AS n FROM org_invites`;
  const [defaults] =
    await sql`SELECT count(*)::int AS n FROM event_config WHERE org_id IS NULL`;

  console.log("SaaS tenancy migration applied.");
  console.log("  orgs:", orgRows);
  console.log("  invites:", invites.n, "| platform-default event_config rows:", defaults.n);
  if (Number(defaults.n) > 1) {
    console.warn(
      "  WARNING: more than one platform-default event_config row. The unique index " +
        "should have prevented this — investigate before serving the apex domain."
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

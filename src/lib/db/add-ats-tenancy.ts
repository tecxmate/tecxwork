/**
 * ATS Phase 1 migration — multi-tenancy + RBAC + audit foundation.
 *
 * Additive + IDEMPOTENT (IF NOT EXISTS / ON CONFLICT / WHERE ... IS NULL), safe
 * to re-run. Creates orgs / memberships / audit_log, adds org_id to the ATS
 * tables, then backfills a single "Yang Luck" org, memberships for existing
 * recruiter/admin users, and org_id on existing rows.
 *
 * Run with DATABASE_URL pointing at the target (demo = lingering-sun):
 *   DATABASE_URL="<target>" npm run db:update:ats-tenancy
 */
import { seedSql } from "./seed-sql";

const DDL: string[] = [
  // member_role enum (CREATE TYPE has no IF NOT EXISTS)
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
       CREATE TYPE member_role AS ENUM
         ('admin','account_manager','recruiter','hiring_manager','interviewer','coordinator','viewer');
     END IF;
   END $$`,

  `CREATE TABLE IF NOT EXISTS orgs (
     id serial PRIMARY KEY,
     name text NOT NULL,
     slug text NOT NULL UNIQUE,
     kind text NOT NULL DEFAULT 'agency',
     created_at timestamptz NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS memberships (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     user_id integer NOT NULL REFERENCES users(id),
     role member_role NOT NULL DEFAULT 'recruiter',
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_org_member ON memberships (org_id, user_id)`,

  `CREATE TABLE IF NOT EXISTS audit_log (
     id serial PRIMARY KEY,
     org_id integer REFERENCES orgs(id),
     actor_user_id integer REFERENCES users(id),
     actor_type text NOT NULL DEFAULT 'user',
     action text NOT NULL,
     entity_type text NOT NULL,
     entity_id integer,
     field_names text[],
     metadata jsonb,
     ip text,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS audit_log_org_entity_idx ON audit_log (org_id, entity_type, entity_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS audit_log_org_actor_idx ON audit_log (org_id, actor_user_id, created_at)`,

  // org_id on the ATS tables (nullable for now; enforced NOT NULL in a later phase
  // once all write paths set it)
  `ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS org_id integer REFERENCES orgs(id)`,
  `ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS org_id integer REFERENCES orgs(id)`,
  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS org_id integer REFERENCES orgs(id)`,
];

const BACKFILL: string[] = [
  // Single tenant for the demo: Yang Luck (agency). The 25 client companies are
  // data WITHIN this org (recruiters today; clients in Phase 2).
  `INSERT INTO orgs (name, slug, kind)
     VALUES ('揚運國際集團 Yang Luck', 'yang-luck', 'agency')
     ON CONFLICT (slug) DO NOTHING`,

  `UPDATE recruiters  SET org_id = (SELECT id FROM orgs WHERE slug='yang-luck') WHERE org_id IS NULL`,
  `UPDATE job_openings SET org_id = (SELECT id FROM orgs WHERE slug='yang-luck') WHERE org_id IS NULL`,
  `UPDATE applications SET org_id = (SELECT id FROM orgs WHERE slug='yang-luck') WHERE org_id IS NULL`,

  // Memberships from existing recruiter users; agency HR → admin, else recruiter.
  `INSERT INTO memberships (org_id, user_id, role)
     SELECT (SELECT id FROM orgs WHERE slug='yang-luck'), r.user_id,
            (CASE WHEN r.client_kind = 'agency' THEN 'admin' ELSE 'recruiter' END)::member_role
     FROM recruiters r
     WHERE r.user_id IS NOT NULL
     ON CONFLICT (org_id, user_id) DO NOTHING`,

  // Platform admins are org admins too.
  `INSERT INTO memberships (org_id, user_id, role)
     SELECT (SELECT id FROM orgs WHERE slug='yang-luck'), u.id, 'admin'::member_role
     FROM users u WHERE u.role = 'admin'
     ON CONFLICT (org_id, user_id) DO NOTHING`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: DATABASE_URL points at a PROD host. Use the demo DB.");
  }
  const sql = seedSql(url);

  for (const stmt of [...DDL, ...BACKFILL]) {
    await sql.query(stmt);
  }

  const [org] = await sql`SELECT id, name FROM orgs WHERE slug='yang-luck'`;
  const [m] = await sql`SELECT count(*)::int AS n FROM memberships`;
  const [r] = await sql`SELECT count(*)::int AS n FROM recruiters WHERE org_id IS NOT NULL`;
  const [a] = await sql`SELECT count(*)::int AS n FROM applications WHERE org_id IS NOT NULL`;
  console.log("ATS tenancy migration applied.");
  console.log("  org:", org, "| memberships:", m.n, "| recruiters scoped:", r.n, "| applications scoped:", a.n);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

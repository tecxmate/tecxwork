/**
 * ATS Phase 1b migration — configurable pipeline + stage-transition log.
 *
 * Additive + IDEMPOTENT. Creates pipeline_templates / pipeline_stages (stage_kind)
 * / application_stage_transitions and applications.stage_id, then seeds a default
 * "Standard placement" template for the Yang Luck org (5 stages mirroring the
 * legacy enum), backfills stage_id, and seeds an initial transition per
 * application. The legacy applications.stage enum is kept as a fallback.
 *
 *   DATABASE_URL="<demo>" npm run db:update:ats-pipeline
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stage_kind') THEN
       CREATE TYPE stage_kind AS ENUM
         ('sourced','screened','internal_submit','client_submit','interview','offer','placed','onboarding','started','rejected');
     END IF;
   END $$`,

  `CREATE TABLE IF NOT EXISTS pipeline_templates (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     name text NOT NULL,
     is_default boolean NOT NULL DEFAULT false,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS pipeline_stages (
     id serial PRIMARY KEY,
     template_id integer NOT NULL REFERENCES pipeline_templates(id),
     name text NOT NULL,
     stage_kind stage_kind NOT NULL,
     sort_order integer NOT NULL DEFAULT 0,
     is_terminal boolean NOT NULL DEFAULT false,
     sla_days integer
   )`,
  `CREATE INDEX IF NOT EXISTS pipeline_stages_template_idx ON pipeline_stages (template_id, sort_order)`,

  `CREATE TABLE IF NOT EXISTS application_stage_transitions (
     id serial PRIMARY KEY,
     org_id integer REFERENCES orgs(id),
     application_id integer NOT NULL REFERENCES applications(id),
     from_stage_id integer REFERENCES pipeline_stages(id),
     to_stage_id integer NOT NULL REFERENCES pipeline_stages(id),
     moved_by_user_id integer REFERENCES users(id),
     moved_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS app_stage_transitions_app_idx ON application_stage_transitions (application_id, moved_at)`,

  `ALTER TABLE applications ADD COLUMN IF NOT EXISTS stage_id integer REFERENCES pipeline_stages(id)`,
];

const SEED: string[] = [
  // Default template for the Yang Luck org.
  `INSERT INTO pipeline_templates (org_id, name, is_default)
     SELECT o.id, 'Standard placement', true FROM orgs o
     WHERE o.slug = 'yang-luck'
       AND NOT EXISTS (SELECT 1 FROM pipeline_templates t WHERE t.org_id = o.id AND t.is_default)`,

  // 5 stages mirroring the legacy enum (applied/screening/interview/offer/hired).
  `INSERT INTO pipeline_stages (template_id, name, stage_kind, sort_order, is_terminal)
     SELECT t.id, v.name, v.kind::stage_kind, v.ord, v.terminal
     FROM pipeline_templates t
     CROSS JOIN (VALUES
       ('Applied','sourced',0,false),
       ('Screening','screened',1,false),
       ('Interview','interview',2,false),
       ('Offer','offer',3,false),
       ('Hired','placed',4,true)
     ) AS v(name, kind, ord, terminal)
     WHERE t.org_id = (SELECT id FROM orgs WHERE slug='yang-luck') AND t.is_default
       AND NOT EXISTS (SELECT 1 FROM pipeline_stages s WHERE s.template_id = t.id)`,

  // Backfill applications.stage_id from the legacy enum, matched by stage_kind.
  `UPDATE applications a SET stage_id = s.id
     FROM pipeline_stages s
     JOIN pipeline_templates t ON t.id = s.template_id AND t.is_default
     JOIN orgs o ON o.id = t.org_id AND o.slug = 'yang-luck'
     WHERE a.stage_id IS NULL
       AND a.org_id = o.id
       AND s.stage_kind = (CASE a.stage
         WHEN 'applied' THEN 'sourced'
         WHEN 'screening' THEN 'screened'
         WHEN 'interview' THEN 'interview'
         WHEN 'offer' THEN 'offer'
         WHEN 'hired' THEN 'placed'
       END)::stage_kind`,

  // Seed one initial transition per application (null -> current), from created_at.
  `INSERT INTO application_stage_transitions (org_id, application_id, from_stage_id, to_stage_id, moved_by_user_id, moved_at)
     SELECT a.org_id, a.id, NULL, a.stage_id, NULL, a.created_at
     FROM applications a
     WHERE a.stage_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM application_stage_transitions x WHERE x.application_id = a.id)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: DATABASE_URL points at a PROD host. Use the demo DB.");
  }
  const sql = neon(url);

  for (const stmt of [...DDL, ...SEED]) {
    await sql.query(stmt);
  }

  const stages = await sql`
    SELECT s.name, s.stage_kind, s.sort_order
    FROM pipeline_stages s
    JOIN pipeline_templates t ON t.id = s.template_id AND t.is_default
    JOIN orgs o ON o.id = t.org_id AND o.slug = 'yang-luck'
    ORDER BY s.sort_order`;
  const [scoped] = await sql`SELECT count(*)::int AS n FROM applications WHERE stage_id IS NOT NULL`;
  const [trans] = await sql`SELECT count(*)::int AS n FROM application_stage_transitions`;
  console.log("ATS pipeline migration applied.");
  console.log("  default stages:", stages.map((s) => `${s.sort_order}:${s.name}(${s.stage_kind})`).join(", "));
  console.log("  applications with stage_id:", scoped.n, "| transitions:", trans.n);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

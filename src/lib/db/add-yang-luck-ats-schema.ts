/**
 * Merge migration for the Yang Luck ATS branch (demo/yang-luck → main).
 *
 * Brings a database up to the branch schema. Fully IDEMPOTENT and ADDITIVE —
 * every statement is IF NOT EXISTS, so it is safe to run repeatedly and on a DB
 * that already has some of these (e.g. prod already has recruiters.verified).
 * No data is modified; new columns default to empty/false, so existing rows are
 * unaffected and existing app behaviour is unchanged until the branch code ships.
 *
 * Run against the target with DATABASE_URL set (prod = delicate-lab):
 *   DATABASE_URL="<target>" npm run db:update:yang-luck-ats
 *
 * Delta covered (main → branch):
 *   - recruiters.client_kind (text, default 'client')
 *   - recruiters.verified    (boolean, default false)
 *   - job_openings.client_company / client_industry / client_kind (text, default '')
 *   - enum pipeline_stage (applied|screening|interview|offer|hired)
 *   - table applications (+ unique + lookup index)
 */
import { neon } from "@neondatabase/serverless";

const STATEMENTS: string[] = [
  // 1) recruiters columns
  `ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS client_kind text NOT NULL DEFAULT 'client'`,
  `ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false`,

  // 2) job_openings columns
  `ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS client_company text NOT NULL DEFAULT ''`,
  `ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS client_industry text NOT NULL DEFAULT ''`,
  `ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS client_kind text NOT NULL DEFAULT ''`,

  // 3) pipeline_stage enum (guarded — CREATE TYPE has no IF NOT EXISTS)
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_stage') THEN
       CREATE TYPE pipeline_stage AS ENUM ('applied','screening','interview','offer','hired');
     END IF;
   END $$`,

  // 4) applications table (references must pre-exist: recruiters, job_openings, applicant_profiles)
  `CREATE TABLE IF NOT EXISTS applications (
     id serial PRIMARY KEY,
     job_opening_id integer NOT NULL REFERENCES job_openings(id),
     applicant_id integer NOT NULL REFERENCES applicant_profiles(id),
     recruiter_id integer NOT NULL REFERENCES recruiters(id),
     stage pipeline_stage NOT NULL DEFAULT 'applied',
     stage_updated_at timestamptz NOT NULL DEFAULT now(),
     notes text NOT NULL DEFAULT '',
     ai_score integer,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,

  // 5) indexes
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_application_job_applicant ON applications (job_opening_id, applicant_id)`,
  `CREATE INDEX IF NOT EXISTS applications_recruiter_stage_idx ON applications (recruiter_id, stage)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  const sql = neon(url);

  for (const stmt of STATEMENTS) {
    await sql.query(stmt);
  }

  // Verify the end state.
  const cols = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE (table_name = 'recruiters' AND column_name IN ('client_kind','verified'))
       OR (table_name = 'job_openings' AND column_name IN ('client_company','client_industry','client_kind'))
    ORDER BY table_name, column_name`;
  const [appTable] = await sql`
    SELECT to_regclass('public.applications') IS NOT NULL AS exists`;
  const [enumType] = await sql`
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_stage') AS exists`;

  console.log("Yang Luck ATS migration applied.");
  console.log("  new columns present:", cols);
  console.log("  applications table:", appTable.exists, "| pipeline_stage enum:", enumType.exists);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

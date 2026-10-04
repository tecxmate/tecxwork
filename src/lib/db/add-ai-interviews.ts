/**
 * AI screening interview tables. Idempotent.
 *
 *   DATABASE_URL="<demo>" npm run db:update:ai-interviews
 */
import { seedSql } from "./seed-sql";

const DDL: string[] = [
  `DO $$ BEGIN
     CREATE TYPE ai_interview_status AS ENUM ('invited','in_progress','completed','abandoned','expired');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS ai_interviews (
     id serial PRIMARY KEY,
     org_id integer REFERENCES orgs(id),
     application_id integer NOT NULL REFERENCES applications(id),
     job_opening_id integer NOT NULL REFERENCES job_openings(id),
     applicant_id integer NOT NULL REFERENCES applicant_profiles(id),
     token text NOT NULL UNIQUE,
     status ai_interview_status NOT NULL DEFAULT 'invited',
     locale text NOT NULL DEFAULT 'en',
     competencies jsonb NOT NULL DEFAULT '[]'::jsonb,
     claims jsonb NOT NULL DEFAULT '[]'::jsonb,
     notes jsonb NOT NULL DEFAULT '[]'::jsonb,
     report jsonb,
     integrity jsonb,
     fit_score integer,
     recommendation text,
     integrity_score integer,
     consent_at timestamptz,
     consent_disclosures jsonb NOT NULL DEFAULT '[]'::jsonb,
     created_by_user_id integer REFERENCES users(id),
     created_at timestamptz NOT NULL DEFAULT now(),
     started_at timestamptz,
     completed_at timestamptz,
     expires_at timestamptz NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS ai_interviews_application_idx ON ai_interviews (application_id)`,
  `CREATE INDEX IF NOT EXISTS ai_interviews_org_status_idx ON ai_interviews (org_id, status)`,
  `CREATE TABLE IF NOT EXISTS ai_interview_turns (
     id serial PRIMARY KEY,
     interview_id integer NOT NULL REFERENCES ai_interviews(id),
     idx integer NOT NULL,
     kind text NOT NULL,
     question text NOT NULL,
     looking_for text NOT NULL DEFAULT '',
     planted_error jsonb,
     targets jsonb NOT NULL DEFAULT '[]'::jsonb,
     time_limit_sec integer NOT NULL DEFAULT 90,
     word_cap integer NOT NULL DEFAULT 50,
     answer text,
     telemetry jsonb,
     signals jsonb NOT NULL DEFAULT '[]'::jsonb,
     assessment jsonb,
     asked_at timestamptz NOT NULL DEFAULT now(),
     answered_at timestamptz
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_ai_interview_turn ON ai_interview_turns (interview_id, idx)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) throw new Error("Refusing: PROD host.");
  const sql = seedSql(url);
  for (const stmt of DDL) await sql.query(stmt);

  const [n] = (await sql`SELECT count(*)::int AS n FROM ai_interviews`) as { n: number }[];
  console.log("AI interview migration applied.");
  console.log(`  ai_interviews:${n.n}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

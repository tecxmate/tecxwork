/**
 * ATS Phase 2a migration — agency CRM layer (clients → contacts → job_orders →
 * submissions → placements), backfilled from the existing recruiter / job /
 * application data. Additive + IDEMPOTENT (NOT EXISTS guards). The student-facing
 * recruiter/job/application model is left untouched.
 *
 *   DATABASE_URL="<demo>" npm run db:update:ats-agency
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_order_type') THEN
       CREATE TYPE job_order_type AS ENUM ('client_order','internal_req');
     END IF;
   END $$`,

  `CREATE TABLE IF NOT EXISTS clients (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     recruiter_id integer REFERENCES recruiters(id),
     name text NOT NULL,
     name_zh text,
     industry text NOT NULL DEFAULT '',
     city text,
     unified_business_no text,
     owner_user_id integer REFERENCES users(id),
     default_fee_pct integer,
     status text NOT NULL DEFAULT 'active',
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_client_recruiter ON clients (recruiter_id)`,

  `CREATE TABLE IF NOT EXISTS contacts (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     client_id integer NOT NULL REFERENCES clients(id),
     name text NOT NULL,
     title text,
     email text,
     phone text,
     is_primary boolean NOT NULL DEFAULT false,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,

  `CREATE TABLE IF NOT EXISTS job_orders (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     client_id integer REFERENCES clients(id),
     recruiter_id integer REFERENCES recruiters(id),
     job_opening_id integer REFERENCES job_openings(id),
     type job_order_type NOT NULL DEFAULT 'client_order',
     title text NOT NULL,
     headcount integer NOT NULL DEFAULT 1,
     fee_pct integer,
     status text NOT NULL DEFAULT 'open',
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_joborder_jobopening ON job_orders (job_opening_id)`,

  `CREATE TABLE IF NOT EXISTS submissions (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     candidate_id integer NOT NULL REFERENCES applicant_profiles(id),
     job_order_id integer NOT NULL REFERENCES job_orders(id),
     application_id integer REFERENCES applications(id),
     stage_id integer REFERENCES pipeline_stages(id),
     submitted_by_user_id integer REFERENCES users(id),
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_submission_application ON submissions (application_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_submission_candidate_joborder ON submissions (candidate_id, job_order_id)`,

  `CREATE TABLE IF NOT EXISTS placements (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     submission_id integer REFERENCES submissions(id),
     candidate_id integer NOT NULL REFERENCES applicant_profiles(id),
     job_order_id integer NOT NULL REFERENCES job_orders(id),
     client_id integer REFERENCES clients(id),
     status text NOT NULL DEFAULT 'placed',
     start_date text,
     salary integer,
     fee_amount integer,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_placement_submission ON placements (submission_id)`,
];

const BACKFILL: string[] = [
  // clients ← non-agency recruiters
  `INSERT INTO clients (org_id, recruiter_id, name, name_zh, industry, city, status)
     SELECT r.org_id, r.id, r.company, split_part(r.company, ' ', 1), r.industry, '台中 Taichung', 'active'
     FROM recruiters r
     WHERE r.client_kind <> 'agency' AND r.org_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.recruiter_id = r.id)`,

  // one generic primary contact per client
  `INSERT INTO contacts (org_id, client_id, name, title, is_primary)
     SELECT c.org_id, c.id, c.name || ' — HR', 'HR Contact', true
     FROM clients c
     WHERE NOT EXISTS (SELECT 1 FROM contacts x WHERE x.client_id = c.id)`,

  // job_orders ← job_openings whose recruiter is a client
  `INSERT INTO job_orders (org_id, client_id, recruiter_id, job_opening_id, type, title, headcount, status)
     SELECT j.org_id, c.id, j.recruiter_id, j.id, 'client_order', j.title, 1, 'open'
     FROM job_openings j
     JOIN clients c ON c.recruiter_id = j.recruiter_id
     WHERE j.org_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM job_orders jo WHERE jo.job_opening_id = j.id)`,

  // submissions ← applications
  `INSERT INTO submissions (org_id, candidate_id, job_order_id, application_id, stage_id)
     SELECT a.org_id, a.applicant_id, jo.id, a.id, a.stage_id
     FROM applications a
     JOIN job_orders jo ON jo.job_opening_id = a.job_opening_id
     WHERE NOT EXISTS (SELECT 1 FROM submissions s WHERE s.application_id = a.id)`,

  // placements ← submissions whose stage is terminal 'placed'
  `INSERT INTO placements (org_id, submission_id, candidate_id, job_order_id, client_id, status)
     SELECT s.org_id, s.id, s.candidate_id, s.job_order_id, jo.client_id, 'placed'
     FROM submissions s
     JOIN job_orders jo ON jo.id = s.job_order_id
     JOIN pipeline_stages ps ON ps.id = s.stage_id AND ps.stage_kind = 'placed'
     WHERE NOT EXISTS (SELECT 1 FROM placements p WHERE p.submission_id = s.id)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo DB.");
  }
  const sql = neon(url);
  for (const stmt of [...DDL, ...BACKFILL]) await sql.query(stmt);

  const [c] = (await sql`SELECT count(*)::int AS n FROM clients`) as { n: number }[];
  const [ct] = (await sql`SELECT count(*)::int AS n FROM contacts`) as { n: number }[];
  const [j] = (await sql`SELECT count(*)::int AS n FROM job_orders`) as { n: number }[];
  const [s] = (await sql`SELECT count(*)::int AS n FROM submissions`) as { n: number }[];
  const [p] = (await sql`SELECT count(*)::int AS n FROM placements`) as { n: number }[];
  console.log("ATS agency layer applied.");
  console.log(`  clients:${c.n} contacts:${ct.n} job_orders:${j.n} submissions:${s.n} placements:${p.n}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * Offers.
 *
 * "Offer" was only ever a column on the pipeline board. A candidate sat in it and nothing
 * recorded the salary, the start date, who authorised those terms, or whether the person
 * said yes — and when a placement was created later, its salary was retyped from memory.
 *
 * Additive and idempotent:
 *   DATABASE_URL="<target>" npx tsx src/lib/db/add-offers.ts
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `DO $$ BEGIN
     CREATE TYPE offer_status AS ENUM
       ('draft','approved','sent','accepted','declined','withdrawn','expired');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS offers (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     application_id integer NOT NULL REFERENCES applications(id),
     candidate_id integer NOT NULL REFERENCES applicant_profiles(id),
     job_order_id integer REFERENCES job_orders(id),
     status offer_status NOT NULL DEFAULT 'draft',
     salary integer NOT NULL,
     currency text NOT NULL DEFAULT 'TWD',
     salary_period text NOT NULL DEFAULT 'month',
     start_date text,
     probation_months integer,
     notes text,
     expires_at text,
     created_by_user_id integer REFERENCES users(id),
     approved_by_user_id integer REFERENCES users(id),
     approved_at timestamptz,
     sent_at timestamptz,
     responded_at timestamptz,
     decline_reason text,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS offers_org_status_idx ON offers (org_id, status)`,
  // One live offer per application. Partial, so a declined offer can be followed by a new
  // one while the declined row stays for history.
  `CREATE UNIQUE INDEX IF NOT EXISTS offers_one_live_per_application
     ON offers (application_id)
     WHERE status IN ('draft','approved','sent')`,
  // A placement should inherit the terms that were actually agreed, not have them retyped.
  `ALTER TABLE placements ADD COLUMN IF NOT EXISTS offer_id integer REFERENCES offers(id)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo or a test branch.");
  }
  const sql = neon(url);

  for (const stmt of DDL) await sql.query(stmt);

  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM offers`) as { n: number }[];
  console.log(`  offers table ready | offers: ${n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

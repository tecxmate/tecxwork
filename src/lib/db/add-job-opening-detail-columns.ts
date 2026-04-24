import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS employment_type text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS workplace_type text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS salary_min integer
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS salary_max integer
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS salary_currency text NOT NULL DEFAULT 'TWD'
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS salary_period text NOT NULL DEFAULT 'month'
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS seniority text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS language_requirement text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS visa_support text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS application_deadline text
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS responsibilities text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS requirements text NOT NULL DEFAULT ''
  `;

  console.log("Ensured job_openings detail columns exist");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

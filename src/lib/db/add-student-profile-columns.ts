import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS nationality text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS school_code text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS school_name text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS school_name_en text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS study_level text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS study_year text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS expected_graduation text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS job_seeking_status text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS work_authorization text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS preferred_locations text[] NOT NULL DEFAULT ARRAY[]::text[]
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS preferred_industries text[] NOT NULL DEFAULT ARRAY[]::text[]
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS linkedin_url text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS portfolio_url text NOT NULL DEFAULT ''
  `;

  console.log("Ensured expanded applicant_profiles columns exist");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DB_URL || process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DB_URL or DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'professional'
  `;

  await sql`
    DO $$ BEGIN
      CREATE TYPE referral_status AS ENUM ('pending', 'accepted', 'rejected');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS professional_profiles (
      id serial PRIMARY KEY,
      user_id integer REFERENCES users(id) UNIQUE,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      company text NOT NULL,
      job_title text NOT NULL,
      industry text NOT NULL,
      linkedin_url text,
      bio text NOT NULL DEFAULT '',
      graduated_from text,
      graduation_year integer,
      is_verified boolean NOT NULL DEFAULT false,
      referral_count integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS referrals (
      id serial PRIMARY KEY,
      professional_id integer NOT NULL REFERENCES professional_profiles(id),
      applicant_id integer NOT NULL REFERENCES applicant_profiles(id),
      relationship text NOT NULL,
      endorsement text NOT NULL,
      is_public boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_referral
    ON referrals (professional_id, applicant_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS referral_requests (
      id serial PRIMARY KEY,
      applicant_id integer NOT NULL REFERENCES applicant_profiles(id),
      professional_id integer NOT NULL REFERENCES professional_profiles(id),
      message text NOT NULL,
      status referral_status NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      responded_at timestamptz
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS referral_requests_professional_status_idx
    ON referral_requests (professional_id, status, created_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS referral_requests_applicant_idx
    ON referral_requests (applicant_id, created_at DESC)
  `;

  console.log("Ensured referral system tables + enums exist");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

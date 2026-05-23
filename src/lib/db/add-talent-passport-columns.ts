import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS talent_passport_opt_in boolean NOT NULL DEFAULT false
  `;
  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS talent_passport_consented_at timestamptz
  `;

  console.log("Ensured applicant_profiles Talent Passport columns exist");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

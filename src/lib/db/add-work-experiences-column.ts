import { neon } from "@neondatabase/serverless";

async function addWorkExperiencesColumn() {
  const url = process.env.DB_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DB_URL or DATABASE_URL not set");

  const sql = neon(url);

  await sql`
    ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS work_experiences jsonb NOT NULL DEFAULT '[]'::jsonb
  `;

  console.log("Ensured applicant_profiles.work_experiences exists");
}

addWorkExperiencesColumn().catch((error) => {
  console.error(error);
  process.exit(1);
});

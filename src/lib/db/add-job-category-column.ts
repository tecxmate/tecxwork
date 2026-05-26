import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS job_category text NOT NULL DEFAULT ''
  `;

  console.log("Ensured job_openings.job_category exists");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

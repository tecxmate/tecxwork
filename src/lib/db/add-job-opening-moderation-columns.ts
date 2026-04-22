import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'draft'
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS moderation_notes text NOT NULL DEFAULT ''
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS submitted_at timestamptz
  `;
  await sql`
    ALTER TABLE job_openings
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz
  `;

  console.log("Ensured job_openings moderation columns exist");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

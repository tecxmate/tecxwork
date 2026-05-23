import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");

  const sql = neon(url);

  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS browse_page_images text[] NOT NULL DEFAULT ARRAY[]::text[]
  `;

  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS jobs_page_images text[] NOT NULL DEFAULT ARRAY[]::text[]
  `;

  console.log("Ensured event_config browse/jobs page image columns exist");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

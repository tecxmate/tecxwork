import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");

  const sql = neon(url);
  await sql`
    ALTER TABLE recruiters
    ADD COLUMN IF NOT EXISTS pinned_rank integer
  `;
  console.log("Ensured recruiters.pinned_rank exists");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS onboarding_mode text NOT NULL DEFAULT 'full'
  `;

  console.log("Ensured event_config.onboarding_mode exists");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

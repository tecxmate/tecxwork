import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");

  const sql = neon(url);

  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS salary_currency_options text[] NOT NULL DEFAULT ARRAY['TWD', 'VND', 'USD']::text[]
  `;

  await sql`
    UPDATE event_config
    SET salary_currency_options = ARRAY['TWD', 'VND', 'USD']::text[]
    WHERE salary_currency_options IS NULL OR cardinality(salary_currency_options) = 0
  `;

  console.log("Ensured event_config.salary_currency_options exists");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

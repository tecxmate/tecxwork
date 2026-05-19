import { neon } from "@neondatabase/serverless";

const HOSTED_AT = "MCUT (Ming Chi University of Technology)";
const HOSTED_AT_FULL = "Ming Chi University of Technology";
const LOCATION = "MCUT (Ming Chi University of Technology)";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TABLE event_config
    ALTER COLUMN hosted_at SET DEFAULT 'MCUT (Ming Chi University of Technology)'
  `;
  await sql`
    ALTER TABLE event_config
    ALTER COLUMN hosted_at_full SET DEFAULT 'Ming Chi University of Technology'
  `;
  await sql`
    ALTER TABLE event_config
    ALTER COLUMN location SET DEFAULT 'MCUT (Ming Chi University of Technology)'
  `;

  const updated = await sql`
    UPDATE event_config
    SET
      hosted_at = ${HOSTED_AT},
      hosted_at_full = ${HOSTED_AT_FULL},
      location = ${LOCATION}
    RETURNING id, hosted_at, hosted_at_full, location
  `;

  console.log(`Updated ${updated.length} event_config row(s) to MCUT`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

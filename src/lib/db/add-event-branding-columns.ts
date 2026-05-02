import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS email_event_name text NOT NULL DEFAULT 'VSATW JOB FAIR 2026: V-GEN TRIDENT'
  `;
  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT 'The Vietnamese Generation — Versatile in Talent, Value in Action'
  `;
  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS organizer text NOT NULL DEFAULT 'Vietnamese Student Association in Taiwan'
  `;
  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS organizer_short text NOT NULL DEFAULT 'VSATW'
  `;
  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS hosted_at text NOT NULL DEFAULT 'NTUT (Taipei Tech)'
  `;
  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS hosted_at_full text NOT NULL DEFAULT 'National Taipei University of Science and Technology'
  `;
  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS display_date text NOT NULL DEFAULT 'June 6, 2026'
  `;
  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS display_year text NOT NULL DEFAULT '2026'
  `;
  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS event_end_date timestamptz
  `;
  await sql`
    ALTER TABLE event_config
    ALTER COLUMN event_name SET DEFAULT 'VSATW JOB FAIR 2026: V-GEN TRIDENT'
  `;

  console.log("Ensured event_config branding columns exist");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

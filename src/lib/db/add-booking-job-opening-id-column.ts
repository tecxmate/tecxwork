import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    if (process.env[key]) continue;

    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function main() {
  loadLocalEnv();

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS job_opening_id integer REFERENCES job_openings(id)
  `;

  await sql`
    UPDATE bookings b
    SET job_opening_id = j.id
    FROM job_openings j
    WHERE b.job_opening_id IS NULL
      AND b.recruiter_id = j.recruiter_id
      AND b.position = j.title
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS bookings_job_opening_id_idx
    ON bookings (job_opening_id)
  `;

  console.log("Ensured bookings.job_opening_id exists and backfilled exact title matches");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

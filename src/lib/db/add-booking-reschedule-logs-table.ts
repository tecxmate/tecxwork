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
    CREATE TABLE IF NOT EXISTS booking_reschedule_logs (
      id serial PRIMARY KEY,
      booking_id integer NOT NULL REFERENCES bookings(id),
      recruiter_id integer REFERENCES recruiters(id),
      applicant_id integer REFERENCES applicant_profiles(id),
      actor_role user_role NOT NULL,
      actor_email text,
      action text NOT NULL,
      status_before booking_status,
      status_after booking_status,
      requested_time timestamptz,
      proposed_time timestamptz,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS booking_reschedule_logs_booking_created_idx
    ON booking_reschedule_logs (booking_id, created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS booking_reschedule_logs_created_idx
    ON booking_reschedule_logs (created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS booking_reschedule_logs_action_idx
    ON booking_reschedule_logs (action)
  `;

  console.log("Ensured booking_reschedule_logs table + indexes exist");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

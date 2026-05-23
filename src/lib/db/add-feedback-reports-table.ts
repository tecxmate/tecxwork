import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    DO $$ BEGIN
      CREATE TYPE feedback_kind AS ENUM ('bug', 'feedback', 'feature');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE feedback_severity AS ENUM ('low', 'med', 'high');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `;
  await sql`
    DO $$ BEGIN
      CREATE TYPE feedback_status AS ENUM ('open', 'triaged', 'resolved');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS feedback_reports (
      id serial PRIMARY KEY,
      user_id integer,
      user_role user_role,
      user_email text,
      kind feedback_kind NOT NULL DEFAULT 'bug',
      severity feedback_severity NOT NULL DEFAULT 'med',
      subject text NOT NULL,
      body text NOT NULL,
      pathname text,
      user_agent text,
      viewport text,
      app_version text,
      client_logs jsonb NOT NULL DEFAULT '[]'::jsonb,
      screenshot_url text,
      status feedback_status NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now(),
      resolved_at timestamptz
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS feedback_reports_status_idx ON feedback_reports (status)`;
  await sql`CREATE INDEX IF NOT EXISTS feedback_reports_created_idx ON feedback_reports (created_at DESC)`;

  console.log("Ensured feedback_reports table + enums exist");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

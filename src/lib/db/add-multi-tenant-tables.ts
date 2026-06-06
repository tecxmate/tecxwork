import { neon } from "@neondatabase/serverless";

/**
 * Phase 0 multi-tenant schema migration. Idempotent — safe to re-run.
 *
 * Creates the org/event/membership/participant tables and adds a nullable
 * `event_id` to every event-scoped table. Purely additive: no existing column
 * is altered and the app does not read these yet, so behavior is unchanged.
 *
 * Written as a raw-SQL script (not `drizzle-kit generate`) to match this repo's
 * convention — the `drizzle/` snapshots have drifted from the many `add-*`
 * scripts, so the generator can't diff cleanly. schema.ts remains the ORM
 * source of truth. After this, run `npm run db:backfill:multi-tenant`.
 *
 * Next step (after backfill is verified in prod): flip the `event_id` columns to
 * `.notNull()` in schema.ts and add an `ALTER ... SET NOT NULL` migration.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  const sql = neon(url);

  // --- Enums (idempotent) ---
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
        CREATE TYPE event_status AS ENUM ('draft', 'active', 'archived');
      END IF;
    END $$
  `;
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
        CREATE TYPE membership_role AS ENUM ('org_admin', 'recruiter');
      END IF;
    END $$
  `;

  // --- New tables (order matters for FK references) ---
  await sql`
    CREATE TABLE IF NOT EXISTS organizations (
      id serial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id serial PRIMARY KEY,
      org_id integer NOT NULL REFERENCES organizations(id),
      slug text NOT NULL UNIQUE,
      name text NOT NULL,
      status event_status NOT NULL DEFAULT 'draft',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS memberships (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id),
      org_id integer NOT NULL REFERENCES organizations(id),
      role membership_role NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_membership_user_org
      ON memberships (user_id, org_id)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS event_participants (
      id serial PRIMARY KEY,
      applicant_id integer NOT NULL REFERENCES applicant_profiles(id),
      event_id integer NOT NULL REFERENCES events(id),
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_event_participant
      ON event_participants (applicant_id, event_id)
  `;

  // --- Nullable event_id on event-scoped tables ---
  await sql`ALTER TABLE event_config ADD COLUMN IF NOT EXISTS event_id integer REFERENCES events(id)`;
  await sql`ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS event_id integer REFERENCES events(id)`;
  await sql`ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS event_id integer REFERENCES events(id)`;
  await sql`ALTER TABLE slots ADD COLUMN IF NOT EXISTS event_id integer REFERENCES events(id)`;
  await sql`ALTER TABLE applicant_slots ADD COLUMN IF NOT EXISTS event_id integer REFERENCES events(id)`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_id integer REFERENCES events(id)`;
  await sql`ALTER TABLE allowed_domains ADD COLUMN IF NOT EXISTS event_id integer REFERENCES events(id)`;
  await sql`ALTER TABLE recruiter_email_approvals ADD COLUMN IF NOT EXISTS event_id integer REFERENCES events(id)`;

  console.log("Multi-tenant tables and event_id columns ensured.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { neon } from "@neondatabase/serverless";

/**
 * Phase 0 multi-tenant backfill. Idempotent — safe to re-run.
 *
 * Creates the default organization (VSATW) and default event (V-GEN TRIDENT)
 * from the existing `event_config` singleton, then stamps every event-scoped
 * row with that event_id and seeds memberships + event participants.
 *
 * Run AFTER the schema migration that adds the new tables and nullable
 * `event_id` columns (`npm run db:generate && npm run db:migrate`).
 * Run BEFORE enforcing NOT NULL (`npm run db:enforce:multi-tenant-fks`).
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  const sql = neon(url);

  // 1. Default organization.
  await sql`
    INSERT INTO organizations (slug, name)
    VALUES ('vsatw', 'Vietnamese Student Association in Taiwan')
    ON CONFLICT (slug) DO NOTHING
  `;
  const [org] = await sql`SELECT id FROM organizations WHERE slug = 'vsatw'`;
  if (!org) throw new Error("Failed to create/find default organization");

  // 2. Default event, named from the existing event_config singleton.
  const [cfg] = await sql`
    SELECT id, event_name FROM event_config ORDER BY id LIMIT 1
  `;
  await sql`
    INSERT INTO events (org_id, slug, name, status)
    VALUES (${org.id}, 'v-gen-trident', ${cfg?.event_name ?? "V-GEN TRIDENT 2026"}, 'active')
    ON CONFLICT (slug) DO NOTHING
  `;
  const [evt] = await sql`SELECT id FROM events WHERE slug = 'v-gen-trident'`;
  if (!evt) throw new Error("Failed to create/find default event");

  // 3. Stamp event_id on the config singleton + all event-scoped tables.
  await sql`UPDATE event_config SET event_id = ${evt.id} WHERE event_id IS NULL`;
  await sql`UPDATE recruiters SET event_id = ${evt.id} WHERE event_id IS NULL`;
  await sql`UPDATE job_openings SET event_id = ${evt.id} WHERE event_id IS NULL`;
  await sql`UPDATE slots SET event_id = ${evt.id} WHERE event_id IS NULL`;
  await sql`UPDATE applicant_slots SET event_id = ${evt.id} WHERE event_id IS NULL`;
  await sql`UPDATE bookings SET event_id = ${evt.id} WHERE event_id IS NULL`;
  await sql`UPDATE allowed_domains SET event_id = ${evt.id} WHERE event_id IS NULL`;
  await sql`UPDATE recruiter_email_approvals SET event_id = ${evt.id} WHERE event_id IS NULL`;

  // 4. Memberships: existing admin → org_admin; each recruiter's user → recruiter.
  // Casts are required because in INSERT ... SELECT, Postgres infers the neon
  // parameter/literal types from the SELECT list (text) rather than the target
  // columns, so they must be coerced explicitly.
  await sql`
    INSERT INTO memberships (user_id, org_id, role)
    SELECT id, ${org.id}::int, 'org_admin'::membership_role
    FROM users WHERE role = 'admin'
    ON CONFLICT (user_id, org_id) DO NOTHING
  `;
  await sql`
    INSERT INTO memberships (user_id, org_id, role)
    SELECT DISTINCT r.user_id, ${org.id}::int, 'recruiter'::membership_role
    FROM recruiters r
    ON CONFLICT (user_id, org_id) DO NOTHING
  `;

  // 5. Event participants: every applicant profile joins the default event.
  await sql`
    INSERT INTO event_participants (applicant_id, event_id)
    SELECT id, ${evt.id}::int FROM applicant_profiles
    ON CONFLICT (applicant_id, event_id) DO NOTHING
  `;

  console.log(
    `Backfill complete. org=${org.id} event=${evt.id} (slug v-gen-trident).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

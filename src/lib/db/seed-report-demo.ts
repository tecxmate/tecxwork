/**
 * Backdate demo applications + their stage transitions so the reporting funnel /
 * aging show a realistic spread (everything was seeded "now"). Demo DB only,
 * idempotent-ish (safe to re-run — it just re-spreads the dates).
 *
 *   DATABASE_URL="<demo>" npm run db:seed:report-demo
 */
import { seedSql } from "./seed-sql";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) throw new Error("Refusing: PROD host.");
  const sql = seedSql(url);

  // Spread application created_at over the past ~8 weeks by id.
  await sql`
    UPDATE applications
    SET created_at = now() - ((id % 56) || ' days')::interval
    WHERE org_id = (SELECT id FROM orgs WHERE slug='yang-luck')`;

  // Entry into the current stage = the application's (backdated) created_at, so
  // "days in current stage" reflects the spread.
  await sql`
    UPDATE application_stage_transitions t
    SET moved_at = a.created_at
    FROM applications a
    WHERE t.application_id = a.id
      AND a.org_id = (SELECT id FROM orgs WHERE slug='yang-luck')`;

  const [oldest] = (await sql`
    SELECT max(now()::date - created_at::date)::int AS d FROM applications
    WHERE org_id = (SELECT id FROM orgs WHERE slug='yang-luck')`) as { d: number }[];
  console.log(`Backdated demo applications + transitions. Oldest is ~${oldest.d} days in stage.`);
}

main().catch((e) => { console.error(e); process.exit(1); });

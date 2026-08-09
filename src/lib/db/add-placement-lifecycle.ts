/**
 * Placement lifecycle columns.
 *
 * `placements` was effectively a terminal state: candidate, client, start date, fee. But in
 * Taiwan staffing the risk and the money sit AFTER the placement — a worker who leaves inside
 * the guarantee period triggers a clawback, and a permit that lapses while they are on a
 * client site is the agency's legal problem, not the client's. None of that was representable.
 *
 *   probation_until   試用期 end — typically 3 months
 *   guarantee_until   the date the clawback risk expires
 *   end_date          when they actually left, if they did
 *   end_reason        why, so "fell off" can be told apart from "contract completed"
 *
 * Additive and idempotent:
 *   DATABASE_URL="<target>" npx tsx src/lib/db/add-placement-lifecycle.ts
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `ALTER TABLE placements ADD COLUMN IF NOT EXISTS probation_until text`,
  `ALTER TABLE placements ADD COLUMN IF NOT EXISTS guarantee_until text`,
  `ALTER TABLE placements ADD COLUMN IF NOT EXISTS end_date text`,
  `ALTER TABLE placements ADD COLUMN IF NOT EXISTS end_reason text`,
  // the lifecycle screen always filters by org and sorts on the guarantee window
  `CREATE INDEX IF NOT EXISTS placements_guarantee_idx
     ON placements (org_id, guarantee_until)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo or a test branch.");
  }
  const sql = neon(url);

  for (const stmt of DDL) await sql.query(stmt);

  // Backfill a plausible guarantee window for existing demo rows so the new screen has
  // something to show. 90 days from the start date is the common Taiwan arrangement.
  const filled = await sql`
    UPDATE placements
       SET guarantee_until = to_char((start_date::date + INTERVAL '90 days'), 'YYYY-MM-DD'),
           probation_until = to_char((start_date::date + INTERVAL '90 days'), 'YYYY-MM-DD')
     WHERE start_date IS NOT NULL
       AND start_date <> ''
       AND guarantee_until IS NULL
    RETURNING id`;

  const [counts] = (await sql`
    SELECT count(*)::int AS total,
           count(guarantee_until)::int AS with_guarantee
      FROM placements`) as { total: number; with_guarantee: number }[];

  console.log("placement lifecycle columns applied.");
  console.log(
    `  placements: ${counts.total} total, ${counts.with_guarantee} with a guarantee window ` +
      `(+${(filled as unknown[]).length} backfilled)`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

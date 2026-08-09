/**
 * Per-client fee rates.
 *
 * `placements.fee_amount` was typed in by hand every time, so the agency's revenue rested
 * on someone remembering the rate. `clients.default_fee_pct` existed and was offered in
 * the CRM form, but it computed nothing and was null for every client — a rate card that
 * was never wired up.
 *
 * `fee_basis` says what the number means, which is what the old column was missing:
 * a multiple of monthly salary (the Taiwan convention, and what the existing fees follow)
 * or a percentage of the first year.
 *
 * Additive and idempotent:
 *   DATABASE_URL="<target>" npx tsx src/lib/db/add-fee-schedule.ts
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS fee_basis text`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS fee_value integer`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo or a test branch.");
  }
  const sql = neon(url);
  for (const stmt of DDL) await sql.query(stmt);

  // Carry across anything set on the old column, which meant percent of annual salary.
  await sql`
    UPDATE clients
       SET fee_basis = 'percent_annual', fee_value = default_fee_pct
     WHERE default_fee_pct IS NOT NULL AND fee_basis IS NULL
  `;

  const [{ withRate, total }] = (await sql`
    SELECT count(*) FILTER (WHERE fee_basis IS NOT NULL)::int AS "withRate",
           count(*)::int AS total
      FROM clients
  `) as { withRate: number; total: number }[];
  console.log(`  fee schedule ready | clients with an agreed rate: ${withRate}/${total}`);
}

main().catch((err) => { console.error(err); process.exit(1); });

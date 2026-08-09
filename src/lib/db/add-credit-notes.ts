/**
 * Credit notes.
 *
 * A paid invoice cannot be voided — once a bill has gone to a client, the correction is a
 * separate numbered document both sides can reconcile. The common case here: a placement
 * that fell off inside its guarantee after the fee was already billed.
 *
 * Additive and idempotent:
 *   DATABASE_URL="<target>" npx tsx src/lib/db/add-credit-notes.ts
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS credit_notes (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     invoice_id integer NOT NULL REFERENCES invoices(id),
     number text NOT NULL,
     issue_date text NOT NULL,
     subtotal integer NOT NULL,
     tax_rate_bp integer NOT NULL DEFAULT 500,
     tax_amount integer NOT NULL,
     total integer NOT NULL,
     reason text NOT NULL,
     created_by_user_id integer REFERENCES users(id),
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS credit_notes_invoice_idx ON credit_notes (invoice_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS credit_notes_org_number ON credit_notes (org_id, number)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo or a test branch.");
  }
  const sql = neon(url);
  for (const stmt of DDL) await sql.query(stmt);
  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM credit_notes`) as { n: number }[];
  console.log(`  credit_notes ready | credit notes: ${n}`);
}

main().catch((err) => { console.error(err); process.exit(1); });

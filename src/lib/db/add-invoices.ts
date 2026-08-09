/**
 * Client invoices.
 *
 * The agency's entire revenue lived in `placements.fee_amount` — a number with no bill
 * behind it. Nothing recorded what had been charged, when it went out, or whether it had
 * been paid, so "how much is outstanding?" had no answer anywhere in the product.
 *
 * Additive and idempotent:
 *   DATABASE_URL="<target>" npx tsx src/lib/db/add-invoices.ts
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `DO $$ BEGIN
     CREATE TYPE invoice_status AS ENUM ('draft','issued','paid','void');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS invoices (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     client_id integer NOT NULL REFERENCES clients(id),
     number text NOT NULL,
     status invoice_status NOT NULL DEFAULT 'draft',
     issue_date text,
     due_date text,
     currency text NOT NULL DEFAULT 'TWD',
     subtotal integer NOT NULL DEFAULT 0,
     tax_rate_bp integer NOT NULL DEFAULT 500,
     tax_amount integer NOT NULL DEFAULT 0,
     total integer NOT NULL DEFAULT 0,
     paid_at timestamptz,
     paid_amount integer,
     void_reason text,
     notes text,
     created_by_user_id integer REFERENCES users(id),
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS invoices_org_status_idx ON invoices (org_id, status)`,
  // The number is what a client quotes back on a remittance; it must be unambiguous.
  `CREATE UNIQUE INDEX IF NOT EXISTS invoices_org_number ON invoices (org_id, number)`,
  `CREATE TABLE IF NOT EXISTS invoice_lines (
     id serial PRIMARY KEY,
     invoice_id integer NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
     placement_id integer REFERENCES placements(id),
     description text NOT NULL,
     amount integer NOT NULL,
     voided boolean NOT NULL DEFAULT false
   )`,
  `CREATE INDEX IF NOT EXISTS invoice_lines_invoice_idx ON invoice_lines (invoice_id)`,
  // Separate from the CREATE TABLE so the migration also repairs a database where the
  // table already exists from an earlier version of this script.
  `ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS voided boolean NOT NULL DEFAULT false`,
  // A placement's fee can only be billed once. Postgres cannot reference another table
  // from an index predicate, hence the mirrored `voided` flag: voiding an invoice frees
  // its placements to be re-raised on a correction.
  `CREATE UNIQUE INDEX IF NOT EXISTS invoice_lines_one_live_per_placement
     ON invoice_lines (placement_id)
     WHERE placement_id IS NOT NULL AND voided = false`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo or a test branch.");
  }
  const sql = neon(url);

  for (const stmt of DDL) await sql.query(stmt);

  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM invoices`) as { n: number }[];
  console.log(`  invoices tables ready | invoices: ${n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

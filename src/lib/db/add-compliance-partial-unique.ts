/**
 * Make `unique_candidate_doc_type` partial so document renewals can keep history.
 *
 * The original index was UNIQUE (candidate_id, doc_type) with no predicate, which means a
 * candidate can hold exactly one ARC row ever. That is the right rule for *current*
 * documents and the wrong rule for the table as a whole: renewing an ARC has to keep the
 * expired one, or nobody can answer "was this worker covered on 1 August?" a year later.
 *
 * Rebuilt as UNIQUE (candidate_id, doc_type) WHERE status <> 'superseded' — same guarantee
 * for live documents, history allowed behind them.
 *
 * Additive and idempotent, safe to re-run:
 *   DATABASE_URL="<target>" npx tsx src/lib/db/add-compliance-partial-unique.ts
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `DROP INDEX IF EXISTS unique_candidate_doc_type`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_candidate_doc_type
     ON compliance_documents (candidate_id, doc_type)
     WHERE status <> 'superseded'`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo or a test branch.");
  }
  const sql = neon(url);

  for (const stmt of DDL) {
    await sql.query(stmt);
  }

  const [{ indexdef }] = (await sql`
    SELECT indexdef FROM pg_indexes WHERE indexname = 'unique_candidate_doc_type'
  `) as { indexdef: string }[];
  console.log("compliance partial unique index applied:");
  console.log("  " + indexdef);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

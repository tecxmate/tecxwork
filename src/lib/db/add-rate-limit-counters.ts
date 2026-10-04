/**
 * Atomic rate-limit counters.
 *
 * Additive + IDEMPOTENT. One table, no dependencies on anything else in the schema.
 *
 *   DATABASE_URL="<target>" npm run db:update:rate-limit
 */
import { seedSql } from "./seed-sql";

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS rate_limit_counters (
     bucket text NOT NULL,
     window_start integer NOT NULL,
     count integer NOT NULL DEFAULT 0,
     PRIMARY KEY (bucket, window_start)
   )`,
  // The sweep deletes by window, so it needs its own index.
  `CREATE INDEX IF NOT EXISTS rate_limit_window_idx ON rate_limit_counters (window_start)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = seedSql(url);
  for (const stmt of DDL) await sql.query(stmt);
  const [n] = await sql`SELECT count(*)::int AS n FROM rate_limit_counters`;
  console.log("Rate-limit counters migration applied. Rows:", n.n);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * An index on memberships.user_id. Idempotent.
 *
 *   DATABASE_URL="<target>" npm run db:update:memberships-user-index
 *
 * `getMember()` asks "which org is this user in" before any ATS route does its own
 * work, and `unique_org_member` cannot answer it — user_id is that index's second
 * column, so a lookup by user alone seq-scans the table. CONCURRENTLY, so it does
 * not take a write lock on a live database.
 */
import { seedSql } from "./seed-sql";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = seedSql(url);
  await sql.query(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS memberships_user_idx ON memberships (user_id)`
  );
  const [row] = (await sql`
    SELECT indexdef FROM pg_indexes WHERE indexname = 'memberships_user_idx'`) as {
    indexdef: string;
  }[];
  console.log(row ? `applied: ${row.indexdef}` : "index missing after apply — check the log above");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

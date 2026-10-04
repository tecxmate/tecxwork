/**
 * API keys — machine credentials for a workspace.
 *
 * Additive + IDEMPOTENT, safe to re-run. Creates one table and its indexes; touches nothing
 * that exists.
 *
 * Depends on the saas-tenancy migration only insofar as it needs `orgs` and `users`, both of
 * which predate it.
 *
 *   DATABASE_URL="<target>" npm run db:update:api-keys
 */
import { seedSql } from "./seed-sql";

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS api_keys (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     owner_user_id integer NOT NULL REFERENCES users(id),
     name text NOT NULL,
     token_hash text NOT NULL,
     prefix text NOT NULL,
     scopes text[] NOT NULL,
     last_used_at timestamptz,
     expires_at timestamptz,
     revoked_at timestamptz,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS api_keys_token_hash_idx ON api_keys (token_hash)`,
  `CREATE INDEX IF NOT EXISTS api_keys_org_idx ON api_keys (org_id, created_at)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = seedSql(url);

  for (const stmt of DDL) await sql.query(stmt);

  const [count] = await sql`SELECT count(*)::int AS n FROM api_keys`;
  console.log("API keys migration applied. Existing keys:", count.n);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

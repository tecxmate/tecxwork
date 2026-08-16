/**
 * OAuth 2.1 — clients, authorization codes, tokens.
 *
 * Additive + IDEMPOTENT. Depends only on `orgs` and `users`.
 *
 *   DATABASE_URL="<target>" npm run db:update:oauth
 */
import { seedSql } from "./seed-sql";

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS oauth_clients (
     id serial PRIMARY KEY,
     client_id text NOT NULL,
     client_secret_hash text,
     name text NOT NULL,
     redirect_uris text[] NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS oauth_clients_client_id_idx ON oauth_clients (client_id)`,

  `CREATE TABLE IF NOT EXISTS oauth_auth_codes (
     id serial PRIMARY KEY,
     code_hash text NOT NULL,
     client_id text NOT NULL,
     org_id integer NOT NULL REFERENCES orgs(id),
     user_id integer NOT NULL REFERENCES users(id),
     scopes text[] NOT NULL,
     redirect_uri text NOT NULL,
     code_challenge text NOT NULL,
     expires_at timestamptz NOT NULL,
     consumed_at timestamptz,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS oauth_auth_codes_hash_idx ON oauth_auth_codes (code_hash)`,

  `CREATE TABLE IF NOT EXISTS oauth_tokens (
     id serial PRIMARY KEY,
     token_hash text NOT NULL,
     kind text NOT NULL,
     client_id text NOT NULL,
     org_id integer NOT NULL REFERENCES orgs(id),
     user_id integer NOT NULL REFERENCES users(id),
     scopes text[] NOT NULL,
     expires_at timestamptz NOT NULL,
     revoked_at timestamptz,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS oauth_tokens_hash_idx ON oauth_tokens (token_hash)`,
  `CREATE INDEX IF NOT EXISTS oauth_tokens_grant_idx ON oauth_tokens (org_id, user_id, client_id)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = seedSql(url);
  for (const stmt of DDL) await sql.query(stmt);
  const [c] = await sql`SELECT count(*)::int AS n FROM oauth_clients`;
  const [t] = await sql`SELECT count(*)::int AS n FROM oauth_tokens`;
  console.log("OAuth migration applied. clients:", c.n, "| tokens:", t.n);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

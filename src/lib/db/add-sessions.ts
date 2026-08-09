/**
 * Revocable login sessions.
 *
 * The JWT was stateless: signing out cleared the cookie but left the token valid for the
 * rest of its 24 hours, and a password reset did not evict anyone already holding one — so
 * changing your password after a compromise did not actually end the attacker's access.
 * One row per signed-in device makes "is this session still allowed?" answerable.
 *
 * Additive and idempotent:
 *   DATABASE_URL="<target>" npx tsx src/lib/db/add-sessions.ts
 *
 * Note: every token issued before this runs lacks a `jti` and is refused by getSession, so
 * everyone signed in at deploy time is asked to sign in again. That is the intended and
 * safe direction — the alternative is honouring tokens that cannot be revoked.
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS sessions (
     id text PRIMARY KEY,
     user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at timestamptz NOT NULL DEFAULT now(),
     expires_at timestamptz NOT NULL
   )`,
  // "sign out everywhere" and password reset both delete by user
  `CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)`,
  // the expiry sweep deletes by date
  `CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo or a test branch.");
  }
  const sql = neon(url);

  for (const stmt of DDL) await sql.query(stmt);

  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM sessions`) as { n: number }[];
  console.log(`  sessions table ready | live sessions: ${n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

/**
 * A neon-compatible tagged-template SQL client that also works against a local
 * Postgres. Neon's driver speaks HTTP to Neon's proxy and cannot reach localhost;
 * the seed scripts use this switch (same URL test as src/lib/db) so the demo world
 * can be seeded into a local database as well as the Neon demo branch.
 */
export type SqlTag = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]>;
  /** neon's non-template form: sql.query("select ... where id=$1", [x]) */
  query(text: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
};

export function seedSql(url: string): SqlTag {
  const host = new URL(url).hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!isLocal) return neon(url) as unknown as SqlTag;

  const pool = new Pool({ connectionString: url });
  const tag = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    // `sql`SELECT ... WHERE id=${x}`` -> "SELECT ... WHERE id=$1" with [x].
    const text = strings.reduce((acc, s, i) => acc + (i > 0 ? `$${i}` : "") + s, "");
    const res = await pool.query(text, values as unknown[]);
    return res.rows;
  }) as SqlTag;
  tag.query = async (text, params) => (await pool.query(text, (params ?? []) as unknown[])).rows;
  return tag;
}

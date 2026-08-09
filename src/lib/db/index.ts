import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Node runtime needs an explicit ws implementation; in Edge / Vercel Functions
// the runtime provides WebSocket natively and this require is skipped.
if (typeof WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ws = require("ws");
  neonConfig.webSocketConstructor = ws;
}

let _db: NeonDatabase<typeof schema> | null = null;
let _pool: Pool | null = null;

/**
 * A local Postgres speaks the plain wire protocol; Neon's driver speaks WebSocket to
 * Neon's proxy and cannot reach one. Tests run against a local database (no network round
 * trip per query), production runs against Neon — so the driver follows the URL.
 */
function isLocalPostgres(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function getDb(): NeonDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    if (isLocalPostgres(url)) {
      // Loaded lazily and only for a local URL, so neither `pg` nor this branch is ever
      // pulled into a serverless bundle.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pool: PgPool } = require("pg");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { drizzle: pgDrizzle } = require("drizzle-orm/node-postgres");
      const pgPool = new PgPool({ connectionString: url });
      pgPool.on("error", (err: Error) => {
        console.error("Postgres pool error (ignored):", err);
      });
      _pool = pgPool as unknown as Pool;
      _db = pgDrizzle(pgPool, { schema }) as unknown as NeonDatabase<typeof schema>;
      return _db;
    }

    _pool = new Pool({ connectionString: url });
    // Without this listener, an error on an idle pooled client (e.g. Neon
    // dropping the WebSocket when the control plane is overloaded) is emitted
    // as an unhandled 'error' EventEmitter event, which Node escalates to an
    // uncaught exception and crashes the whole function instance. Swallowing it
    // here keeps the instance alive; the affected query still rejects normally.
    _pool.on("error", (err: Error) => {
      console.error("Neon pool error (ignored to avoid crashing instance):", err);
    });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

/**
 * Close the pool and drop the cached handle.
 *
 * Only tests need this: a serverless instance keeps its pool until it dies. Test files each
 * get a fresh module registry but share one Postgres server, so a pool left open by an
 * earlier file keeps idle connections that block the next file's TRUNCATE.
 */
export async function closeDb(): Promise<void> {
  if (!_pool) return;
  const pool = _pool;
  _pool = null;
  _db = null;
  await pool.end();
}

// Re-export for convenience — callers use `db` from route handlers
export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export * from "./schema";

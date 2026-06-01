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

export function getDb(): NeonDatabase<typeof schema> {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL environment variable is not set");
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

// Re-export for convenience — callers use `db` from route handlers
export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export * from "./schema";

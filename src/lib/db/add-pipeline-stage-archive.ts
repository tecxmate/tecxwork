/**
 * Archivable pipeline stages.
 *
 * `pipeline_stages` was read in four places and written in none — the hiring process was
 * whatever the seed script happened to insert. Making it editable needs a way to retire a
 * stage, and a hard delete is not it: `application_stage_transitions` is the append-only
 * record the funnel and time-in-stage reports are built from, and it references stage ids.
 * Deleting a stage anyone ever moved through would either be refused by the foreign key or
 * take the history with it.
 *
 * Archiving removes a stage from the board while leaving every past transition explicable.
 *
 * Additive and idempotent:
 *   DATABASE_URL="<target>" npx tsx src/lib/db/add-pipeline-stage-archive.ts
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS archived_at timestamptz`,
  // every board query filters archived stages out, ordered by position
  `CREATE INDEX IF NOT EXISTS pipeline_stages_active_idx
     ON pipeline_stages (template_id, archived_at, sort_order)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo or a test branch.");
  }
  const sql = neon(url);

  for (const stmt of DDL) await sql.query(stmt);

  const [{ active, archived }] = (await sql`
    SELECT count(*) FILTER (WHERE archived_at IS NULL)::int  AS active,
           count(*) FILTER (WHERE archived_at IS NOT NULL)::int AS archived
    FROM pipeline_stages
  `) as { active: number; archived: number }[];
  console.log(`  pipeline_stages ready | active: ${active} | archived: ${archived}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

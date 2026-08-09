/**
 * Document custody.
 *
 * A CV was a Google Drive URL the candidate owned: they could revoke or delete it and the
 * agency's record of what it actually submitted would vanish, and the sharing setting the
 * product asked for ("anyone with the link") made every CV readable by anyone holding the
 * URL. Compliance was worse — the tracker knew an ARC existed and when it expired, but
 * never held the scan an inspection asks to see.
 *
 * Bytes live in object storage; this table is the index, the access boundary, and what an
 * auditor reads. Nothing is served directly — every read goes through the app.
 *
 * Additive and idempotent:
 *   DATABASE_URL="<target>" npx tsx src/lib/db/add-documents.ts
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `DO $$ BEGIN
     CREATE TYPE document_kind AS ENUM
       ('cv','arc','work_permit','passport','diploma','contract','other');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS documents (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     candidate_id integer NOT NULL REFERENCES applicant_profiles(id),
     kind document_kind NOT NULL,
     filename text NOT NULL,
     content_type text NOT NULL,
     size_bytes integer NOT NULL,
     storage_key text NOT NULL UNIQUE,
     uploaded_by_user_id integer REFERENCES users(id),
     deleted_at timestamptz,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS documents_candidate_idx
     ON documents (org_id, candidate_id, kind)`,
  // the scan behind a tracked compliance record
  `ALTER TABLE compliance_documents
     ADD COLUMN IF NOT EXISTS document_id integer REFERENCES documents(id)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo or a test branch.");
  }
  const sql = neon(url);

  for (const stmt of DDL) await sql.query(stmt);

  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM documents`) as { n: number }[];
  console.log(`  documents table ready | stored documents: ${n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

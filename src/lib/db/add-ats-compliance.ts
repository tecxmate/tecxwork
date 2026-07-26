/**
 * ATS Phase 3 migration — migrant-labor compliance documents.
 *
 * Creates compliance_documents and seeds a realistic mix of docs (passport / ARC
 * / work permit / medical) for in-process candidates, with some ARC/work-permit
 * expiries deliberately within 30 days or already past so the expiry alerts are
 * demonstrable. Idempotent (unique (candidate_id, doc_type) + ON CONFLICT).
 *
 *   DATABASE_URL="<demo>" npm run db:update:ats-compliance
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_type') THEN
       CREATE TYPE doc_type AS ENUM
         ('passport','visa','arc','work_permit','medical','contract','diploma','criminal_record','health_insurance');
     END IF;
   END $$`,
  `CREATE TABLE IF NOT EXISTS compliance_documents (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     candidate_id integer NOT NULL REFERENCES applicant_profiles(id),
     placement_id integer REFERENCES placements(id),
     doc_type doc_type NOT NULL,
     doc_number text,
     issuing_authority text,
     issue_date text,
     expiry_date text,
     status text NOT NULL DEFAULT 'valid',
     file_id text,
     verified_by_user_id integer REFERENCES users(id),
     verified_at timestamptz,
     notes text,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_candidate_doc_type ON compliance_documents (candidate_id, doc_type)`,
  `CREATE INDEX IF NOT EXISTS compliance_docs_expiry_idx ON compliance_documents (org_id, expiry_date)`,
];

function ymd(daysFromNow: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo DB.");
  }
  const sql = neon(url);
  for (const stmt of DDL) await sql.query(stmt);

  // In-process candidates: those with a submission at interview/offer/placed.
  const cands = (await sql`
    SELECT DISTINCT s.candidate_id AS id, s.org_id AS org_id
    FROM submissions s
    JOIN pipeline_stages ps ON ps.id = s.stage_id
    WHERE ps.stage_kind IN ('interview','offer','placed')
    ORDER BY s.candidate_id
    LIMIT 12`) as { id: number; org_id: number }[];

  // Deliberate expiry mix so the alerts show valid / expiring-soon / expired.
  const arcOffsets = [18, -15, 300, 25, 400, -6]; // days
  const wpOffsets = [400, 22, -8, 350, 12, 500];

  let made = 0;
  for (let i = 0; i < cands.length; i++) {
    const c = cands[i];
    const docs: { type: string; num: string; auth: string; expiry: string }[] = [
      { type: "passport", num: `P${1000000 + c.id}`, auth: "Home country", expiry: ymd(730) },
      { type: "arc", num: `AR${900000 + c.id}`, auth: "NIA 移民署", expiry: ymd(arcOffsets[i % arcOffsets.length]) },
      { type: "work_permit", num: `WP${800000 + c.id}`, auth: "MOL/WDA 勞動部", expiry: ymd(wpOffsets[i % wpOffsets.length]) },
      { type: "medical", num: `MED${700000 + c.id}`, auth: "衛福部指定醫院", expiry: ymd(365) },
    ];
    for (const d of docs) {
      const res = await sql`
        INSERT INTO compliance_documents (org_id, candidate_id, doc_type, doc_number, issuing_authority, expiry_date, status)
        VALUES (${c.org_id}, ${c.id}, ${d.type}::doc_type, ${d.num}, ${d.auth}, ${d.expiry}, 'valid')
        ON CONFLICT (candidate_id, doc_type) DO NOTHING
        RETURNING id`;
      made += (res as unknown[]).length;
    }
  }

  const [total] = (await sql`SELECT count(*)::int AS n FROM compliance_documents`) as { n: number }[];
  const [exp] = (await sql`SELECT count(*)::int AS n FROM compliance_documents WHERE expiry_date < to_char(now(),'YYYY-MM-DD')`) as { n: number }[];
  const [soon] = (await sql`SELECT count(*)::int AS n FROM compliance_documents WHERE expiry_date >= to_char(now(),'YYYY-MM-DD') AND expiry_date <= to_char(now() + interval '30 days','YYYY-MM-DD')`) as { n: number }[];
  console.log("ATS compliance migration applied.");
  console.log(`  candidates seeded:${cands.length} new docs:${made} total:${total.n} | expired:${exp.n} expiring≤30d:${soon.n}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

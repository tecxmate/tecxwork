/**
 * ATS Phase 4b migration — collaboration (activity notes + scorecards).
 * Creates the tables and seeds a few demo notes + scorecards on in-process
 * candidates so the candidate drawer has content. Idempotent-ish (only seeds
 * when a candidate has none).
 *
 *   DATABASE_URL="<demo>" npm run db:update:ats-collab
 */
import { neon } from "@neondatabase/serverless";

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS activity (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     application_id integer NOT NULL REFERENCES applications(id),
     type text NOT NULL DEFAULT 'note',
     body text NOT NULL DEFAULT '',
     author_user_id integer REFERENCES users(id),
     author_name text,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS activity_application_idx ON activity (application_id, created_at)`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scorecard_recommendation') THEN
       CREATE TYPE scorecard_recommendation AS ENUM ('strong_no','no','yes','strong_yes');
     END IF;
   END $$`,
  `CREATE TABLE IF NOT EXISTS scorecards (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     application_id integer NOT NULL REFERENCES applications(id),
     interviewer_user_id integer REFERENCES users(id),
     interviewer_name text,
     recommendation scorecard_recommendation NOT NULL,
     ratings jsonb,
     comment text NOT NULL DEFAULT '',
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS scorecards_application_idx ON scorecards (application_id, created_at)`,
];

const NOTES = [
  "AutoCAD/BIM 作品集紮實，中文溝通流利。",
  "客戶要求安排第二輪面試。",
  "薪資期望符合職缺範圍。",
  "需確認居留證與工作許可效期。",
  "面試表現積極，團隊合作意願高。",
];
const RECS = ["strong_yes", "yes", "yes", "no"] as const;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) throw new Error("Refusing: PROD host.");
  const sql = neon(url);
  for (const stmt of DDL) await sql.query(stmt);

  const [hr] = (await sql`SELECT id FROM users WHERE email='hr@yangluck.demo'`) as { id: number }[];
  const apps = (await sql`
    SELECT a.id, a.org_id AS org_id
    FROM applications a
    JOIN pipeline_stages ps ON ps.id = a.stage_id
    WHERE ps.stage_kind IN ('interview','offer','placed')
    ORDER BY a.id LIMIT 10`) as { id: number; org_id: number }[];

  let notes = 0;
  let cards = 0;
  for (let i = 0; i < apps.length; i++) {
    const a = apps[i];
    const already = (await sql`SELECT 1 FROM activity WHERE application_id=${a.id} LIMIT 1`) as unknown[];
    if (already.length === 0) {
      // 1–2 notes
      const n1 = NOTES[i % NOTES.length];
      const n2 = NOTES[(i + 2) % NOTES.length];
      await sql`INSERT INTO activity (org_id, application_id, type, body, author_user_id, author_name)
        VALUES (${a.org_id}, ${a.id}, 'note', ${n1}, ${hr?.id ?? null}, '揚運 HR 陳小姐')`;
      notes++;
      if (i % 2 === 0) {
        await sql`INSERT INTO activity (org_id, application_id, type, body, author_user_id, author_name)
          VALUES (${a.org_id}, ${a.id}, 'note', ${n2}, ${hr?.id ?? null}, '揚運 HR 陳小姐')`;
        notes++;
      }
    }
    const hasCard = (await sql`SELECT 1 FROM scorecards WHERE application_id=${a.id} LIMIT 1`) as unknown[];
    if (hasCard.length === 0) {
      const ratings = JSON.stringify([
        { attribute: "Technical", rating: 3 + (i % 2) },
        { attribute: "Communication", rating: 2 + (i % 3 === 0 ? 2 : 1) },
        { attribute: "Chinese", rating: 3 },
      ]);
      await sql`INSERT INTO scorecards (org_id, application_id, interviewer_user_id, interviewer_name, recommendation, ratings, comment)
        VALUES (${a.org_id}, ${a.id}, ${hr?.id ?? null}, '揚運 HR 陳小姐', ${RECS[i % RECS.length]}::scorecard_recommendation, ${ratings}::jsonb, ${NOTES[(i + 1) % NOTES.length]})`;
      cards++;
    }
  }

  const [nt] = (await sql`SELECT count(*)::int AS n FROM activity`) as { n: number }[];
  const [sc] = (await sql`SELECT count(*)::int AS n FROM scorecards`) as { n: number }[];
  console.log("ATS collab migration applied.");
  console.log(`  seeded notes:+${notes} scorecards:+${cards} | totals activity:${nt.n} scorecards:${sc.n}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

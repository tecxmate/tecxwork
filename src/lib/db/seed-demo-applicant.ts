/**
 * Seed ONE demo applicant login + a few bookable slots for the 麗明營造 recruiter,
 * so the full apply → pipeline-card flow can be tested end to end.
 *
 * Idempotent. Demo DB only.
 *   DATABASE_URL="<demo>" npx tsx src/lib/db/seed-demo-applicant.ts
 */
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) {
    throw new Error("Refusing: PROD host. Use the demo DB.");
  }
  const sql = neon(url);
  const pw = await bcrypt.hash("demo1234", 12);

  // Applicant user
  await sql`
    INSERT INTO users (email, name, password_hash, role)
    VALUES ('student@yangluck.demo', 'Demo Student 阮文測試', ${pw}, 'applicant')
    ON CONFLICT (email) DO NOTHING`;
  const [u] = (await sql`SELECT id FROM users WHERE email='student@yangluck.demo'`) as { id: number }[];

  // Applicant profile (linked to the user; required: name, email, cv_link)
  await sql`
    INSERT INTO applicant_profiles
      (user_id, name, email, nationality, school_name, school_name_en, major, study_level, skills, cv_link, description, pipa_consent)
    VALUES
      (${u.id}, 'Demo Student 阮文測試', 'student@yangluck.demo', '越南 Vietnam',
       '台科大', 'NTUST', '土木工程 Civil Eng.', '大四 Senior',
       ARRAY['AutoCAD','BIM','Excel'], 'https://drive.google.com/demo-cv-placeholder',
       '測試用學生帳號 — demo applicant', true)
    ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id`;

  // Bookable slots for the 麗明營造 recruiter so the apply flow can complete.
  const [leeming] = (await sql`SELECT id FROM recruiters WHERE company LIKE '%麗明營造%' LIMIT 1`) as { id: number }[];
  if (!leeming) throw new Error("麗明營造 recruiter not found — run the Yang Luck seed first.");

  const now = new Date();
  let made = 0;
  for (let d = 1; d <= 3; d++) {
    for (const hourUtc of [2, 4, 6]) {
      // UTC 02/04/06 → Taipei 10/12/14
      const start = new Date(now);
      start.setUTCDate(start.getUTCDate() + d);
      start.setUTCHours(hourUtc, 0, 0, 0);
      const end = new Date(start.getTime() + 30 * 60000);
      const res = await sql`
        INSERT INTO slots (recruiter_id, start_time, end_time, interviewer_number, status)
        VALUES (${leeming.id}, ${start.toISOString()}, ${end.toISOString()}, 1, 'available')
        ON CONFLICT DO NOTHING
        RETURNING id`;
      made += (res as unknown[]).length;
    }
  }

  const [slotCount] = (await sql`SELECT count(*)::int AS n FROM slots WHERE recruiter_id=${leeming.id} AND status='available' AND start_time > now()`) as { n: number }[];
  console.log("Demo applicant seeded: student@yangluck.demo / demo1234 (profile id linked).");
  console.log(`麗明營造 recruiter id ${leeming.id}: +${made} new slots, ${slotCount.n} available future slots total.`);
}

main().catch((e) => { console.error(e); process.exit(1); });

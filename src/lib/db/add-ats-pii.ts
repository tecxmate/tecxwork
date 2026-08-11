/**
 * ATS Phase 5 migration — PII governance (consent + retention + erasure).
 * Adds consent/retention/anonymized columns to applicant_profiles and backfills
 * consent + an 18-month retention date for consented candidates. Additive +
 * idempotent.
 *
 *   DATABASE_URL="<demo>" npm run db:update:ats-pii
 */
import { seedSql } from "./seed-sql";

const DDL: string[] = [
  `ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS consent_at timestamptz`,
  `ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS consent_purpose text`,
  `ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS retention_until text`,
  `ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS anonymized_at timestamptz`,
];

const BACKFILL: string[] = [
  // Consented candidates: record consent + an 18-month retention date.
  `UPDATE applicant_profiles
     SET consent_at = COALESCE(consent_at, created_at),
         consent_purpose = COALESCE(consent_purpose, 'recruitment_placement'),
         retention_until = COALESCE(retention_until, to_char(created_at + interval '18 months', 'YYYY-MM-DD'))
     WHERE pipa_consent = true AND anonymized_at IS NULL`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) throw new Error("Refusing: PROD host.");
  const sql = seedSql(url);
  for (const stmt of [...DDL, ...BACKFILL]) await sql.query(stmt);

  const [c] = (await sql`SELECT count(*)::int AS n FROM applicant_profiles WHERE consent_at IS NOT NULL`) as { n: number }[];
  const [r] = (await sql`SELECT count(*)::int AS n FROM applicant_profiles WHERE retention_until IS NOT NULL`) as { n: number }[];
  console.log("ATS PII governance migration applied.");
  console.log(`  candidates with consent recorded: ${c.n} | with retention date: ${r.n}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

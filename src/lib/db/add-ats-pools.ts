/**
 * ATS talent pools / hotlists migration. Creates the tables and seeds a few
 * demo pools + members. Idempotent.
 *
 *   DATABASE_URL="<demo>" npm run db:update:ats-pools
 */
import { seedSql } from "./seed-sql";

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS talent_pools (
     id serial PRIMARY KEY,
     org_id integer NOT NULL REFERENCES orgs(id),
     name text NOT NULL,
     description text NOT NULL DEFAULT '',
     created_by_user_id integer REFERENCES users(id),
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS talent_pool_members (
     id serial PRIMARY KEY,
     pool_id integer NOT NULL REFERENCES talent_pools(id),
     candidate_id integer NOT NULL REFERENCES applicant_profiles(id),
     added_by_user_id integer REFERENCES users(id),
     added_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS unique_pool_member ON talent_pool_members (pool_id, candidate_id)`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) throw new Error("Refusing: PROD host.");
  const sql = seedSql(url);
  for (const stmt of DDL) await sql.query(stmt);

  const [org] = (await sql`SELECT id FROM orgs WHERE slug='yang-luck'`) as { id: number }[];
  const [hr] = (await sql`SELECT id FROM users WHERE email='hr@yangluck.demo'`) as { id: number }[];

  async function ensurePool(name: string, desc: string): Promise<number> {
    await sql`
      INSERT INTO talent_pools (org_id, name, description, created_by_user_id)
      SELECT ${org.id}, ${name}, ${desc}, ${hr?.id ?? null}
      WHERE NOT EXISTS (SELECT 1 FROM talent_pools WHERE org_id=${org.id} AND name=${name})`;
    const [p] = (await sql`SELECT id FROM talent_pools WHERE org_id=${org.id} AND name=${name}`) as { id: number }[];
    return p.id;
  }

  const pools = {
    vn: await ensurePool("越南工程人才 VN Engineers", "營造/機電 越南候選人"),
    id: await ensurePool("印尼製造人才 ID Manufacturing", "製造業 印尼候選人"),
    hosp: await ensurePool("旅宿雙語人才 Hospitality CN/EN", "旅宿業 中英雙語"),
    redeploy: await ensurePool("重新媒合 Redeployment", "合約結束、可重新媒合"),
  };

  async function assign(poolId: number, candidateIds: number[]) {
    for (const cid of candidateIds) {
      await sql`INSERT INTO talent_pool_members (pool_id, candidate_id, added_by_user_id)
        VALUES (${poolId}, ${cid}, ${hr?.id ?? null}) ON CONFLICT (pool_id, candidate_id) DO NOTHING`;
    }
  }

  const vn = (await sql`SELECT id FROM applicant_profiles WHERE nationality LIKE '%越南%' ORDER BY id LIMIT 6`) as { id: number }[];
  const idn = (await sql`SELECT id FROM applicant_profiles WHERE nationality LIKE '%印尼%' ORDER BY id LIMIT 5`) as { id: number }[];
  const hosp = (await sql`SELECT id FROM applicant_profiles WHERE major LIKE '%餐旅%' OR major LIKE '%旅館%' OR major LIKE '%Hospitality%' OR major LIKE '%Hotel%' ORDER BY id LIMIT 4`) as { id: number }[];
  const placed = (await sql`
    SELECT DISTINCT a.applicant_id AS id FROM applications a
    JOIN pipeline_stages ps ON ps.id=a.stage_id AND ps.stage_kind='placed' LIMIT 3`) as { id: number }[];

  await assign(pools.vn, vn.map((c) => c.id));
  await assign(pools.id, idn.map((c) => c.id));
  await assign(pools.hosp, hosp.map((c) => c.id));
  await assign(pools.redeploy, placed.map((c) => c.id));

  const [pc] = (await sql`SELECT count(*)::int AS n FROM talent_pools`) as { n: number }[];
  const [mc] = (await sql`SELECT count(*)::int AS n FROM talent_pool_members`) as { n: number }[];
  console.log("ATS talent pools migration applied.");
  console.log(`  pools:${pc.n} members:${mc.n}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

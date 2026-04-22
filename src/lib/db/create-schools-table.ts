import { neon } from "@neondatabase/serverless";

async function createSchoolsTable() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS schools (
      id serial PRIMARY KEY,
      code text NOT NULL,
      name_zh text NOT NULL,
      name_en text NOT NULL DEFAULT '',
      city text NOT NULL DEFAULT '',
      school_type text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS schools_code_idx
    ON schools (code)
  `;

  console.log("Ensured schools table exists");
}

createSchoolsTable().catch((error) => {
  console.error(error);
  process.exit(1);
});

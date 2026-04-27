import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    CREATE TABLE IF NOT EXISTS recruiter_email_approvals (
      id serial PRIMARY KEY,
      email text NOT NULL UNIQUE,
      company text NOT NULL,
      industry text NOT NULL,
      status text NOT NULL DEFAULT 'approved',
      created_at timestamptz NOT NULL DEFAULT now(),
      approved_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  console.log("Ensured recruiter_email_approvals table exists");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

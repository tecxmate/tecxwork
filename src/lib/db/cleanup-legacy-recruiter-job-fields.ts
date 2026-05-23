import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    UPDATE recruiters
    SET positions = ARRAY[]::text[],
        jd_link = NULL
  `;

  console.log("Cleared legacy recruiter.positions and recruiter.jd_link values");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

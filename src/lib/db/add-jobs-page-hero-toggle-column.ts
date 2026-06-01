import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    if (process.env[key]) continue;

    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function main() {
  loadLocalEnv();

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(url);

  await sql`
    ALTER TABLE event_config
    ADD COLUMN IF NOT EXISTS jobs_page_hero_enabled boolean NOT NULL DEFAULT true
  `;

  console.log("Ensured event_config.jobs_page_hero_enabled exists");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

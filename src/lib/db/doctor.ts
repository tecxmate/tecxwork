/**
 * Read-only database diagnostic.
 *
 * Answers, for whatever `DATABASE_URL` points at: does the ATS schema exist here, has the
 * saas-tenancy migration been applied, and is it safe to deploy the current code against it.
 *
 * This exists because that question blocked a deploy and nobody could answer it from the
 * code alone. Most migration scripts in this directory refuse production hosts outright
 * ("Use the demo DB"), which leaves it genuinely unclear which databases ever received the
 * ATS tables. Rather than guess, run this.
 *
 * **Strictly read-only.** Every statement is a SELECT against information_schema or a
 * COUNT. It is safe to point at production — that is the whole point of it.
 *
 *   DATABASE_URL="<any connection string>" npm run db:doctor
 */
import { seedSql } from "./seed-sql";

/** Tables the ATS/agency product cannot work without. */
const ATS_TABLES = [
  "orgs",
  "memberships",
  "clients",
  "job_orders",
  "applications",
  "placements",
  "compliance_documents",
  "audit_log",
] as const;

/** What the saas-tenancy migration adds. Its absence is what breaks a deploy. */
const TENANCY_COLUMNS: readonly { table: string; column: string }[] = [
  { table: "orgs", column: "status" },
  { table: "orgs", column: "plan" },
  { table: "orgs", column: "seat_limit" },
  { table: "orgs", column: "trial_ends_at" },
  { table: "orgs", column: "billing_email" },
  { table: "event_config", column: "org_id" },
];

type Sql = ReturnType<typeof seedSql>;

async function tableExists(sql: Sql, name: string): Promise<boolean> {
  const rows = await sql.query(
    `SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
    [name]
  );
  return rows.length > 0;
}

async function columnExists(sql: Sql, table: string, column: string): Promise<boolean> {
  const rows = await sql.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2 LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function countOf(sql: Sql, table: string): Promise<number | null> {
  if (!(await tableExists(sql, table))) return null;
  const rows = await sql.query(`SELECT count(*)::int AS n FROM ${table}`);
  return Number(rows[0]?.n ?? 0);
}

/** Host only — never print a connection string, it carries the password. */
function describeTarget(url: string): string {
  try {
    const host = new URL(url).hostname;
    const known = /delicate-lab|bitter-hill/.test(host)
      ? "  ⚠ this looks like a PRODUCTION host"
      : /localhost|127\.0\.0\.1/.test(host)
        ? "  (local)"
        : "";
    return `${host}${known}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = seedSql(url);

  console.log("");
  console.log("Database doctor — read-only. No statement below writes anything.");
  console.log(`Target: ${describeTarget(url)}`);
  console.log("");

  // --- Is the ATS product even installed here? ---
  const present: string[] = [];
  const missing: string[] = [];
  for (const table of ATS_TABLES) {
    if (await tableExists(sql, table)) present.push(table);
    else missing.push(table);
  }

  console.log("ATS schema");
  console.log(`  present (${present.length}/${ATS_TABLES.length}): ${present.join(", ") || "none"}`);
  if (missing.length) console.log(`  MISSING: ${missing.join(", ")}`);

  const atsInstalled = missing.length === 0;
  const atsAbsent = present.length === 0;

  // --- Has the saas-tenancy migration run? ---
  const columnResults = await Promise.all(
    TENANCY_COLUMNS.map(async (c) => ({
      ...c,
      exists: (await tableExists(sql, c.table)) && (await columnExists(sql, c.table, c.column)),
    }))
  );
  const missingColumns = columnResults.filter((c) => !c.exists);

  console.log("");
  console.log("saas-tenancy migration");
  if (missingColumns.length === 0) {
    console.log("  applied — all commercial columns present");
  } else {
    console.log(
      `  NOT applied — missing: ${missingColumns.map((c) => `${c.table}.${c.column}`).join(", ")}`
    );
  }

  // --- Tenancy content ---
  const orgCount = await countOf(sql, "orgs");
  const memberCount = await countOf(sql, "memberships");
  const inviteCount = await countOf(sql, "org_invites");

  console.log("");
  console.log("Tenancy content");
  console.log(`  orgs: ${orgCount ?? "(table absent)"}`);
  console.log(`  memberships: ${memberCount ?? "(table absent)"}`);
  console.log(`  org_invites: ${inviteCount ?? "(table absent)"}`);

  if (await tableExists(sql, "event_config")) {
    const total = await countOf(sql, "event_config");
    const hasOrgId = await columnExists(sql, "event_config", "org_id");
    const defaults = hasOrgId
      ? Number(
          (await sql.query(`SELECT count(*)::int AS n FROM event_config WHERE org_id IS NULL`))[0]
            ?.n ?? 0
        )
      : (total ?? 0);
    console.log(`  event_config rows: ${total} (platform-default: ${defaults})`);
    if (defaults > 1) {
      console.log("    ⚠ more than one platform-default row — the apex site's branding is ambiguous");
    }
  }

  // --- Verdict ---
  console.log("");
  console.log("Verdict");
  if (atsAbsent) {
    console.log("  The ATS/agency schema is NOT installed on this database.");
    console.log("  The agency product cannot run here, with or without the tenancy migration.");
    console.log("  If this is the database the deployment reads, the agency routes are");
    console.log("  already failing on current main, independently of this work.");
  } else if (!atsInstalled) {
    console.log("  The ATS schema is PARTIALLY installed — see MISSING above.");
    console.log("  Investigate before migrating; this is not a state any script produced.");
  } else if (missingColumns.length > 0) {
    console.log("  ATS schema present, tenancy migration outstanding.");
    console.log("  Run: npm run db:update:saas-tenancy");
    console.log("  Until then agency routes read columns that do not exist and will 500.");
    console.log("  (Public branding is unaffected — it falls back when org_id is missing.)");
  } else {
    console.log("  Ready. ATS schema present and the tenancy migration has been applied.");
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

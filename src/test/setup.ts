import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, vi } from "vitest";

/**
 * Test setup — runs once per test file.
 *
 * Requires TEST_DATABASE_URL pointing at a throwaway Neon branch / local
 * Postgres database. We refuse to run if it equals DATABASE_URL so a
 * misconfigured CI run can't truncate prod tables.
 */

function loadLocalEnv() {
  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) continue;

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
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
}

loadLocalEnv();

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Point it at a throwaway test database " +
      "(e.g. a Neon branch) before running `npm test`."
  );
}
if (testUrl === process.env.DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL must be different from DATABASE_URL — refusing to " +
      "run tests against the same database."
  );
}
// Make `db` (which reads DATABASE_URL at first use) point at the test DB.
process.env.DATABASE_URL = testUrl;

// Stable cookie store for the current "request" — tests mutate this via
// withSession() / clearSession() helpers in helpers.ts.
type FakeCookie = { name: string; value: string };
const cookieStore: Map<string, FakeCookie> = new Map();

export const __testCookieStore = cookieStore;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieStore.get(name),
    set: (name: string, value: string) => {
      cookieStore.set(name, { name, value });
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  }),
  headers: async () => ({
    get: () => null,
  }),
}));

/**
 * Run a setup statement, retrying once if the connection itself failed.
 *
 * The suite talks to a remote Neon branch over a WebSocket pool, and across a run of ~180
 * tests that socket occasionally drops. The pooled client surfaces it as a failed query on
 * the *next* statement, which turned a healthy test into a red one. Retrying once after
 * dropping the dead pool distinguishes "the connection blinked" from "the query is wrong":
 * a genuinely bad statement fails again immediately and still reports.
 */
async function withReconnect(run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (err) {
    const { closeDb } = await import("@/lib/db");
    await closeDb().catch(() => {});
    console.warn(
      `test setup: reconnecting after a failed statement (${String(err).slice(0, 120)})`
    );
    await run();
  }
}

beforeAll(async () => {
  // Confirm we can talk to the test DB. Same reconnect treatment: a socket that drops on
  // the very first statement would otherwise skip an entire file's worth of tests.
  const { db } = await import("@/lib/db");
  await withReconnect(() => db.execute(/* sql */ `select 1`));
});

beforeEach(async () => {
  cookieStore.clear();
  const { db } = await import("@/lib/db");

  // TRUNCATE takes ACCESS EXCLUSIVE on every table listed, so a single connection left
  // idle-in-transaction by an earlier file blocks it — and Postgres waits forever by
  // default, which surfaced as one test hanging for ten minutes instead of failing.
  // Fail fast and loudly instead; the message points at the real cause.
  await withReconnect(() => db.execute(/* sql */ `set lock_timeout = '15s'`));

  // Truncate all mutable tables. CASCADE handles FKs.
  await withReconnect(() =>
    db.execute(/* sql */ `
    truncate table
      audit_log,
      credit_notes,
      invoice_lines,
      invoices,
      documents,
      compliance_documents,
      placements,
      offers,
      submissions,
      job_orders,
      contacts,
      clients,
      application_stage_transitions,
      applications,
      pipeline_stages,
      pipeline_templates,
      api_keys,
      rate_limit_counters,
      memberships,
      org_invites,
      orgs,
      booking_reschedule_logs,
      bookings,
      slots,
      applicant_slots,
      applicant_profiles,
      recruiters,
      job_openings,
      password_reset_codes,
      email_verification_codes,
      notifications,
      push_subscriptions,
      email_logs,
      sessions,
      recruiter_email_approvals,
      users
    restart identity cascade
  `)
  );
});

afterAll(async () => {
  cookieStore.clear();
  // Release this file's connections so the next file's TRUNCATE isn't blocked by them.
  const { closeDb } = await import("@/lib/db");
  await closeDb();
});

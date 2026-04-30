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

beforeAll(async () => {
  // Confirm we can talk to the test DB.
  const { db } = await import("@/lib/db");
  await db.execute(
    /* sql */ `select 1`
  );
});

beforeEach(async () => {
  cookieStore.clear();
  // Truncate all mutable tables. CASCADE handles FKs.
  const { db } = await import("@/lib/db");
  await db.execute(/* sql */ `
    truncate table
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
      recruiter_email_approvals,
      users
    restart identity cascade
  `);
});

afterAll(async () => {
  cookieStore.clear();
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

/**
 * Branding must survive a database that has not had the saas-tenancy migration yet.
 *
 * `event_config.org_id` is added by `db:update:saas-tenancy`. Between a deploy and that
 * migration the column does not exist, and the tenant-scoped read fails — which without a
 * fallback drops the whole public site back to the hardcoded `EVENT_CONFIG`, losing the
 * event name, dates and imagery the admin panel controls.
 *
 * This test drops the column to reproduce that window exactly, rather than trusting that
 * the fallback is wired. It restores the column afterwards regardless of outcome.
 */
describe("event branding — before the tenancy migration has run", () => {
  beforeAll(async () => {
    await db.execute(/* sql */ `ALTER TABLE event_config DROP COLUMN IF EXISTS org_id`);
  });

  afterAll(async () => {
    // Restore, or every later file in the run sees a schema the app expects to have.
    await db.execute(
      /* sql */ `ALTER TABLE event_config ADD COLUMN IF NOT EXISTS org_id integer REFERENCES orgs(id)`
    );
    await db.execute(
      /* sql */ `CREATE UNIQUE INDEX IF NOT EXISTS event_config_org_idx ON event_config (coalesce(org_id, 0))`
    );
  });

  it("still serves the admin-configured branding, not the hardcoded fallback", async () => {
    // Raw SQL, not drizzle: the schema declares org_id, so an ORM insert would name a
    // column this test has deliberately removed.
    await db.execute(/* sql */ `
      INSERT INTO event_config (event_name, event_date)
      VALUES ('Configured In The Database', now())
    `);

    // Imported here, after the column is dropped, so the module's own caching cannot have
    // warmed on a schema this test is about not having.
    const { getEventBranding } = await import("@/lib/event-branding");
    const branding = await getEventBranding();

    expect(branding.name).toBe("Configured In The Database");
  });
});

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { auditLog, memberships, recruiters } from "@/lib/db/schema";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getAuditPage, AUDIT_PAGE_SIZE } from "@/lib/audit-log";
import { createOrg } from "@/lib/provisioning";
import { seedRecruiter, withSession } from "./helpers";
import { requireAgency } from "@/lib/agency-auth";
import type { MemberRole } from "@/lib/ats-auth";

let seq = 0;

async function newOrg() {
  const result = await createOrg({
    name: `Audit Org ${seq}`,
    slug: `audit-org-${seq++}-${Date.now()}`,
    plan: "growth",
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function signedInMemberOf(orgId: number, role: MemberRole) {
  const rec = await seedRecruiter({ email: `audit-${seq++}-${Date.now()}@example.com` });
  await db
    .update(recruiters)
    .set({ orgId, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  await db.insert(memberships).values({ orgId, userId: rec.userId, role });
  await withSession({ userId: rec.userId, email: rec.email, role: "recruiter" });
  return rec;
}

describe("audit trail — who may read it", () => {
  it("is oversight, not operations: admin and viewer only", () => {
    // Letting the people being audited read the audit is how a trail stops being one.
    expect(can("admin", "audit:read")).toBe(true);
    expect(can("viewer", "audit:read")).toBe(true);

    for (const role of [
      "account_manager",
      "recruiter",
      "hiring_manager",
      "coordinator",
      "interviewer",
    ] as MemberRole[]) {
      expect(can(role, "audit:read"), `${role} must not read the audit`).toBe(false);
    }
  });

  it("the route enforces it, not just the matrix", async () => {
    const org = await newOrg();
    await signedInMemberOf(org.id, "recruiter");
    const denied = await requireAgency("audit:read");
    expect(denied.ok).toBe(false);

    await signedInMemberOf(org.id, "viewer");
    const allowed = await requireAgency("audit:read");
    expect(allowed.ok).toBe(true);
  });
});

describe("audit trail — what it returns", () => {
  it("is scoped to the org, and cannot see another tenant's entries", async () => {
    const mine = await newOrg();
    const theirs = await newOrg();
    await logAudit({ orgId: mine.id, action: "create", entityType: "client", entityId: 1 });
    await logAudit({ orgId: theirs.id, action: "create", entityType: "client", entityId: 2 });

    const page = await getAuditPage(mine.id);
    expect(page.total).toBe(1);
    expect(page.events[0].entityId).toBe(1);
  });

  it("shows newest first", async () => {
    const org = await newOrg();
    await logAudit({ orgId: org.id, action: "create", entityType: "client", entityId: 1 });
    await logAudit({ orgId: org.id, action: "update", entityType: "client", entityId: 2 });

    const page = await getAuditPage(org.id);
    expect(page.events.map((e) => e.action)).toEqual(["update", "create"]);
  });

  it("keeps entries whose actor is the system, rather than dropping them", async () => {
    // A left join, not an inner one: a cron or system action has no user row, and those
    // are the entries an inspection asks about most.
    const org = await newOrg();
    await logAudit({
      orgId: org.id,
      actorType: "job",
      action: "export",
      entityType: "placement",
    });

    const page = await getAuditPage(org.id);
    expect(page.total).toBe(1);
    expect(page.events[0].actorName).toBeNull();
    expect(page.events[0].actorType).toBe("job");
  });

  it("filters by action and by record type", async () => {
    const org = await newOrg();
    await logAudit({ orgId: org.id, action: "create", entityType: "client" });
    await logAudit({ orgId: org.id, action: "update", entityType: "client" });
    await logAudit({ orgId: org.id, action: "create", entityType: "placement" });

    expect((await getAuditPage(org.id, { action: "create" })).total).toBe(2);
    expect((await getAuditPage(org.id, { entityType: "placement" })).total).toBe(1);
    expect(
      (await getAuditPage(org.id, { action: "create", entityType: "client" })).total
    ).toBe(1);
  });

  it("offers only the filter values this org has actually produced", async () => {
    const org = await newOrg();
    await logAudit({ orgId: org.id, action: "move_stage", entityType: "application" });

    const page = await getAuditPage(org.id);
    expect(page.actions).toEqual(["move_stage"]);
    expect(page.entityTypes).toEqual(["application"]);
  });

  it("paginates", async () => {
    const org = await newOrg();
    const rows = Array.from({ length: AUDIT_PAGE_SIZE + 5 }, () => ({
      orgId: org.id,
      action: "view",
      entityType: "candidate",
    }));
    await db.insert(auditLog).values(rows);

    const first = await getAuditPage(org.id);
    expect(first.events).toHaveLength(AUDIT_PAGE_SIZE);
    expect(first.total).toBe(AUDIT_PAGE_SIZE + 5);

    const second = await getAuditPage(org.id, { page: 2 });
    expect(second.events).toHaveLength(5);
    // No row appears on both pages — the ordering is total, including the id tiebreak.
    const overlap = second.events.filter((e) => first.events.some((f) => f.id === e.id));
    expect(overlap).toHaveLength(0);
  });

  it("carries no candidate values — only the names of fields that changed", async () => {
    // The property that makes this safe to show a viewer, who deliberately cannot open the
    // candidate database.
    const org = await newOrg();
    await logAudit({
      orgId: org.id,
      action: "update",
      entityType: "candidate",
      entityId: 7,
      fieldNames: ["email", "phone"],
      metadata: { role: "recruiter" },
    });

    const page = await getAuditPage(org.id);
    const serialised = JSON.stringify(page.events[0]);
    expect(page.events[0].fieldNames).toEqual(["email", "phone"]);
    // The field NAME "email" is present; no address is.
    expect(serialised).not.toMatch(/@/);
  });
});

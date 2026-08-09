import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { clients, memberships, orgs, recruiters } from "@/lib/db/schema";
import { jsonRequest, seedRecruiter, withSession } from "./helpers";
import type { MemberRole } from "@/lib/ats-auth";
import { GET as listClients, POST as createClient } from "@/app/api/agency/clients/route";
import { POST as createJobOrder } from "@/app/api/agency/job-orders/route";

let seq = 0;

/**
 * The permission matrix is unit-tested on its own. These tests answer the separate
 * question the matrix cannot: is it actually consulted on the way in? A correct policy
 * that no route calls protects nothing.
 */
async function seedAgencyMember(role: MemberRole) {
  const [org] = await db
    .insert(orgs)
    .values({ name: `Org${seq}`, slug: `org-${seq++}-${Date.now()}` })
    .returning();
  const rec = await seedRecruiter({ company: "Agency" });
  await db
    .update(recruiters)
    .set({ orgId: org.id, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  await db.insert(memberships).values({ orgId: org.id, userId: rec.userId, role });
  withSession({ userId: rec.userId, email: rec.email, role: "recruiter" });
  return { orgId: org.id, ...rec };
}

const post = (url: string, payload: unknown) =>
  jsonRequest(`http://localhost${url}`, { method: "POST", body: payload });

describe("RBAC — enforced on the client routes", () => {
  it("an account manager can create a client", async () => {
    await seedAgencyMember("account_manager");
    const res = await createClient(post("/api/agency/clients", { name: "Giant" }));
    expect(res.status).toBe(201);
  });

  it("a recruiter cannot create a client, but can still list them", async () => {
    await seedAgencyMember("recruiter");

    const write = await createClient(post("/api/agency/clients", { name: "Giant" }));
    expect(write.status).toBe(403);
    expect((await write.json()).error).toMatch(/role/i);
    // the write really did not happen
    expect(await db.select().from(clients)).toHaveLength(0);

    expect((await listClients()).status).toBe(200);
  });

  it("a viewer is refused every write and allowed the read", async () => {
    await seedAgencyMember("viewer");

    expect((await createClient(post("/api/agency/clients", { name: "X" }))).status).toBe(403);
    expect(
      (await createJobOrder(post("/api/agency/job-orders", { clientId: 1, title: "Role" })))
        .status
    ).toBe(403);
    expect((await listClients()).status).toBe(200);
  });

  it("an interviewer cannot even list clients", async () => {
    await seedAgencyMember("interviewer");
    expect((await listClients()).status).toBe(403);
  });
});

describe("RBAC — the gate itself", () => {
  it("refuses an agency recruiter who has no membership row", async () => {
    // Deny by default: a missing role must never be read as a permissive one.
    const [org] = await db
      .insert(orgs)
      .values({ name: `NoMem${seq}`, slug: `nomem-${seq++}-${Date.now()}` })
      .returning();
    const rec = await seedRecruiter({ company: "Agency" });
    await db
      .update(recruiters)
      .set({ orgId: org.id, clientKind: "agency" })
      .where(eq(recruiters.id, rec.recruiterId));
    withSession({ userId: rec.userId, email: rec.email, role: "recruiter" });

    const res = await listClients();
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/not a member/i);
  });

  it("uses the role from the org being acted in, not another org's membership", async () => {
    // A user can belong to several orgs. Reading the wrong membership would let an admin
    // of one tenant act as an admin of another.
    const agency = await seedAgencyMember("viewer");
    const [other] = await db
      .insert(orgs)
      .values({ name: `Other${seq}`, slug: `other-${seq++}-${Date.now()}` })
      .returning();
    await db
      .insert(memberships)
      .values({ orgId: other.id, userId: agency.userId, role: "admin" });

    // Still a viewer where it counts, despite holding admin elsewhere.
    const res = await createClient(post("/api/agency/clients", { name: "Should Fail" }));
    expect(res.status).toBe(403);
    expect(await db.select().from(clients)).toHaveLength(0);
  });
});

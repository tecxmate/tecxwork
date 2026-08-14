import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { memberships, recruiters } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth";
import { users } from "@/lib/db/schema";
import { changeMemberRole, getTeam, removeMember } from "@/lib/members";
import { createOrg, inviteMember, seatsUsed } from "@/lib/provisioning";
import type { MemberRole } from "@/lib/ats-auth";

let seq = 0;

async function newOrg(seatLimit = 10) {
  const result = await createOrg({
    name: `Team Org ${seq}`,
    slug: `team-org-${seq++}-${Date.now()}`,
    seatLimit,
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function addMember(orgId: number, role: MemberRole) {
  const email = `member-${seq++}-${Date.now()}@example.com`;
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: `Member ${role}`,
      passwordHash: await hashPassword("not-used-in-tests-12345"),
      role: "recruiter",
    })
    .returning();
  const [rec] = await db
    .insert(recruiters)
    .values({
      userId: user.id,
      company: "Agency",
      industry: "staffing",
      contactEmail: email,
      orgId,
      clientKind: "agency",
    })
    .returning();
  await db.insert(memberships).values({ orgId, userId: user.id, role });
  return { userId: user.id, recruiterId: rec.id, email };
}

describe("team — the view an admin actually reads", () => {
  it("lists members, pending invitations and the seat budget together", async () => {
    const org = await newOrg(5);
    await addMember(org.id, "admin");
    await addMember(org.id, "recruiter");
    await inviteMember({
      orgId: org.id,
      email: "pending@example.com",
      role: "coordinator",
      invitedByUserId: null,
    });

    const team = await getTeam(org.id);
    expect(team.members).toHaveLength(2);
    expect(team.invites).toHaveLength(1);
    // Two members plus one held seat — the number that decides whether the invite form works.
    expect(team.seats).toEqual({ limit: 5, used: 3 });
  });

  it("does not show expired or revoked invitations as pending", async () => {
    const org = await newOrg();
    const invited = await inviteMember({
      orgId: org.id,
      email: "gone@example.com",
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!invited.ok) throw new Error("seed failed");

    const { revokeInvite } = await import("@/lib/provisioning");
    await revokeInvite(org.id, invited.data.id);

    expect((await getTeam(org.id)).invites).toHaveLength(0);
  });
});

describe("team — the last administrator", () => {
  it("refuses to demote the only admin", async () => {
    // A workspace with no admin cannot invite, cannot change roles, and cannot recover on
    // its own — and the click that causes it looks entirely ordinary.
    const org = await newOrg();
    const only = await addMember(org.id, "admin");

    const result = await changeMemberRole(org.id, only.userId, "viewer");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);

    const [row] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, only.userId));
    expect(row.role).toBe("admin");
  });

  it("refuses to remove the only admin", async () => {
    const org = await newOrg();
    const only = await addMember(org.id, "admin");

    const result = await removeMember(org.id, only.userId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });

  it("allows it once a second admin exists", async () => {
    const org = await newOrg();
    const first = await addMember(org.id, "admin");
    await addMember(org.id, "admin");

    expect((await changeMemberRole(org.id, first.userId, "recruiter")).ok).toBe(true);
  });
});

describe("team — removing a member", () => {
  it("releases the seat", async () => {
    const org = await newOrg(3);
    await addMember(org.id, "admin");
    const leaver = await addMember(org.id, "recruiter");
    expect(await seatsUsed(org.id)).toBe(2);

    expect((await removeMember(org.id, leaver.userId)).ok).toBe(true);
    expect(await seatsUsed(org.id)).toBe(1);
  });

  it("keeps the recruiter row — a departure is not an erasure", async () => {
    const org = await newOrg();
    await addMember(org.id, "admin");
    const leaver = await addMember(org.id, "recruiter");

    await removeMember(org.id, leaver.userId);

    const [rec] = await db
      .select()
      .from(recruiters)
      .where(eq(recruiters.id, leaver.recruiterId));
    expect(rec).toBeDefined();
    // Unlinked from the org, so a future invitation elsewhere is not refused as
    // "already belongs to another workspace" — otherwise leaving strands the account.
    expect(rec.orgId).toBeNull();
  });

  it("lets a removed person be invited into a different workspace", async () => {
    const first = await newOrg();
    const second = await newOrg();
    await addMember(first.id, "admin");
    const mover = await addMember(first.id, "recruiter");

    await removeMember(first.id, mover.userId);

    const invited = await inviteMember({
      orgId: second.id,
      email: mover.email,
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!invited.ok) throw new Error("seed failed");

    const { acceptInvite } = await import("@/lib/provisioning");
    expect((await acceptInvite(invited.data.token, mover.userId)).ok).toBe(true);
  });

  it("refuses a member id from another workspace without confirming it exists", async () => {
    const mine = await newOrg();
    const theirs = await newOrg();
    await addMember(mine.id, "admin");
    const outsider = await addMember(theirs.id, "recruiter");

    const result = await removeMember(mine.id, outsider.userId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.error).toMatch(/not a member/i);
    }

    // ...and they are untouched in their own workspace.
    expect((await getTeam(theirs.id)).members).toHaveLength(1);
  });
});

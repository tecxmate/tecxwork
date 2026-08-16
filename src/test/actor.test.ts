import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { clients, jobOpenings, recruiters } from "@/lib/db/schema";
import { getAgencyCrm } from "@/lib/agency-crm";
import { getPipelineBoard } from "@/lib/pipeline-data";
import type { RecruiterActor } from "@/lib/actor";
import { isAgencyActor } from "@/lib/actor";
import { createOrg } from "@/lib/provisioning";
import { clearSession, seedRecruiter } from "./helpers";

let seq = 0;

async function newOrg() {
  const result = await createOrg({
    name: `Actor Org ${seq}`,
    slug: `actor-org-${seq++}-${Date.now()}`,
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function agencyActorFor(orgId: number): Promise<RecruiterActor> {
  const rec = await seedRecruiter({ email: `actor-${seq++}-${Date.now()}@example.com` });
  await db
    .update(recruiters)
    .set({ orgId, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));

  return {
    userId: rec.userId,
    recruiterId: rec.recruiterId,
    company: "Agency",
    clientKind: "agency",
    orgId,
    source: "session",
  };
}

/**
 * The point of the actor refactor is that the data layer no longer reads the request.
 *
 * Every test here runs with **no session at all** — `clearSession()` first. Before the
 * refactor each of these calls returned null at the first line, because it went looking for
 * a cookie. That they now return data is the property that makes the same functions usable
 * from a script, a cron, or a token-authenticated connector.
 */
describe("actor — the data layer no longer reads the session", () => {
  it("getAgencyCrm serves an org with no session present", async () => {
    const org = await newOrg();
    await db.insert(clients).values({ orgId: org.id, name: "Giant" });

    clearSession();
    const crm = await getAgencyCrm(org.id);

    expect(crm).not.toBeNull();
    expect(crm?.clients.map((c) => c.name)).toContain("Giant");
  });

  it("getPipelineBoard serves an actor with no session present", async () => {
    const org = await newOrg();
    const actor = await agencyActorFor(org.id);
    // The opening has to belong to a CLIENT-company recruiter in the same org, not to the
    // agency: an agency places people *into* clients, so `getPipelineBoard` excludes the
    // agency's own openings (`ne(clientKind, "agency")`). Attaching it to the agency
    // produces an empty board, which is correct and easy to mistake for a bug.
    const client = await seedRecruiter({
      email: `client-${seq++}-${Date.now()}@example.com`,
      company: "Giant Manufacturing",
    });
    await db
      .update(recruiters)
      .set({ orgId: org.id, clientKind: "client" })
      .where(eq(recruiters.id, client.recruiterId));
    await db.insert(jobOpenings).values({
      recruiterId: client.recruiterId,
      orgId: org.id,
      title: "Site Engineer",
    });

    clearSession();
    const board = await getPipelineBoard(actor);

    expect(board).not.toBeNull();
    expect(board?.recruiter.company).toBe("Agency");
    expect(board?.jobs.map((j) => j.title)).toContain("Site Engineer");
  });

  it("the org argument is the tenant boundary — one org cannot see another's clients", async () => {
    // The whole safety argument for passing orgId rather than deriving it: the caller
    // establishes the tenant, and nothing inside the function can widen it.
    const mine = await newOrg();
    const theirs = await newOrg();
    await db.insert(clients).values({ orgId: theirs.id, name: "Not Mine" });

    clearSession();
    const crm = await getAgencyCrm(mine.id);

    expect(crm?.clients).toHaveLength(0);
  });
});

describe("actor — shape", () => {
  it("an agency actor needs both the kind and an org", async () => {
    const org = await newOrg();
    const actor = await agencyActorFor(org.id);
    expect(isAgencyActor(actor)).toBe(true);

    // A recruiter whose org was never set is not an agency actor, whatever their kind says.
    expect(isAgencyActor({ ...actor, orgId: null })).toBe(false);
    expect(isAgencyActor({ ...actor, clientKind: "client" })).toBe(false);
  });
});

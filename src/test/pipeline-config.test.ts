import { and, eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  applicantProfiles,
  applications,
  jobOpenings,
  memberships,
  orgs,
  pipelineStages,
  pipelineTemplates,
  recruiters,
} from "@/lib/db/schema";
import { jsonRequest, seedRecruiter, withSession } from "./helpers";
import type { MemberRole } from "@/lib/ats-auth";
import {
  GET as listStagesRoute,
  PATCH as reorderStages,
  POST as createStage,
} from "@/app/api/agency/pipeline/stages/route";
import {
  DELETE as retireStage,
  PATCH as updateStage,
} from "@/app/api/agency/pipeline/stages/[id]/route";

let seq = 0;

async function seedAgency(role: MemberRole = "admin") {
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
  await withSession({ userId: rec.userId, email: rec.email, role: "recruiter" });
  return { orgId: org.id, ...rec };
}

/** A candidate standing in a stage — what makes a stage unsafe to retire. */
async function seedCandidateIn(stageId: number, orgId: number) {
  const [profile] = await db
    .insert(applicantProfiles)
    .values({
      name: "Occupant",
      email: `occ-${seq++}-${Date.now()}@test.dev`,
      cvLink: "https://example.com/cv",
      pipaConsent: true,
    })
    .returning({ id: applicantProfiles.id });

  const [rec] = await db.select().from(recruiters).limit(1);
  // applications.job_opening_id is NOT NULL, so the row needs a real opening behind it.
  const [job] = await db
    .insert(jobOpenings)
    .values({ recruiterId: rec.id, orgId, title: "Site Engineer" })
    .returning({ id: jobOpenings.id });

  await db.insert(applications).values({
    applicantId: profile.id,
    recruiterId: rec.id,
    jobOpeningId: job.id,
    orgId,
    stageId,
  });
}

const post = (payload: unknown) =>
  jsonRequest("http://localhost/api/agency/pipeline/stages", {
    method: "POST",
    body: payload,
  });
const patch = (payload: unknown) =>
  jsonRequest("http://localhost/api/agency/pipeline/stages", {
    method: "PATCH",
    body: payload,
  });
const ctx = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });

async function stageNames(orgId: number) {
  const rows = await db
    .select({ name: pipelineStages.name, sortOrder: pipelineStages.sortOrder })
    .from(pipelineStages)
    .innerJoin(pipelineTemplates, eq(pipelineStages.templateId, pipelineTemplates.id))
    .where(and(eq(pipelineTemplates.orgId, orgId), isNull(pipelineStages.archivedAt)))
    .orderBy(pipelineStages.sortOrder);
  return rows.map((r) => r.name);
}

async function addStages(names: string[]) {
  const ids: number[] = [];
  for (const name of names) {
    const res = await createStage(post({ name, stageKind: "interview" }));
    expect(res.status).toBe(201);
    ids.push((await res.json()).stage.id);
  }
  return ids;
}

describe("pipeline config — building the board", () => {
  it("creates the org's template on first use, so a new org is never stageless", async () => {
    const a = await seedAgency();
    const res = await listStagesRoute();
    expect(res.status).toBe(200);
    expect((await res.json()).stages).toEqual([]);

    // the template was created on demand rather than requiring a seed script
    const templates = await db
      .select()
      .from(pipelineTemplates)
      .where(eq(pipelineTemplates.orgId, a.orgId));
    expect(templates).toHaveLength(1);
    expect(templates[0].isDefault).toBe(true);
  });

  it("appends new stages to the end of the board", async () => {
    const a = await seedAgency();
    await addStages(["Applied", "Screening", "Interview"]);
    expect(await stageNames(a.orgId)).toEqual(["Applied", "Screening", "Interview"]);
  });

  it("renames a stage without disturbing its position", async () => {
    const a = await seedAgency();
    const [, second] = await addStages(["Applied", "Screening", "Offer"]);

    const res = await updateStage(
      jsonRequest("http://localhost/x", { method: "PATCH", body: { name: "Phone screen" } }),
      ctx(second)
    );
    expect(res.status).toBe(200);
    expect(await stageNames(a.orgId)).toEqual(["Applied", "Phone screen", "Offer"]);
  });
});

describe("pipeline config — reordering", () => {
  it("applies a full reorder", async () => {
    const a = await seedAgency();
    const [first, second, third] = await addStages(["A", "B", "C"]);

    const res = await reorderStages(patch({ order: [third, first, second] }));
    expect(res.status).toBe(200);
    expect(await stageNames(a.orgId)).toEqual(["C", "A", "B"]);
  });

  it("refuses a partial reorder rather than guessing where the rest go", async () => {
    const a = await seedAgency();
    const [first, second] = await addStages(["A", "B", "C"]);

    const res = await reorderStages(patch({ order: [second, first] }));
    expect(res.status).toBe(400);
    // untouched
    expect(await stageNames(a.orgId)).toEqual(["A", "B", "C"]);
  });

  it("refuses a reorder naming the same stage twice", async () => {
    const a = await seedAgency();
    const [first, second, third] = await addStages(["A", "B", "C"]);
    void second;
    const res = await reorderStages(patch({ order: [first, first, third] }));
    expect(res.status).toBe(400);
    expect(await stageNames(a.orgId)).toEqual(["A", "B", "C"]);
  });

  it("refuses a reorder containing another org's stage", async () => {
    const mine = await seedAgency();
    const [a1, a2] = await addStages(["A", "B"]);

    const theirs = await seedAgency();
    const [b1] = await addStages(["Theirs"]);

    await withSession({ userId: mine.userId, email: mine.email, role: "recruiter" });
    const res = await reorderStages(patch({ order: [a1, a2, b1] }));
    expect(res.status).toBe(400);
    expect(await stageNames(theirs.orgId)).toEqual(["Theirs"]);
  });
});

describe("pipeline config — retiring a stage", () => {

  it("archives rather than deletes, so the transition history stays readable", async () => {
    const a = await seedAgency();
    const [, second] = await addStages(["A", "B", "C"]);

    expect((await retireStage(jsonRequest("http://localhost/x", { method: "DELETE" }), ctx(second))).status).toBe(200);

    // gone from the board...
    expect(await stageNames(a.orgId)).toEqual(["A", "C"]);
    // ...but the row survives, so anything referencing it still resolves
    const [row] = await db.select().from(pipelineStages).where(eq(pipelineStages.id, second));
    expect(row).toBeDefined();
    expect(row.archivedAt).not.toBeNull();
  });

  it("refuses while candidates are still standing in it", async () => {
    const a = await seedAgency();
    const [, second] = await addStages(["A", "B", "C"]);
    await seedCandidateIn(second, a.orgId);

    const res = await retireStage(jsonRequest("http://localhost/x", { method: "DELETE" }), ctx(second));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.occupancy).toBe(1);
    // the message names the number so the user knows how much work it is to clear
    expect(body.error).toMatch(/1 candidate/);
    expect(await stageNames(a.orgId)).toEqual(["A", "B", "C"]);
  });

  it("refuses to remove the last stage, which would leave an unrecoverable empty board", async () => {
    const a = await seedAgency();
    const [only] = await addStages(["Only"]);

    const res = await retireStage(jsonRequest("http://localhost/x", { method: "DELETE" }), ctx(only));
    expect(res.status).toBe(409);
    expect(await stageNames(a.orgId)).toEqual(["Only"]);
  });

  it("cannot retire another org's stage", async () => {
    await seedAgency();
    const [theirs] = await addStages(["Theirs", "Other"]);

    const mine = await seedAgency();
    await withSession({ userId: mine.userId, email: mine.email, role: "recruiter" });

    const res = await retireStage(jsonRequest("http://localhost/x", { method: "DELETE" }), ctx(theirs));
    expect(res.status).toBe(404);
  });

  it("an archived stage is not found a second time", async () => {
    await seedAgency();
    const [, second] = await addStages(["A", "B"]);
    await retireStage(jsonRequest("http://localhost/x", { method: "DELETE" }), ctx(second));

    const again = await retireStage(jsonRequest("http://localhost/x", { method: "DELETE" }), ctx(second));
    expect(again.status).toBe(404);
  });
});

describe("pipeline config — who may reshape the process", () => {
  it("a recruiter may move candidates but not redefine the stages", async () => {
    await seedAgency("recruiter");
    expect((await listStagesRoute()).status).toBe(403);
    expect((await createStage(post({ name: "X", stageKind: "interview" }))).status).toBe(403);
  });

  it("an account manager may", async () => {
    await seedAgency("account_manager");
    expect((await createStage(post({ name: "X", stageKind: "interview" }))).status).toBe(201);
  });

  it("a viewer may not", async () => {
    await seedAgency("viewer");
    expect((await createStage(post({ name: "X", stageKind: "interview" }))).status).toBe(403);
  });
});

describe("pipeline config — validation", () => {
  it("rejects a blank name", async () => {
    await seedAgency();
    expect((await createStage(post({ name: "   ", stageKind: "interview" }))).status).toBe(400);
  });

  it("rejects a stage kind the product does not understand", async () => {
    await seedAgency();
    expect((await createStage(post({ name: "X", stageKind: "vibes" }))).status).toBe(400);
  });

  it("reports how many candidates stand in each stage", async () => {
    const a = await seedAgency();
    const [first] = await addStages(["A", "B"]);
    await seedCandidateIn(first, a.orgId);

    const res = await listStagesRoute();
    const { stages } = await res.json();
    expect(stages.find((s: { id: number }) => s.id === first).occupancy).toBe(1);
    expect(stages.find((s: { name: string }) => s.name === "B").occupancy).toBe(0);
  });

});

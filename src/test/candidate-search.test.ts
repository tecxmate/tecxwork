import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { applicantProfiles, complianceDocuments, orgs, recruiters } from "@/lib/db/schema";
import { searchCandidates } from "@/lib/candidate-search";
import { seedRecruiter } from "./helpers";

let seq = 0;

/**
 * Insert a profile row directly instead of going through seedApplicant.
 *
 * Search reads applicant_profiles and never touches users, so creating a login for each of
 * these adds nothing — and seedApplicant hashes a password with bcrypt, which is deliberately
 * slow. Thirty of those in one test blew the 20s timeout on its own.
 */
async function candidate(opts: {
  name: string;
  nationality?: string;
  school?: string;
  major?: string;
  studyLevel?: string;
  skills?: string[];
}) {
  const [row] = await db
    .insert(applicantProfiles)
    .values({
      name: opts.name,
      email: `cand-${seq++}-${Date.now()}@test.dev`,
      cvLink: "https://example.com/cv",
      pipaConsent: true,
      nationality: opts.nationality ?? "越南 Vietnam",
      schoolName: opts.school ?? "台科大",
      major: opts.major ?? "土木 Civil",
      studyLevel: opts.studyLevel ?? "大四 Senior",
      skills: opts.skills ?? [],
    })
    .returning({ id: applicantProfiles.id });
  return row.id;
}

const names = (r: { hits: { name: string }[] }) => r.hits.map((h) => h.name).sort();

describe("candidate search", () => {
  it("matches on name, school, major and skills from one box", async () => {
    await candidate({ name: "Nguyen Van A", school: "台科大", major: "土木 Civil", skills: ["BIM"] });
    await candidate({ name: "Someone Else", school: "明志科技大學", major: "機械 Mechanical", skills: ["CNC"] });

    expect(names(await searchCandidates({ q: "Nguyen" }))).toEqual(["Nguyen Van A"]);
    expect(names(await searchCandidates({ q: "台科大" }))).toEqual(["Nguyen Van A"]);
    expect(names(await searchCandidates({ q: "Mechanical" }))).toEqual(["Someone Else"]);
    // skills live in a text[]; searching them from the same box is the whole point
    expect(names(await searchCandidates({ q: "BIM" }))).toEqual(["Nguyen Van A"]);
  });

  it("treats multiple skills as AND, so adding one always narrows", async () => {
    await candidate({ name: "Both", skills: ["AutoCAD", "BIM"] });
    await candidate({ name: "OnlyCad", skills: ["AutoCAD"] });
    await candidate({ name: "OnlyBim", skills: ["BIM"] });

    expect(names(await searchCandidates({ skills: ["AutoCAD"] }))).toEqual(["Both", "OnlyCad"]);
    // an OR implementation would return all three here — that is the bug this guards
    expect(names(await searchCandidates({ skills: ["AutoCAD", "BIM"] }))).toEqual(["Both"]);
  });

  it("never surfaces an erased candidate", async () => {
    const keptId = await candidate({ name: "Still Here" });
    const erasedId = await candidate({ name: "Erased Person" });
    await db
      .update(applicantProfiles)
      .set({ anonymizedAt: new Date() })
      .where(eq(applicantProfiles.id, erasedId));

    const all = await searchCandidates({});
    expect(names(all)).toEqual(["Still Here"]);
    expect(all.total).toBe(1);

    // and not via a direct search for them either
    expect((await searchCandidates({ q: "Erased" })).hits).toHaveLength(0);
    expect(keptId).toBeGreaterThan(0);
  });

  it("excludes erased candidates from the facet counts too", async () => {
    await candidate({ name: "A", nationality: "越南 Vietnam" });
    const gone = await candidate({ name: "B", nationality: "越南 Vietnam" });
    await db
      .update(applicantProfiles)
      .set({ anonymizedAt: new Date() })
      .where(eq(applicantProfiles.id, gone));

    const { facets } = await searchCandidates({});
    const vn = facets.nationalities.find((n) => n.value === "越南 Vietnam");
    // a facet saying "2" that returns 1 result reads as a broken filter
    expect(vn?.count).toBe(1);
  });

  it("filters by document status, and the worst document wins", async () => {
    const [org] = await db.insert(orgs).values({ name: "A", slug: `a-${Date.now()}` }).returning();
    const rec = await seedRecruiter({ company: "A" });
    await db
      .update(recruiters)
      .set({ orgId: org.id, clientKind: "agency" })
      .where(eq(recruiters.id, rec.recruiterId));

    const okId = await candidate({ name: "Papers Fine" });
    const badId = await candidate({ name: "Papers Expired" });

    await db.insert(complianceDocuments).values([
      { orgId: org.id, candidateId: okId, docType: "arc", expiryDate: "2030-01-01" },
      // one valid and one expired document: the candidate must still count as a problem
      { orgId: org.id, candidateId: badId, docType: "arc", expiryDate: "2030-01-01" },
      { orgId: org.id, candidateId: badId, docType: "work_permit", expiryDate: "2020-01-01" },
    ]);

    expect(names(await searchCandidates({ docs: "valid" }))).toEqual(["Papers Fine"]);
    expect(names(await searchCandidates({ docs: "attention" }))).toEqual(["Papers Expired"]);

    const all = await searchCandidates({});
    expect(all.hits.find((h) => h.name === "Papers Expired")?.docStatus).toBe("expired");
    // nobody filed anything for candidates with no documents — that is "none", not "valid"
    const none = await candidate({ name: "No Papers" });
    expect(none).toBeGreaterThan(0);
    expect((await searchCandidates({ q: "No Papers" })).hits[0].docStatus).toBe("none");
  });

  it("ignores a superseded document when judging status", async () => {
    const [org] = await db.insert(orgs).values({ name: "A", slug: `a-${Date.now()}` }).returning();
    const id = await candidate({ name: "Renewed" });

    await db.insert(complianceDocuments).values([
      // the old, expired record kept as history after a renewal
      { orgId: org.id, candidateId: id, docType: "arc", expiryDate: "2020-01-01", status: "superseded" },
      { orgId: org.id, candidateId: id, docType: "arc", expiryDate: "2030-01-01" },
    ]);

    const { hits } = await searchCandidates({ q: "Renewed" });
    expect(hits[0].docStatus).toBe("valid");
    expect(await searchCandidates({ docs: "attention" }).then(names)).toEqual([]);
  });

  it("paginates without losing or repeating anyone", async () => {
    await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        candidate({ name: `Person ${String(i).padStart(2, "0")}` })
      )
    );

    const p1 = await searchCandidates({ page: 1 });
    const p2 = await searchCandidates({ page: 2 });

    expect(p1.total).toBe(30);
    expect(p1.hits).toHaveLength(24);
    expect(p2.hits).toHaveLength(6);
    const seen = new Set([...p1.hits, ...p2.hits].map((h) => h.id));
    expect(seen.size).toBe(30);
  });
});

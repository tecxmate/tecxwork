import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  applicantProfiles,
  applications,
  jobOpenings,
  recruiters,
} from "@/lib/db/schema";
import { searchCandidates } from "@/lib/candidate-search";
import { PIPA_PURPOSE, hasLawfulBasis, retentionDateFrom } from "@/lib/pipa";
import { createOrg } from "@/lib/provisioning";
import { seedApplicant, seedRecruiter } from "./helpers";

let seq = 0;

async function newOrg() {
  const result = await createOrg({
    name: `Pool Org ${seq}`,
    slug: `pool-org-${seq++}-${Date.now()}`,
    plan: "scale",
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

/** A candidate with the consent the signup form has always collected. */
async function candidate(name: string, purpose: string | null = PIPA_PURPOSE.RECRUITMENT) {
  const app = await seedApplicant({ name, email: `pool-${seq++}-${Date.now()}@example.com` });
  await db
    .update(applicantProfiles)
    .set({
      pipaConsent: true,
      consentAt: new Date(),
      consentPurpose: purpose,
      retentionUntil: retentionDateFrom(new Date()),
    })
    .where(eq(applicantProfiles.id, app.applicantId));
  return app;
}

/** Put a candidate into an org's pipeline, which is what "claims" them. */
async function applyTo(orgId: number, applicantId: number, title = "Welder") {
  const rec = await seedRecruiter({ email: `pool-r-${seq++}-${Date.now()}@example.com` });
  await db
    .update(recruiters)
    .set({ orgId, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));

  const [job] = await db
    .insert(jobOpenings)
    .values({ recruiterId: rec.recruiterId, orgId, title, description: "x" })
    .returning();

  await db.insert(applications).values({
    jobOpeningId: job.id,
    applicantId,
    recruiterId: rec.recruiterId,
    orgId,
  });
}

const names = (r: { hits: { name: string }[] }) => r.hits.map((h) => h.name).sort();

describe("candidate pool — one workspace cannot read another's", () => {
  it("shows the workspace's own candidates and the unclaimed pool, and nobody else's", async () => {
    const a = await newOrg();
    const b = await newOrg();

    const mine = await candidate("Mine Nguyen");
    const theirs = await candidate("Theirs Tran");
    await candidate("Unclaimed Le");

    await applyTo(a.id, mine.applicantId);
    await applyTo(b.id, theirs.applicantId);

    // Sourcing still works — the self-registered candidate is visible to both — but a
    // competitor's worked pipeline is not.
    expect(names(await searchCandidates({ orgId: a.id }))).toEqual([
      "Mine Nguyen",
      "Unclaimed Le",
    ]);
    expect(names(await searchCandidates({ orgId: b.id }))).toEqual([
      "Theirs Tran",
      "Unclaimed Le",
    ]);
  });

  it("stops sharing a candidate the moment another workspace claims them", async () => {
    const a = await newOrg();
    const b = await newOrg();
    const person = await candidate("Newly Claimed");

    expect(names(await searchCandidates({ orgId: b.id }))).toContain("Newly Claimed");
    await applyTo(a.id, person.applicantId);
    expect(names(await searchCandidates({ orgId: b.id }))).not.toContain("Newly Claimed");
  });

  it("counts facets over the visible pool, not the whole table", async () => {
    // A count is data. Chips reading "Vietnam 812" to a workspace that may see one candidate
    // would disclose the shape of every competitor's pipeline without showing a name.
    const a = await newOrg();
    const b = await newOrg();
    const theirs = await candidate("Faceted Theirs");
    await db
      .update(applicantProfiles)
      .set({ nationality: "Vietnam" })
      .where(eq(applicantProfiles.id, theirs.applicantId));
    await applyTo(b.id, theirs.applicantId);

    const { facets } = await searchCandidates({ orgId: a.id });
    const vietnam = facets.nationalities.find((f) => f.value === "Vietnam");
    expect(vietnam?.count ?? 0).toBe(0);
  });

  it("does not name another workspace's job titles on a shared candidate", async () => {
    // Two agencies can both be working the same person. `appliedTo` exists so an agency does
    // not re-source someone it already has — not to report a competitor's open roles.
    const a = await newOrg();
    const b = await newOrg();
    const shared = await candidate("Shared Pham");
    await applyTo(a.id, shared.applicantId, "Site Engineer");
    await applyTo(b.id, shared.applicantId, "Secret Role B");

    const { hits } = await searchCandidates({ orgId: a.id });
    const row = hits.find((h) => h.name === "Shared Pham");
    expect(row?.appliedTo).toEqual(["Site Engineer"]);
  });
});

describe("candidate pool — the lawful basis", () => {
  it("keeps the recruiter-facing search working for the consent people actually gave", async () => {
    const org = await newOrg();
    await candidate("Consented Vu");
    // A row the migration never stamped: consent ticked, purpose null. It must still appear,
    // because the form it was ticked on only ever showed the recruitment wording.
    await candidate("Unstamped Do", null);

    expect(names(await searchCandidates({ orgId: org.id }))).toEqual([
      "Consented Vu",
      "Unstamped Do",
    ]);
  });

  it("excludes a candidate who never consented, and one whose retention has run out", async () => {
    const org = await newOrg();
    const refused = await candidate("Refused Hoang");
    await db
      .update(applicantProfiles)
      .set({ pipaConsent: false })
      .where(eq(applicantProfiles.id, refused.applicantId));

    const stale = await candidate("Expired Ly");
    await db
      .update(applicantProfiles)
      .set({ retentionUntil: "2020-01-01" })
      .where(eq(applicantProfiles.id, stale.applicantId));

    const found = names(await searchCandidates({ orgId: org.id }));
    expect(found).not.toContain("Refused Hoang");
    expect(found).not.toContain("Expired Ly");
  });

  it("does not let the recruitment consent stretch to cover AI-assisted matching", async () => {
    // The whole point of the split. The signup wording says "visible to recruiters"; sending
    // a profile to a model provider is a different purpose and a different recipient.
    const org = await newOrg();
    await candidate("Recruiters Only");

    expect(names(await searchCandidates({ orgId: org.id }))).toEqual(["Recruiters Only"]);
    expect(
      await searchCandidates({ orgId: org.id, purpose: PIPA_PURPOSE.AI_ASSISTED })
    ).toMatchObject({ total: 0 });
  });

  it("includes a candidate who did tick the AI box, for both purposes", async () => {
    const org = await newOrg();
    await candidate("Opted In Bui", PIPA_PURPOSE.AI_ASSISTED);

    expect(names(await searchCandidates({ orgId: org.id }))).toEqual(["Opted In Bui"]);
    expect(
      names(await searchCandidates({ orgId: org.id, purpose: PIPA_PURPOSE.AI_ASSISTED }))
    ).toEqual(["Opted In Bui"]);
  });

  it("agrees with the in-memory check on every combination", async () => {
    // Two implementations of one rule drift, and the SQL one drifts silently — so they are
    // asserted against each other rather than each against its own expectations.
    const cases = [
      { pipaConsent: true, consentPurpose: PIPA_PURPOSE.RECRUITMENT },
      { pipaConsent: true, consentPurpose: PIPA_PURPOSE.AI_ASSISTED },
      { pipaConsent: true, consentPurpose: null },
      { pipaConsent: false, consentPurpose: PIPA_PURPOSE.AI_ASSISTED },
    ];

    for (const purpose of [PIPA_PURPOSE.RECRUITMENT, PIPA_PURPOSE.AI_ASSISTED] as const) {
      const org = await newOrg();
      const expected: string[] = [];

      for (const [i, c] of cases.entries()) {
        const name = `Case ${i} ${purpose}`;
        const person = await candidate(name, c.consentPurpose);
        await db
          .update(applicantProfiles)
          .set({ pipaConsent: c.pipaConsent })
          .where(eq(applicantProfiles.id, person.applicantId));
        // Claim them, so this round's pool is only this round's cases. Left unclaimed they
        // would stay in the shared pool and show up in the next purpose's org too — which is
        // the sharing rule working correctly, and would make this comparison meaningless.
        await applyTo(org.id, person.applicantId);

        if (
          hasLawfulBasis(
            { ...c, retentionUntil: null, anonymizedAt: null },
            purpose
          )
        ) {
          expected.push(name);
        }
      }

      expect(names(await searchCandidates({ orgId: org.id, purpose }))).toEqual(
        expected.sort()
      );
    }
  });
});

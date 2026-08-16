import { and, arrayOverlaps, desc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  applicantProfiles,
  applications,
  complianceDocuments,
  jobOpenings,
} from "@/lib/db/schema";
import { complianceWindow } from "@/lib/compliance-window";
import {
  PIPA_PURPOSE,
  lawfulBasisSql,
  orgVisibilitySql,
  type PipaPurpose,
} from "@/lib/pipa";

export type CandidateFilters = {
  /**
   * The workspace asking. **Required in practice** — it is optional only so the platform
   * operator's own tooling can search across tenants deliberately, and every product caller
   * passes it. See `orgVisibilitySql` for what a workspace may see.
   */
  orgId?: number;
  /**
   * What the results will be used for. Defaults to the consent the signup form has always
   * collected; a connector must ask for `AI_ASSISTED`, which most candidates will not have
   * given. Never widen this default — it is the difference between a lawful search and an
   * unlawful one.
   */
  purpose?: PipaPurpose;
  q?: string;
  nationality?: string;
  studyLevel?: string;
  skills?: string[];
  /** "valid" = every tracked document in date; "attention" = something expired or expiring. */
  docs?: "any" | "valid" | "attention";
  page?: number;
  /**
   * Rows to return. Defaults to one screen; the export asks for EXPORT_LIMIT so a
   * recruiter gets the whole filtered set rather than whatever happened to be on page 1.
   */
  pageSize?: number;
};

export type CandidateHit = {
  id: number;
  name: string;
  email: string;
  nationality: string;
  schoolName: string;
  major: string;
  studyLevel: string;
  expectedGraduation: string;
  skills: string[];
  cvLink: string;
  description: string;
  /** Positions this candidate currently sits on, so a recruiter isn't re-sourcing someone. */
  appliedTo: string[];
  docStatus: "none" | "valid" | "expiring" | "expired";
};

export type CandidateSearchResult = {
  hits: CandidateHit[];
  total: number;
  page: number;
  pageSize: number;
  /** Facets for the filter chips, computed over the whole pool rather than the page. */
  facets: {
    nationalities: { value: string; count: number }[];
    studyLevels: { value: string; count: number }[];
    skills: { value: string; count: number }[];
  };
};

export const PAGE_SIZE = 24;

/**
 * Hard ceiling for an export. Far above any realistic agency pool, so it never truncates
 * in practice — but an unbounded query on a user-triggered download is how one click
 * takes the database down.
 */
export const EXPORT_LIMIT = 10_000;

/**
 * Search the candidate pool.
 *
 * Filtering happens in SQL rather than in JS over a full table read: the demo has 37
 * candidates but a real agency pool is the whole point of this screen, and a
 * fetch-everything-then-filter version would quietly become the slowest page in the product.
 *
 * Anonymised candidates are excluded everywhere. Once a PIPA erasure has run, the row still
 * exists to keep foreign keys intact, but the person has asked not to be found — surfacing
 * them in search would defeat the erasure.
 */
export async function searchCandidates(
  filters: CandidateFilters
): Promise<CandidateSearchResult> {
  const db = getDb();
  const page = Math.max(1, filters.page ?? 1);
  const size = Math.min(filters.pageSize ?? PAGE_SIZE, EXPORT_LIMIT);

  // Two gates before any filter the user typed, because both decide whether a row may be
  // read at all rather than whether it matches: the lawful basis for this purpose, and the
  // asking workspace's visibility. Expressed in SQL so the excluded rows are never loaded —
  // filtering them out afterwards would still have read them, and "we fetched it but did not
  // display it" is not a defence anyone accepts.
  const conditions = [lawfulBasisSql(filters.purpose ?? PIPA_PURPOSE.RECRUITMENT)];
  if (filters.orgId !== undefined) {
    conditions.push(orgVisibilitySql(filters.orgId));
  }

  const q = filters.q?.trim();
  if (q) {
    const like = `%${q}%`;
    const term = or(
      ilike(applicantProfiles.name, like),
      ilike(applicantProfiles.schoolName, like),
      ilike(applicantProfiles.schoolNameEn, like),
      ilike(applicantProfiles.major, like),
      ilike(applicantProfiles.description, like),
      // skills is a text[]; array_to_string lets one box search names and skills together,
      // which is how people actually search ("BIM", "台科大", "Nguyen").
      sql`array_to_string(${applicantProfiles.skills}, ' ') ILIKE ${like}`
    );
    if (term) conditions.push(term);
  }
  if (filters.nationality) {
    conditions.push(eq(applicantProfiles.nationality, filters.nationality));
  }
  if (filters.studyLevel) {
    conditions.push(eq(applicantProfiles.studyLevel, filters.studyLevel));
  }
  if (filters.skills?.length) {
    // every selected skill must be present — narrowing, not widening
    for (const s of filters.skills) {
      conditions.push(arrayOverlaps(applicantProfiles.skills, [s]));
    }
  }

  const where = and(...conditions);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applicantProfiles)
    .where(where);

  const rows = await db
    .select({
      id: applicantProfiles.id,
      name: applicantProfiles.name,
      email: applicantProfiles.email,
      nationality: applicantProfiles.nationality,
      schoolName: applicantProfiles.schoolName,
      major: applicantProfiles.major,
      studyLevel: applicantProfiles.studyLevel,
      expectedGraduation: applicantProfiles.expectedGraduation,
      skills: applicantProfiles.skills,
      cvLink: applicantProfiles.cvLink,
      description: applicantProfiles.description,
    })
    .from(applicantProfiles)
    .where(where)
    .orderBy(desc(applicantProfiles.createdAt))
    .limit(size)
    .offset((page - 1) * size);

  const ids = rows.map((r) => r.id);

  // Two small follow-up queries rather than joins: joining applications and documents to the
  // profile row multiplies it out and makes the LIMIT count the wrong thing.
  const [appRows, docRows] = await Promise.all([
    ids.length
      ? db
          .select({
            applicantId: applications.applicantId,
            title: jobOpenings.title,
          })
          .from(applications)
          .leftJoin(jobOpenings, eq(applications.jobOpeningId, jobOpenings.id))
          .where(
            and(
              inArray(applications.applicantId, ids),
              // Only this workspace's own positions. A candidate can sit in two agencies'
              // pipelines at once, and listing the other's job titles here would leak what a
              // competitor is hiring for — through a field whose whole purpose is to stop
              // *this* agency re-sourcing someone it already has.
              filters.orgId === undefined
                ? undefined
                : eq(applications.orgId, filters.orgId)
            )
          )
      : Promise.resolve([] as { applicantId: number; title: string | null }[]),
    ids.length
      ? db
          .select({
            candidateId: complianceDocuments.candidateId,
            expiryDate: complianceDocuments.expiryDate,
          })
          .from(complianceDocuments)
          .where(
            and(
              inArray(complianceDocuments.candidateId, ids),
              ne(complianceDocuments.status, "superseded")
            )
          )
      : Promise.resolve([] as { candidateId: number; expiryDate: string | null }[]),
  ]);

  const appliedBy = new Map<number, string[]>();
  for (const a of appRows) {
    if (!a.title) continue;
    const list = appliedBy.get(a.applicantId) ?? [];
    if (!list.includes(a.title)) list.push(a.title);
    appliedBy.set(a.applicantId, list);
  }

  const { today, cutoff: soon } = complianceWindow();

  const docsBy = new Map<number, CandidateHit["docStatus"]>();
  for (const d of docRows) {
    const current = docsBy.get(d.candidateId) ?? "valid";
    let status: CandidateHit["docStatus"] = "valid";
    if (d.expiryDate) {
      const when = new Date(`${d.expiryDate}T00:00:00Z`);
      if (!Number.isNaN(when.getTime())) {
        if (when < today) status = "expired";
        else if (when <= soon) status = "expiring";
      }
    }
    // worst status wins — one expired ARC makes the candidate a problem regardless of the rest
    const rank = { valid: 0, expiring: 1, expired: 2, none: -1 } as const;
    docsBy.set(d.candidateId, rank[status] > rank[current] ? status : current);
  }

  let hits: CandidateHit[] = rows.map((r) => ({
    ...r,
    appliedTo: appliedBy.get(r.id) ?? [],
    docStatus: docsBy.get(r.id) ?? "none",
  }));

  // Document state lives in a different table with its own row-per-document shape, so it is
  // applied after assembly rather than as another SQL predicate.
  if (filters.docs === "valid") hits = hits.filter((h) => h.docStatus === "valid");
  if (filters.docs === "attention") {
    hits = hits.filter((h) => h.docStatus === "expired" || h.docStatus === "expiring");
  }

  // Facets are built over the same visible pool, not the whole table. A count is data: chips
  // reading "Vietnam 812" to a workspace that may see nine candidates would disclose the
  // size and shape of every competitor's pipeline without showing a single name.
  const facets = await buildFacets(and(...conditions));

  return { hits, total: count, page, pageSize: size, facets };
}

/** Facet counts over the pool this caller may actually see, so the chips show real totals. */
async function buildFacets(visible: ReturnType<typeof and>) {
  const db = getDb();
  const [nat, lvl, skillRows] = await Promise.all([
    db
      .select({ value: applicantProfiles.nationality, count: sql<number>`count(*)::int` })
      .from(applicantProfiles)
      .where(and(visible, ne(applicantProfiles.nationality, "")))
      .groupBy(applicantProfiles.nationality),
    db
      .select({ value: applicantProfiles.studyLevel, count: sql<number>`count(*)::int` })
      .from(applicantProfiles)
      .where(and(visible, ne(applicantProfiles.studyLevel, "")))
      .groupBy(applicantProfiles.studyLevel),
    db
      .select({ value: sql<string>`unnest(${applicantProfiles.skills})`, count: sql<number>`count(*)::int` })
      .from(applicantProfiles)
      .where(visible)
      .groupBy(sql`1`),
  ]);

  const bySize = (a: { count: number }, b: { count: number }) => b.count - a.count;
  return {
    nationalities: nat.sort(bySize),
    studyLevels: lvl.sort(bySize),
    skills: skillRows.sort(bySize).slice(0, 24),
  };
}

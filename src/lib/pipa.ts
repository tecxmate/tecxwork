import { and, eq, exists, gte, inArray, isNull, not, or, sql } from "drizzle-orm";
import { applicantProfiles, applications } from "@/lib/db/schema";

/**
 * The lawful basis for touching a candidate's personal data.
 *
 * Taiwan's 個人資料保護法 (PIPA) does not ask whether data is useful; it asks whether the
 * person was told what it would be used for, and whether the use stayed inside that. So the
 * question this module answers is deliberately narrow: **is this specific use covered by
 * what this specific person agreed to, and is it still in date?**
 *
 * Keeping it in one file is the point. The moment "may we show this candidate?" is decided
 * in three places, two of them drift, and the one that drifts is the one nobody is looking
 * at when a customer is audited.
 */

/**
 * What a candidate has actually been asked.
 *
 * `RECRUITMENT` is the consent the signup form has always collected. Its wording — in all
 * three languages — is "visible to **recruiters** for this recruitment event". That covers
 * an agency's staff reading a profile in order to place someone. Read it literally, because
 * a consent is exactly as wide as its words and no wider.
 *
 * `AI_ASSISTED` is separate for that reason. Handing a profile to a connector sends it to a
 * third-party model provider, usually outside Taiwan — a different purpose, a different
 * recipient, and in practice an international transmission. None of that is inside "visible
 * to recruiters", so it needs its own asking. A checkbox nobody ticked is not a basis, and
 * quietly widening the old consent to cover the new use is the failure this split exists to
 * prevent.
 */
export const PIPA_PURPOSE = {
  RECRUITMENT: "recruitment_placement",
  AI_ASSISTED: "ai_assisted_matching",
} as const;

export type PipaPurpose = (typeof PIPA_PURPOSE)[keyof typeof PIPA_PURPOSE];

/**
 * Purposes a stored consent value covers.
 *
 * A candidate who consented to AI-assisted matching has necessarily consented to being seen
 * by recruiters — that is the surrounding activity, and the AI wording says so. The
 * implication runs one way only: the base consent never grows into the wider one.
 */
const IMPLIES: Record<string, readonly PipaPurpose[]> = {
  [PIPA_PURPOSE.RECRUITMENT]: [PIPA_PURPOSE.RECRUITMENT],
  [PIPA_PURPOSE.AI_ASSISTED]: [PIPA_PURPOSE.AI_ASSISTED, PIPA_PURPOSE.RECRUITMENT],
};

/**
 * What a consent with no recorded purpose means.
 *
 * Several signup paths tick `pipa_consent` without stamping a purpose, and the Phase 5
 * backfill reads those rows as `COALESCE(consent_purpose, 'recruitment_placement')`. That
 * reading is right, and not merely convenient: the signup form has only ever shown one
 * consent wording, so a candidate who ticked it consented to *that*. Treating a null as "no
 * basis" would erase every candidate the platform has ever collected from the very screens
 * built to serve them.
 *
 * The direction that matters: a null never resolves to `AI_ASSISTED`. The wider consent is
 * reachable only by having actually been asked and having actually agreed.
 */
const ASSUMED_PURPOSE: PipaPurpose = PIPA_PURPOSE.RECRUITMENT;

export type ConsentState = {
  pipaConsent: boolean;
  consentPurpose: string | null;
  /** YYYY-MM-DD. Past this date the data should no longer be processed. */
  retentionUntil: string | null;
  anonymizedAt: Date | null;
};

/** Today in YYYY-MM-DD, which is the form `retention_until` is stored in. */
function today(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * May this candidate's data be used for this purpose right now?
 *
 * Four independent ways the answer is no, and each is a genuine refusal rather than a
 * technicality:
 *
 * - **Erased.** The row survives so foreign keys hold, but the person asked to be gone.
 * - **No consent recorded.** Absence of a "no" is not a "yes".
 * - **Consent was for something else.** The narrower consent does not stretch.
 * - **Past retention.** A consent is not perpetual; keeping data past the period the person
 *   was told about is the same violation as never asking.
 */
export function hasLawfulBasis(
  candidate: ConsentState,
  purpose: PipaPurpose,
  now: Date = new Date()
): boolean {
  if (candidate.anonymizedAt) return false;
  if (!candidate.pipaConsent) return false;

  const stored = candidate.consentPurpose ?? ASSUMED_PURPOSE;
  const covered = IMPLIES[stored] ?? [];
  if (!covered.includes(purpose)) return false;

  // A missing retention date means the migration has not stamped this row yet. Treated as
  // in-date rather than expired: refusing here would hide every pre-migration candidate
  // from the agency that collected them, which is a data-loss bug wearing a compliance hat.
  if (candidate.retentionUntil && candidate.retentionUntil < today(now)) return false;

  return true;
}

/**
 * The same rule as SQL, for queries that must not read the excluded rows in the first place.
 *
 * Deliberately a mirror of `hasLawfulBasis` rather than a second opinion — if the two ever
 * disagree, the SQL one wins silently and nobody finds out, so the tests assert them
 * together.
 */
export function lawfulBasisSql(purpose: PipaPurpose, now: Date = new Date()) {
  const accepted = Object.entries(IMPLIES)
    .filter(([, covered]) => covered.includes(purpose))
    .map(([stored]) => stored);

  // `coalesce` rather than a bare comparison, so an unstamped row is read as the consent it
  // was actually given under — and so the SQL matches `hasLawfulBasis` exactly. A null here
  // compared with `= ANY(...)` would yield NULL, which a WHERE clause treats as false, and
  // the whole pool would silently disappear.
  return and(
    isNull(applicantProfiles.anonymizedAt),
    eq(applicantProfiles.pipaConsent, true),
    // `inArray` rather than a hand-written `= ANY(...)`: the template form binds a JS array
    // as a single parameter, which Postgres then tries to read as an array literal and
    // rejects. This expands to one placeholder per value, which is what was meant.
    inArray(
      sql`coalesce(${applicantProfiles.consentPurpose}, ${ASSUMED_PURPOSE})`,
      accepted
    ),
    or(
      isNull(applicantProfiles.retentionUntil),
      gte(applicantProfiles.retentionUntil, today(now))
    )
  );
}

/**
 * Which candidates one workspace may see.
 *
 * Two groups, and the boundary between them is the whole point:
 *
 * 1. **The workspace's own** — anyone who has applied to one of its jobs. Worked pipeline.
 * 2. **The unclaimed pool** — self-registered candidates no workspace has picked up yet.
 *
 * So sourcing still works: an agency can find students who signed up on the public site,
 * which is what the signup funnel is *for*. What it cannot do is browse a competitor's
 * worked pipeline — once a candidate applies to Agency A, Agency B stops seeing them.
 *
 * A legacy application with a null `org_id` does not claim anyone. Those rows predate
 * multi-tenancy, so attributing them to a workspace would be a guess; leaving them
 * unclaimed keeps the single-agency deployment seeing exactly what it sees today.
 */
export function orgVisibilitySql(orgId: number) {
  const claimedByThisOrg = exists(
    sql`(SELECT 1 FROM ${applications}
         WHERE ${applications.applicantId} = ${applicantProfiles.id}
           AND ${applications.orgId} = ${orgId})`
  );

  const claimedByAnyone = exists(
    sql`(SELECT 1 FROM ${applications}
         WHERE ${applications.applicantId} = ${applicantProfiles.id}
           AND ${applications.orgId} IS NOT NULL)`
  );

  return or(claimedByThisOrg, not(claimedByAnyone));
}

/** Retention date for a fresh consent — 18 months, matching the Phase 5 backfill. */
export function retentionDateFrom(start: Date): string {
  const end = new Date(start);
  end.setMonth(end.getMonth() + 18);
  return end.toISOString().slice(0, 10);
}

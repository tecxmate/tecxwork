import { and, desc, eq, inArray, isNull, notInArray } from "drizzle-orm";
import {
  applicantProfiles,
  applications,
  db,
  jobOpenings,
  offers,
  pipelineStages,
  pipelineTemplates,
  users,
} from "@/lib/db";
import { LIVE_STATUSES, effectiveStatus, type OfferStatus } from "@/lib/offers";

export type OfferRow = {
  id: number;
  candidateName: string;
  position: string;
  status: OfferStatus;
  salary: number;
  currency: string;
  salaryPeriod: string;
  startDate: string | null;
  expiresAt: string | null;
  approvedBy: string | null;
  declineReason: string | null;
};

/** Someone sitting in an offer-kind stage with no offer written yet. */
export type PendingApplication = {
  applicationId: number;
  candidateName: string;
  position: string;
};

export type OffersData = {
  offers: OfferRow[];
  awaitingOffer: PendingApplication[];
};

export async function getOffersData(orgId: number): Promise<OffersData> {
  const now = new Date();

  const rows = await db
    .select({
      id: offers.id,
      candidateName: applicantProfiles.name,
      position: jobOpenings.title,
      status: offers.status,
      salary: offers.salary,
      currency: offers.currency,
      salaryPeriod: offers.salaryPeriod,
      startDate: offers.startDate,
      expiresAt: offers.expiresAt,
      approvedBy: users.name,
      declineReason: offers.declineReason,
    })
    .from(offers)
    .innerJoin(applicantProfiles, eq(offers.candidateId, applicantProfiles.id))
    .innerJoin(applications, eq(offers.applicationId, applications.id))
    .innerJoin(jobOpenings, eq(applications.jobOpeningId, jobOpenings.id))
    .leftJoin(users, eq(offers.approvedByUserId, users.id))
    .where(eq(offers.orgId, orgId))
    .orderBy(desc(offers.createdAt));

  // The stages that mean "we are making an offer" — read from the org's own pipeline
  // rather than hardcoded, since stages are user-editable.
  const offerStages = await db
    .select({ id: pipelineStages.id })
    .from(pipelineStages)
    .innerJoin(pipelineTemplates, eq(pipelineStages.templateId, pipelineTemplates.id))
    .where(
      and(
        eq(pipelineTemplates.orgId, orgId),
        eq(pipelineStages.stageKind, "offer"),
        isNull(pipelineStages.archivedAt)
      )
    );

  let awaitingOffer: PendingApplication[] = [];
  if (offerStages.length > 0) {
    // Exclude anyone with an offer still in play AND anyone who already accepted one —
    // an accepted offer means the job is settled, not that they are still waiting for it.
    // A declined, withdrawn or expired offer does not exclude them: those are exactly the
    // people who should get a fresh one.
    const settled: OfferStatus[] = [...LIVE_STATUSES, "accepted"];
    const takenRows = await db
      .select({ applicationId: offers.applicationId })
      .from(offers)
      .where(and(eq(offers.orgId, orgId), inArray(offers.status, settled)));
    const taken = takenRows.map((o) => o.applicationId);

    awaitingOffer = await db
      .select({
        applicationId: applications.id,
        candidateName: applicantProfiles.name,
        position: jobOpenings.title,
      })
      .from(applications)
      .innerJoin(applicantProfiles, eq(applications.applicantId, applicantProfiles.id))
      .innerJoin(jobOpenings, eq(applications.jobOpeningId, jobOpenings.id))
      .where(
        and(
          eq(applications.orgId, orgId),
          inArray(
            applications.stageId,
            offerStages.map((s) => s.id)
          ),
          // Anyone who already has a live offer is not awaiting one.
          taken.length > 0 ? notInArray(applications.id, taken) : undefined
        )
      );
  }

  return {
    offers: rows.map((row) => ({
      ...row,
      status: effectiveStatus(row.status as OfferStatus, row.expiresAt, now),
    })),
    awaitingOffer,
  };
}

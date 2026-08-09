import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { applicantProfiles, applications, db, offers } from "@/lib/db";
import { clientIp, requireAgency } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { effectiveStatus, type OfferStatus } from "@/lib/offers";
import { parseJsonBody } from "@/lib/validation";
import { createOfferSchema } from "@/lib/validation-agency";

export const dynamic = "force-dynamic";

/** True when `err` (or the driver error it wraps) is a unique violation on `constraint`. */
function isUniqueViolation(err: unknown, constraint: string): boolean {
  for (let current: unknown = err, depth = 0; current && depth < 4; depth++) {
    const candidate = current as { constraint?: string; code?: string; cause?: unknown };
    if (candidate.code === "23505" && candidate.constraint === constraint) return true;
    current = candidate.cause;
  }
  return String(err).includes(constraint);
}

/** GET — every offer in the org, newest first. */
export async function GET() {
  const gate = await requireAgency("offer:read");
  if (!gate.ok) return gate.response;

  const rows = await db
    .select({
      id: offers.id,
      applicationId: offers.applicationId,
      candidateName: applicantProfiles.name,
      status: offers.status,
      salary: offers.salary,
      currency: offers.currency,
      salaryPeriod: offers.salaryPeriod,
      startDate: offers.startDate,
      expiresAt: offers.expiresAt,
      approvedAt: offers.approvedAt,
      respondedAt: offers.respondedAt,
      declineReason: offers.declineReason,
      createdAt: offers.createdAt,
    })
    .from(offers)
    .innerJoin(applicantProfiles, eq(offers.candidateId, applicantProfiles.id))
    .where(eq(offers.orgId, gate.actor.orgId))
    .orderBy(desc(offers.createdAt));

  const now = new Date();
  return NextResponse.json({
    offers: rows.map((row) => ({
      ...row,
      // Expiry is applied on read, so a lapsed offer never looks acceptable.
      status: effectiveStatus(row.status as OfferStatus, row.expiresAt, now),
    })),
  });
}

/** POST — draft an offer against an application. */
export async function POST(req: NextRequest) {
  const gate = await requireAgency("offer:write");
  if (!gate.ok) return gate.response;

  const parsed = await parseJsonBody(req, createOfferSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  // The application decides the candidate. Taking a candidateId from the caller would let
  // an offer be filed against a person who never applied for the job.
  const [application] = await db
    .select({
      id: applications.id,
      applicantId: applications.applicantId,
      orgId: applications.orgId,
    })
    .from(applications)
    .where(eq(applications.id, input.applicationId))
    .limit(1);

  if (!application || (application.orgId !== null && application.orgId !== gate.actor.orgId)) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  try {
    const [created] = await db
      .insert(offers)
      .values({
        orgId: gate.actor.orgId,
        applicationId: application.id,
        candidateId: application.applicantId,
        salary: input.salary,
        currency: input.currency,
        salaryPeriod: input.salaryPeriod,
        startDate: input.startDate ?? null,
        probationMonths: input.probationMonths ?? null,
        expiresAt: input.expiresAt ?? null,
        notes: input.notes ?? null,
        createdByUserId: gate.actor.userId,
      })
      .returning({ id: offers.id });

    await logAudit({
      orgId: gate.actor.orgId,
      actorUserId: gate.actor.userId,
      action: "offer.create",
      entityType: "offer",
      entityId: created.id,
      // Amounts are business data, not candidate PII, and are the point of the record.
      metadata: { applicationId: application.id, salary: input.salary, currency: input.currency },
      ip: clientIp(req),
    });

    return NextResponse.json({ offer: { id: created.id } }, { status: 201 });
  } catch (err) {
    // The partial unique index. Two live offers for one application would leave nobody
    // able to say which terms are actually on the table.
    //
    // The constraint name is on the driver error's `constraint` field, not in its message,
    // and drizzle wraps the original in `cause` — so check both rather than the string.
    if (isUniqueViolation(err, "offers_one_live_per_application")) {
      return NextResponse.json(
        { error: "This candidate already has an open offer for this application." },
        { status: 409 }
      );
    }
    throw err;
  }
}

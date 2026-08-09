import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { applicantProfiles, jobOrders, placements } from "@/lib/db/schema";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { parseJsonBody } from "@/lib/validation";
import { createPlacementSchema } from "@/lib/validation-agency";
import { logAudit } from "@/lib/audit";

/**
 * Record a placement — the event the agency actually gets paid on.
 *
 * The client is derived from the job order rather than accepted from the caller: a placement
 * whose client disagrees with its job order's client would corrupt every per-client number
 * on the Clients screen, and there is no reason to let the browser assert it.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const parsed = await parseJsonBody(req, createPlacementSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const db = getDb();

  const [order] = await db
    .select({ id: jobOrders.id, clientId: jobOrders.clientId, title: jobOrders.title })
    .from(jobOrders)
    .where(and(eq(jobOrders.id, body.jobOrderId), eq(jobOrders.orgId, orgId)))
    .limit(1);
  if (!order) return NextResponse.json({ error: "Unknown job order" }, { status: 404 });

  const [candidate] = await db
    .select({ id: applicantProfiles.id })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, body.candidateId))
    .limit(1);
  if (!candidate) return NextResponse.json({ error: "Unknown candidate" }, { status: 404 });

  // Placing the same person into the same order twice is always a mistake, and it would
  // double-count the one number the commercial relationship is judged on.
  const [dupe] = await db
    .select({ id: placements.id })
    .from(placements)
    .where(
      and(
        eq(placements.orgId, orgId),
        eq(placements.candidateId, body.candidateId),
        eq(placements.jobOrderId, body.jobOrderId)
      )
    )
    .limit(1);
  if (dupe) {
    return NextResponse.json(
      { error: "This candidate is already placed on that job order.", placementId: dupe.id },
      { status: 409 }
    );
  }

  const [row] = await db
    .insert(placements)
    .values({
      orgId,
      submissionId: body.submissionId ?? null,
      candidateId: body.candidateId,
      jobOrderId: body.jobOrderId,
      clientId: order.clientId,
      status: body.status,
      startDate: body.startDate ?? null,
      salary: body.salary ?? null,
      feeAmount: body.feeAmount ?? null,
    })
    .returning({ id: placements.id });

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "create",
    entityType: "placement",
    entityId: row.id,
    // field NAMES only — salary and fee are commercially sensitive and the audit trail is
    // deliberately PII/value-free so candidate erasure never has to touch it.
    fieldNames: Object.keys(body),
    metadata: { jobOrderId: body.jobOrderId, clientId: order.clientId },
    ip: clientIp(req),
  });

  return NextResponse.json({ placement: row }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, offers, placements } from "@/lib/db";
import { clientIp, requireAgency } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import {
  hasLapsed,
  isEditable,
  isOfferAction,
  transitionFor,
  type OfferStatus,
} from "@/lib/offers";
import { can } from "@/lib/permissions";
import { parseJsonBody } from "@/lib/validation";
import { offerActionSchema, updateOfferSchema } from "@/lib/validation-agency";

export const dynamic = "force-dynamic";

async function loadOffer(id: number, orgId: number) {
  const [row] = await db
    .select()
    .from(offers)
    .where(and(eq(offers.id, id), eq(offers.orgId, orgId)))
    .limit(1);
  return row ?? null;
}

/**
 * PATCH — change the terms.
 *
 * Only while the offer is a draft. Once someone has approved it their name is attached to
 * a specific salary and start date; letting those be edited afterwards would mean the
 * approval authorised something other than what is on the record.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAgency("offer:write");
  if (!gate.ok) return gate.response;

  const offerId = Number((await params).id);
  if (!Number.isInteger(offerId)) {
    return NextResponse.json({ error: "Invalid offer id" }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, updateOfferSchema);
  if (!parsed.ok) return parsed.response;

  const offer = await loadOffer(offerId, gate.actor.orgId);
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

  if (!isEditable(offer.status as OfferStatus)) {
    return NextResponse.json(
      { error: `An offer can only be edited while it is a draft (this one is ${offer.status}).` },
      { status: 409 }
    );
  }

  const patch = parsed.data;
  await db
    .update(offers)
    .set({
      ...(patch.salary !== undefined ? { salary: patch.salary } : {}),
      ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
      ...(patch.salaryPeriod !== undefined ? { salaryPeriod: patch.salaryPeriod } : {}),
      ...(patch.startDate !== undefined ? { startDate: patch.startDate } : {}),
      ...(patch.probationMonths !== undefined
        ? { probationMonths: patch.probationMonths }
        : {}),
      ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    })
    .where(eq(offers.id, offerId));

  await logAudit({
    orgId: gate.actor.orgId,
    actorUserId: gate.actor.userId,
    action: "offer.update",
    entityType: "offer",
    entityId: offerId,
    fieldNames: Object.keys(patch),
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}

/**
 * POST — move the offer through its lifecycle.
 *
 * One endpoint per verb would duplicate the same guards five times; the transition table
 * in lib/offers.ts is the single place the rules live.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate as an agency member first; the capability depends on which action it is.
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;

  const offerId = Number((await params).id);
  if (!Number.isInteger(offerId)) {
    return NextResponse.json({ error: "Invalid offer id" }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, offerActionSchema);
  if (!parsed.ok) return parsed.response;
  const { action, declineReason } = parsed.data;

  if (!isOfferAction(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const rule = transitionFor(action);

  if (!can(gate.actor.role, rule.capability)) {
    return NextResponse.json(
      {
        error:
          rule.capability === "offer:approve"
            ? "Your role cannot authorise offer terms."
            : "Your role does not allow this action.",
      },
      { status: 403 }
    );
  }

  const offer = await loadOffer(offerId, gate.actor.orgId);
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

  const current = offer.status as OfferStatus;
  if (!rule.from.includes(current)) {
    return NextResponse.json(
      { error: `Cannot ${action} an offer that is ${current}.` },
      { status: 409 }
    );
  }

  // An expiry that has passed beats the stored status. Accepting terms that lapsed
  // yesterday is exactly what the date is there to prevent.
  const now = new Date();
  if (action === "accept" && hasLapsed(offer.expiresAt, now)) {
    return NextResponse.json(
      { error: "This offer expired and can no longer be accepted." },
      { status: 409 }
    );
  }

  if (action === "decline" && !declineReason?.trim()) {
    return NextResponse.json(
      { error: "A reason is required when recording a declined offer." },
      { status: 400 }
    );
  }

  await db
    .update(offers)
    .set({
      status: rule.to,
      ...(action === "approve"
        ? { approvedByUserId: gate.actor.userId, approvedAt: now }
        : {}),
      ...(action === "send" ? { sentAt: now } : {}),
      ...(action === "accept" || action === "decline" ? { respondedAt: now } : {}),
      ...(action === "decline" ? { declineReason: declineReason!.trim() } : {}),
    })
    .where(eq(offers.id, offerId));

  // An accepted offer is where a placement's terms come from. Carrying them across here is
  // the reason the record exists — the salary was previously retyped from memory.
  let placementId: number | null = null;
  if (action === "accept" && offer.jobOrderId) {
    const [placement] = await db
      .insert(placements)
      .values({
        orgId: gate.actor.orgId,
        candidateId: offer.candidateId,
        jobOrderId: offer.jobOrderId,
        offerId: offer.id,
        status: "placed",
        startDate: offer.startDate,
        salary: offer.salary,
      })
      .returning({ id: placements.id });
    placementId = placement.id;
  }

  await logAudit({
    orgId: gate.actor.orgId,
    actorUserId: gate.actor.userId,
    action: `offer.${action}`,
    entityType: "offer",
    entityId: offerId,
    metadata: { from: current, to: rule.to, placementId },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, status: rule.to, placementId });
}

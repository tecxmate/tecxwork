import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { placements } from "@/lib/db/schema";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { parseJsonBody } from "@/lib/validation";
import { updatePlacementSchema } from "@/lib/validation-agency";
import { logAudit } from "@/lib/audit";

/**
 * Move a placement through its lifecycle: started, completed, or fell off.
 *
 * Ending a placement is the commercially loaded action — if it happens inside the guarantee
 * window the fee is clawed back — so an end date and reason are required for the terminal
 * states rather than optional. "They left, we don't know when or why" is not a record worth
 * keeping, and it is exactly what a client will dispute later.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAgency("placement:write");
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const parsed = await parseJsonBody(req, updatePlacementSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const terminal = body.status === "completed" || body.status === "fell_off";
  if (terminal && !body.endDate) {
    return NextResponse.json(
      { error: "An end date is required when a placement ends." },
      { status: 400 }
    );
  }
  if (body.status === "fell_off" && !body.endReason) {
    return NextResponse.json(
      { error: "A reason is required when a placement falls off." },
      { status: 400 }
    );
  }

  const db = getDb();
  const [existing] = await db
    .select({
      id: placements.id,
      status: placements.status,
      guaranteeUntil: placements.guaranteeUntil,
      feeAmount: placements.feeAmount,
    })
    .from(placements)
    .where(and(eq(placements.id, id), eq(placements.orgId, orgId)))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [row] = await db
    .update(placements)
    .set(body)
    .where(and(eq(placements.id, id), eq(placements.orgId, orgId)))
    .returning({ id: placements.id, status: placements.status });

  // Whether the fee is clawed back turns on this, so record it at the moment of the decision
  // rather than recomputing it later from dates that may since have been edited.
  const insideGuarantee =
    body.status === "fell_off" &&
    !!existing.guaranteeUntil &&
    !!body.endDate &&
    body.endDate <= existing.guaranteeUntil;

  await logAudit({
    orgId,
    actorUserId: userId,
    action: body.status ? `placement_${body.status}` : "update",
    entityType: "placement",
    entityId: id,
    fieldNames: Object.keys(body),
    metadata: {
      from: existing.status,
      to: body.status ?? existing.status,
      ...(body.status === "fell_off" ? { insideGuarantee } : {}),
    },
    ip: clientIp(req),
  });

  return NextResponse.json({ placement: row, insideGuarantee });
}

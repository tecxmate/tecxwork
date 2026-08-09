import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { clients, jobOrders } from "@/lib/db/schema";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { parseJsonBody } from "@/lib/validation";
import { createJobOrderSchema } from "@/lib/validation-agency";
import { logAudit } from "@/lib/audit";

/** Open job orders for the org, for the placement form's picker. */
export async function GET(req: NextRequest) {
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;

  const clientId = Number(new URL(req.url).searchParams.get("clientId"));
  const where = Number.isInteger(clientId) && clientId > 0
    ? and(eq(jobOrders.orgId, gate.actor.orgId), eq(jobOrders.clientId, clientId))
    : eq(jobOrders.orgId, gate.actor.orgId);

  const rows = await getDb()
    .select({
      id: jobOrders.id,
      title: jobOrders.title,
      clientId: jobOrders.clientId,
      headcount: jobOrders.headcount,
      status: jobOrders.status,
    })
    .from(jobOrders)
    .where(where);

  return NextResponse.json({ jobOrders: rows });
}

export async function POST(req: NextRequest) {
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;
  const { orgId, userId, recruiterId } = gate.actor;

  const parsed = await parseJsonBody(req, createJobOrderSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  // A client order without a client is meaningless; an internal req must not have one.
  if (body.type === "client_order" && !body.clientId) {
    return NextResponse.json(
      { error: "A client order needs a client." },
      { status: 400 }
    );
  }

  const db = getDb();
  if (body.clientId) {
    const [owner] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, body.clientId), eq(clients.orgId, orgId)))
      .limit(1);
    if (!owner) return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  const [row] = await db
    .insert(jobOrders)
    .values({
      orgId,
      clientId: body.type === "internal_req" ? null : body.clientId ?? null,
      recruiterId,
      jobOpeningId: body.jobOpeningId ?? null,
      type: body.type,
      title: body.title,
      headcount: body.headcount,
      feePct: body.feePct ?? null,
      status: body.status,
    })
    .returning({ id: jobOrders.id, title: jobOrders.title });

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "create",
    entityType: "job_order",
    entityId: row.id,
    fieldNames: Object.keys(body),
    metadata: { clientId: body.clientId ?? null, headcount: body.headcount },
    ip: clientIp(req),
  });

  return NextResponse.json({ jobOrder: row }, { status: 201 });
}

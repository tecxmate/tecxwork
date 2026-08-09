import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { parseJsonBody } from "@/lib/validation";
import { createClientSchema } from "@/lib/validation-agency";
import { logAudit } from "@/lib/audit";

/** List the org's clients (id + name), for the pickers on the job-order and placement forms. */
export async function GET() {
  const gate = await requireAgency("client:read");
  if (!gate.ok) return gate.response;

  const rows = await getDb()
    .select({ id: clients.id, name: clients.name, status: clients.status })
    .from(clients)
    .where(eq(clients.orgId, gate.actor.orgId))
    .orderBy(clients.name);

  return NextResponse.json({ clients: rows });
}

export async function POST(req: NextRequest) {
  const gate = await requireAgency("client:write");
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const parsed = await parseJsonBody(req, createClientSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const db = getDb();

  // A duplicate client is worse than an error: job orders and placements silently split
  // across two rows and every per-client number on the Clients screen goes quietly wrong.
  const [dupe] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.orgId, orgId), eq(clients.name, body.name)))
    .limit(1);
  if (dupe) {
    return NextResponse.json(
      { error: "A client with this name already exists.", clientId: dupe.id },
      { status: 409 }
    );
  }

  const [row] = await db
    .insert(clients)
    .values({
      orgId,
      name: body.name,
      nameZh: body.nameZh,
      industry: body.industry ?? "",
      city: body.city,
      unifiedBusinessNo: body.unifiedBusinessNo,
      defaultFeePct: body.defaultFeePct ?? null,
      status: body.status,
      ownerUserId: userId,
    })
    .returning({ id: clients.id, name: clients.name });

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "create",
    entityType: "client",
    entityId: row.id,
    fieldNames: Object.keys(body),
    ip: clientIp(req),
  });

  return NextResponse.json({ client: row }, { status: 201 });
}

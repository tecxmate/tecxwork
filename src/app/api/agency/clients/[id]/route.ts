import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { clients, contacts } from "@/lib/db/schema";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { parseJsonBody } from "@/lib/validation";
import { updateClientSchema } from "@/lib/validation-agency";
import { logAudit } from "@/lib/audit";

/** One client with its contacts. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const db = getDb();
  // orgId in the WHERE, not just the id — otherwise any agency could read another's client
  // by guessing a number.
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.orgId, gate.actor.orgId)))
    .limit(1);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contactRows = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.clientId, id), eq(contacts.orgId, gate.actor.orgId)));

  return NextResponse.json({ client, contacts: contactRows });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const parsed = await parseJsonBody(req, updateClientSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [row] = await getDb()
    .update(clients)
    .set(body)
    .where(and(eq(clients.id, id), eq(clients.orgId, orgId)))
    .returning({ id: clients.id, name: clients.name });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "update",
    entityType: "client",
    entityId: id,
    fieldNames: Object.keys(body),
    ip: clientIp(req),
  });

  return NextResponse.json({ client: row });
}

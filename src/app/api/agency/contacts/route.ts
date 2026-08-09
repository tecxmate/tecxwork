import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { clients, contacts } from "@/lib/db/schema";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { parseJsonBody } from "@/lib/validation";
import { createContactSchema } from "@/lib/validation-agency";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const parsed = await parseJsonBody(req, createContactSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const db = getDb();

  // Confirm the client belongs to this org before hanging a contact off it — the clientId
  // arrives from the browser and is otherwise a way to write into someone else's account.
  const [owner] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, body.clientId), eq(clients.orgId, orgId)))
    .limit(1);
  if (!owner) return NextResponse.json({ error: "Unknown client" }, { status: 404 });

  const row = await db.transaction(async (tx) => {
    // "Primary" is a single slot; setting a new one has to clear the old, or the UI has to
    // pick arbitrarily between two contacts both claiming to be primary.
    if (body.isPrimary) {
      await tx
        .update(contacts)
        .set({ isPrimary: false })
        .where(and(eq(contacts.clientId, body.clientId), eq(contacts.orgId, orgId)));
    }
    const [inserted] = await tx
      .insert(contacts)
      .values({
        orgId,
        clientId: body.clientId,
        name: body.name,
        title: body.title,
        email: body.email,
        phone: body.phone,
        isPrimary: body.isPrimary,
      })
      .returning({ id: contacts.id, name: contacts.name });
    return inserted;
  });

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "create",
    entityType: "contact",
    entityId: row.id,
    fieldNames: Object.keys(body),
    metadata: { clientId: body.clientId },
    ip: clientIp(req),
  });

  return NextResponse.json({ contact: row }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const [row] = await getDb()
    .delete(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.orgId, orgId)))
    .returning({ id: contacts.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "delete",
    entityType: "contact",
    entityId: id,
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}

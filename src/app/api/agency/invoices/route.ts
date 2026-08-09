import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { applicantProfiles, clients, db, invoiceLines, invoices, placements } from "@/lib/db";
import { clientIp, requireAgency } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { DEFAULT_TAX_RATE_BP, computeTotals, getBillingData, nextInvoiceNumber } from "@/lib/billing";
import { parseJsonBody } from "@/lib/validation";
import { createInvoiceSchema } from "@/lib/validation-agency";

export const dynamic = "force-dynamic";

/** GET — invoices, what is still billable, and the money summary. */
export async function GET() {
  const gate = await requireAgency("invoice:read");
  if (!gate.ok) return gate.response;
  return NextResponse.json(await getBillingData(gate.actor.orgId));
}

/**
 * POST — raise a draft invoice from placements.
 *
 * The amounts come from the placements' recorded fees rather than from the request body.
 * Letting a caller send the amount is how an invoice ends up disagreeing with the
 * placement it is supposed to be billing.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAgency("invoice:write");
  if (!gate.ok) return gate.response;

  const parsed = await parseJsonBody(req, createInvoiceSchema);
  if (!parsed.ok) return parsed.response;
  const { clientId, placementIds, dueDate, notes } = parsed.data;

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.orgId, gate.actor.orgId)))
    .limit(1);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Only this org's placements, only for this client, and only ones carrying a fee.
  const rows = await db
    .select({
      id: placements.id,
      feeAmount: placements.feeAmount,
      candidateName: applicantProfiles.name,
      startDate: placements.startDate,
      clientId: placements.clientId,
    })
    .from(placements)
    .innerJoin(applicantProfiles, eq(placements.candidateId, applicantProfiles.id))
    .where(
      and(
        eq(placements.orgId, gate.actor.orgId),
        inArray(placements.id, placementIds)
      )
    );

  if (rows.length !== placementIds.length) {
    return NextResponse.json(
      { error: "One or more placements were not found." },
      { status: 404 }
    );
  }

  const wrongClient = rows.find((row) => row.clientId !== clientId);
  if (wrongClient) {
    // Billing one client for another's placement is a mistake worth refusing loudly.
    return NextResponse.json(
      { error: "Every placement on an invoice must belong to the same client." },
      { status: 400 }
    );
  }

  const noFee = rows.find((row) => !row.feeAmount);
  if (noFee) {
    return NextResponse.json(
      { error: `${noFee.candidateName}'s placement has no fee recorded.` },
      { status: 400 }
    );
  }

  // Already on a live invoice? The database enforces this too, but catching it here names
  // the person rather than surfacing a constraint violation.
  const existing = await db
    .select({ placementId: invoiceLines.placementId })
    .from(invoiceLines)
    .where(
      and(inArray(invoiceLines.placementId, placementIds), eq(invoiceLines.voided, false))
    );
  if (existing.length > 0) {
    const names = rows
      .filter((row) => existing.some((line) => line.placementId === row.id))
      .map((row) => row.candidateName);
    return NextResponse.json(
      { error: `Already invoiced: ${names.join(", ")}.` },
      { status: 409 }
    );
  }

  const totals = computeTotals(
    rows.map((row) => row.feeAmount!),
    DEFAULT_TAX_RATE_BP
  );

  const number = await nextInvoiceNumber(gate.actor.orgId, new Date().getUTCFullYear());

  const invoiceId = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .insert(invoices)
      .values({
        orgId: gate.actor.orgId,
        clientId,
        number,
        dueDate: dueDate ?? null,
        notes: notes ?? null,
        taxRateBp: DEFAULT_TAX_RATE_BP,
        ...totals,
        createdByUserId: gate.actor.userId,
      })
      .returning({ id: invoices.id });

    await tx.insert(invoiceLines).values(
      rows.map((row) => ({
        invoiceId: invoice.id,
        placementId: row.id,
        description: `Placement fee — ${row.candidateName}${row.startDate ? ` (started ${row.startDate})` : ""}`,
        amount: row.feeAmount!,
      }))
    );

    return invoice.id;
  });

  await logAudit({
    orgId: gate.actor.orgId,
    actorUserId: gate.actor.userId,
    action: "invoice.create",
    entityType: "invoice",
    entityId: invoiceId,
    metadata: { number, clientId, placements: placementIds.length, total: totals.total },
    ip: clientIp(req),
  });

  return NextResponse.json(
    { invoice: { id: invoiceId, number, ...totals } },
    { status: 201 }
  );
}

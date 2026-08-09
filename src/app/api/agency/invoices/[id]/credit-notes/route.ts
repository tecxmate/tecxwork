import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { creditNotes, db, invoices } from "@/lib/db";
import { clientIp, requireAgency } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { computeTotals, creditableRemaining, nextCreditNoteNumber } from "@/lib/billing";
import { parseJsonBody } from "@/lib/validation";
import { createCreditNoteSchema } from "@/lib/validation-agency";

export const dynamic = "force-dynamic";

/**
 * POST — credit an issued or paid invoice.
 *
 * Its own numbered document rather than an edit to the invoice: once a bill has gone to a
 * client, the correction is a separate record both sides can reconcile. Created issued and
 * immutable — a credit note that can be edited after the client has seen it is worth no
 * more than the invoice it was meant to correct.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAgency("invoice:write");
  if (!gate.ok) return gate.response;

  const invoiceId = Number((await params).id);
  if (!Number.isInteger(invoiceId)) {
    return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, createCreditNoteSchema);
  if (!parsed.ok) return parsed.response;
  const { subtotal, reason, issueDate } = parsed.data;

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, gate.actor.orgId)))
    .limit(1);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // A draft was never sent, so there is nothing to correct — void it instead. A voided
  // invoice is likewise not a bill anyone holds.
  if (invoice.status !== "issued" && invoice.status !== "paid") {
    return NextResponse.json(
      {
        error:
          invoice.status === "draft"
            ? "This invoice has not been issued — void it instead of crediting it."
            : `Cannot credit an invoice that is ${invoice.status}.`,
      },
      { status: 409 }
    );
  }

  // Tax follows the invoice's own rate, so the credit reverses what was actually charged
  // rather than whatever the current default happens to be.
  const totals = computeTotals([subtotal], invoice.taxRateBp);

  const remaining = await creditableRemaining(invoiceId);
  if (totals.total > remaining) {
    // Crediting more than was billed would turn an invoice into money owed to the client.
    return NextResponse.json(
      {
        error: `That is more than remains on this invoice (${invoice.currency} ${remaining.toLocaleString()} creditable).`,
        remaining,
      },
      { status: 409 }
    );
  }

  const number = await nextCreditNoteNumber(gate.actor.orgId, new Date().getUTCFullYear());

  const [created] = await db
    .insert(creditNotes)
    .values({
      orgId: gate.actor.orgId,
      invoiceId,
      number,
      issueDate: issueDate ?? new Date().toISOString().slice(0, 10),
      subtotal: totals.subtotal,
      taxRateBp: invoice.taxRateBp,
      taxAmount: totals.taxAmount,
      total: totals.total,
      reason,
      createdByUserId: gate.actor.userId,
    })
    .returning({ id: creditNotes.id });

  await logAudit({
    orgId: gate.actor.orgId,
    actorUserId: gate.actor.userId,
    action: "credit_note.create",
    entityType: "credit_note",
    entityId: created.id,
    metadata: { number, invoice: invoice.number, total: totals.total },
    ip: clientIp(req),
  });

  return NextResponse.json(
    { creditNote: { id: created.id, number, ...totals } },
    { status: 201 }
  );
}

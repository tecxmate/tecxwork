import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, invoiceLines, invoices } from "@/lib/db";
import { clientIp, requireAgency } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { parseJsonBody } from "@/lib/validation";
import { invoiceActionSchema } from "@/lib/validation-agency";

export const dynamic = "force-dynamic";

/** Which statuses each action may be applied from. */
const ALLOWED_FROM: Record<string, readonly string[]> = {
  issue: ["draft"],
  pay: ["issued"],
  // A paid invoice is not voidable — that needs a credit note, which is a different
  // document with its own number. Refusing is more honest than pretending otherwise.
  void: ["draft", "issued"],
};

/**
 * POST — issue, record payment against, or void an invoice.
 *
 * Voiding rather than deleting: an invoice number that has been sent to a client is part
 * of the accounting record even when it was wrong, and a gap in the sequence reads to an
 * accountant as a missing document.
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

  const parsed = await parseJsonBody(req, invoiceActionSchema);
  if (!parsed.ok) return parsed.response;
  const { action, issueDate, paidAmount, voidReason } = parsed.data;

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, gate.actor.orgId)))
    .limit(1);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (!ALLOWED_FROM[action].includes(invoice.status)) {
    return NextResponse.json(
      {
        error:
          action === "void" && invoice.status === "paid"
            ? "A paid invoice cannot be voided — raise a credit note instead."
            : `Cannot ${action} an invoice that is ${invoice.status}.`,
      },
      { status: 409 }
    );
  }

  if (action === "void" && !voidReason?.trim()) {
    // A voided invoice with no reason is an unexplained gap in the sequence.
    return NextResponse.json(
      { error: "A reason is required when voiding an invoice." },
      { status: 400 }
    );
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (action === "void") {
    // The line flags mirror the invoice status so the partial unique index frees these
    // placements to be billed again. Same transaction, because a half-applied void would
    // leave fees that can never be re-invoiced.
    await db.transaction(async (tx) => {
      await tx
        .update(invoices)
        .set({ status: "void", voidReason: voidReason!.trim() })
        .where(eq(invoices.id, invoiceId));
      await tx
        .update(invoiceLines)
        .set({ voided: true })
        .where(eq(invoiceLines.invoiceId, invoiceId));
    });
  } else if (action === "issue") {
    await db
      .update(invoices)
      .set({ status: "issued", issueDate: issueDate ?? today })
      .where(eq(invoices.id, invoiceId));
  } else {
    await db
      .update(invoices)
      .set({
        status: "paid",
        paidAt: now,
        // Defaults to the full amount; a part payment is recorded as what actually arrived.
        paidAmount: paidAmount ?? invoice.total,
      })
      .where(eq(invoices.id, invoiceId));
  }

  await logAudit({
    orgId: gate.actor.orgId,
    actorUserId: gate.actor.userId,
    action: `invoice.${action}`,
    entityType: "invoice",
    entityId: invoiceId,
    metadata: {
      number: invoice.number,
      from: invoice.status,
      amount: action === "pay" ? (paidAmount ?? invoice.total) : invoice.total,
    },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getAgencyActor } from "@/lib/agency-auth";
import { getPlacementLifecycle } from "@/lib/placement-lifecycle";
import { csvResponse, datedFilename, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/**
 * GET /api/agency/export/placements — the placement book, as a spreadsheet.
 *
 * This is the export finance actually asks for: who is placed, what the fee was, and how
 * much of it is still inside a guarantee window and therefore not yet safely earned.
 * Fees stay numeric so the columns can be summed without cleaning the file up first.
 */
export async function GET() {
  const actor = await getAgencyActor("placement:read");
  if (!actor) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  const { rows } = await getPlacementLifecycle(actor.orgId);

  const csv = toCsv(
    [
      "Placement ID",
      "Candidate",
      "Client",
      "Position",
      "Status",
      "Start Date",
      "Probation Until",
      "Guarantee Until",
      "Guarantee Days Left",
      "Inside Guarantee",
      "End Date",
      "End Reason",
      "Salary",
      "Fee",
      "Fee At Risk",
      "Document Status",
      "Soonest Document Expiry",
    ],
    rows.map((p) => [
      p.id,
      p.candidateName,
      p.clientName,
      p.position,
      p.status,
      p.startDate,
      p.probationUntil,
      p.guaranteeUntil,
      p.guaranteeDaysLeft,
      p.inGuarantee ? "yes" : "no",
      p.endDate,
      p.endReason,
      p.salary,
      p.feeAmount,
      // Split out as its own numeric column so the exposure can be summed directly
      // rather than reconstructed with a spreadsheet formula.
      p.inGuarantee ? (p.feeAmount ?? 0) : 0,
      p.docStatus,
      p.soonestDocExpiry,
    ])
  );

  return csvResponse(datedFilename("placements"), csv);
}

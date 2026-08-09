import { NextRequest, NextResponse } from "next/server";
import { getAgencyActor } from "@/lib/agency-auth";
import { EXPORT_LIMIT, searchCandidates } from "@/lib/candidate-search";
import { csvResponse, datedFilename, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/**
 * GET /api/agency/export/candidates — the current candidate search, as a spreadsheet.
 *
 * Takes the same query parameters as the search page, so "export" means "export what I am
 * looking at" rather than "export everything" — which is the only version anyone actually
 * wants, and the only one that respects the filters they just spent time setting.
 */
export async function GET(req: NextRequest) {
  // Same capability as reading the search screen: this is that data, in a file.
  const actor = await getAgencyActor("candidate:read");
  if (!actor) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const one = (key: string) => params.get(key) ?? undefined;
  const docs = one("docs");

  const result = await searchCandidates({
    q: one("q"),
    nationality: one("nationality"),
    studyLevel: one("studyLevel"),
    skills: (one("skills") ?? "").split(",").filter(Boolean),
    docs: docs === "valid" || docs === "attention" ? docs : "any",
    page: 1,
    pageSize: EXPORT_LIMIT,
  });

  if (result.total > result.hits.length) {
    // Never let a truncated file pass as a complete one.
    console.warn(
      JSON.stringify({
        level: "warn",
        message: "candidate export truncated",
        returned: result.hits.length,
        total: result.total,
      })
    );
  }

  const csv = toCsv(
    [
      "Candidate ID",
      "Name",
      "Email",
      "Nationality",
      "School",
      "Major",
      "Study Level",
      "Expected Graduation",
      "Skills",
      "Document Status",
      "Applied To",
      "CV Link",
    ],
    result.hits.map((c) => [
      c.id,
      c.name,
      c.email,
      c.nationality,
      c.schoolName,
      c.major,
      c.studyLevel,
      c.expectedGraduation,
      // one cell, so the column stays readable in a spreadsheet
      c.skills.join("; "),
      c.docStatus,
      c.appliedTo.join("; "),
      c.cvLink,
    ])
  );

  return csvResponse(datedFilename("candidates"), csv);
}

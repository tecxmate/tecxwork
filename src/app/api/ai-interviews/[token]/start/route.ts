import { NextRequest, NextResponse } from "next/server";

import { describeEngineError, interviewerConfigured } from "@/lib/interview/engine";
import { start } from "@/lib/interview/service";
import { CONSENT_DISCLOSURES } from "@/lib/interview/types";

export const dynamic = "force-dynamic";
// Preparing the interview reads the JD and the CV and writes the plan, which is
// the one call the candidate waits on before anything appears.
export const maxDuration = 120;

const ERROR_TEXT: Record<string, { status: number; message: string }> = {
  not_found: { status: 404, message: "This interview link is not valid." },
  expired: { status: 410, message: "This interview link has expired. Ask the recruiter for a new one." },
  already_completed: { status: 409, message: "This interview has already been completed." },
};

/**
 * POST /api/ai-interviews/:token/start  { consent: true }
 *
 * Consent is an explicit field rather than an implied consequence of opening the
 * page. The telemetry this interview collects is personal data, and "they loaded
 * the URL" is not agreement to it.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!interviewerConfigured()) {
    return NextResponse.json({ error: "The AI interviewer is not available." }, { status: 503 });
  }

  const { token } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if ((body as { consent?: unknown })?.consent !== true) {
    return NextResponse.json(
      { error: "Consent is required to begin.", disclosures: CONSENT_DISCLOSURES },
      { status: 400 }
    );
  }

  try {
    const result = await start(token);
    if ("error" in result) {
      const mapped = ERROR_TEXT[result.error] ?? { status: 400, message: "Could not start the interview." };
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    const { status, message } = describeEngineError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

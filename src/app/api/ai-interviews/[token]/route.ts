import { NextResponse } from "next/server";

import { brief } from "@/lib/interview/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai-interviews/:token — the consent screen's data, and the question
 * in flight when the candidate is resuming.
 *
 * Unauthenticated by design: the token IS the credential. It returns only what
 * `brief()` allows out — never the ledger, never what a good answer looks like,
 * and never the planted detail in a false-premise question.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await brief(token);
  if (!data) {
    // Same shape and status for a malformed token and a real one that does not
    // exist, so the endpoint cannot be used to confirm a guess.
    return NextResponse.json({ error: "This interview link is not valid." }, { status: 404 });
  }
  return NextResponse.json(data);
}

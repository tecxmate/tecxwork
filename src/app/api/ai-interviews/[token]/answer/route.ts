import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { describeEngineError, interviewerConfigured } from "@/lib/interview/engine";
import { abandon, submitAnswer } from "@/lib/interview/service";

export const dynamic = "force-dynamic";
// One answer costs: assess, update the ledger, write the follow-up. The last
// answer also writes the report, which is the long one.
export const maxDuration = 180;

/**
 * Telemetry arrives from the candidate's own browser, so every number here is
 * attacker-controlled: a candidate who reads the page source can post whatever
 * makes them look best. That is accepted rather than defended against — it is
 * unfixable in a browser, and the measurements are only ever a flag for a human.
 *
 * What the bounds below DO buy is that forged telemetry cannot corrupt the
 * report: a negative duration or a billion keystrokes would otherwise sail into
 * the scorer and out into a recruiter's screen as nonsense. Clamped, the worst a
 * forger achieves is a clean-looking integrity section — which is exactly what
 * they would get by not sending telemetry at all.
 */
const telemetrySchema = z.object({
  firstKeystrokeMs: z.number().min(0).max(3_600_000).nullable().catch(null),
  elapsedMs: z.number().min(0).max(3_600_000).catch(0),
  chars: z.number().int().min(0).max(100_000).catch(0),
  keystrokes: z.number().int().min(0).max(100_000).catch(0),
  corrections: z.number().int().min(0).max(100_000).catch(0),
  pasteCount: z.number().int().min(0).max(1_000).catch(0),
  pastedChars: z.number().int().min(0).max(100_000).catch(0),
  blurCount: z.number().int().min(0).max(10_000).catch(0),
  blurMs: z.number().min(0).max(3_600_000).catch(0),
  hiddenMs: z.number().min(0).max(3_600_000).catch(0),
  peakCps: z.number().min(0).max(1_000).catch(0),
});

const bodySchema = z.object({
  idx: z.number().int().min(0).max(100),
  answer: z.string().max(8_000),
  telemetry: telemetrySchema,
});

const ERROR_TEXT: Record<string, { status: number; message: string }> = {
  not_found: { status: 404, message: "This interview link is not valid." },
  expired: { status: 410, message: "This interview has expired." },
  not_in_progress: { status: 409, message: "This interview is not in progress." },
  no_such_question: { status: 400, message: "That question is not part of this interview." },
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!interviewerConfigured()) {
    return NextResponse.json({ error: "The AI interviewer is not available." }, { status: 503 });
  }

  const { token } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid answer payload." }, { status: 400 });
  }

  try {
    const result = await submitAnswer({ token, ...parsed.data });
    if ("error" in result) {
      const mapped = ERROR_TEXT[result.error] ?? { status: 400, message: "Could not accept that answer." };
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    const { status, message } = describeEngineError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * DELETE /api/ai-interviews/:token — the candidate stops early.
 *
 * Graded on what was covered and reported as incomplete. A candidate who walks
 * away must not be silently scored as though they had finished, and the consent
 * screen promises exactly this.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    await abandon(token);
  } catch (error) {
    console.error("[ai-interview] abandon", error);
  }
  return NextResponse.json({ ok: true });
}

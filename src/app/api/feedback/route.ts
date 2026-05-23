import { NextRequest, NextResponse } from "next/server";
import { db, feedbackReports } from "@/lib/db";
import { getSession } from "@/lib/auth";

const MAX_SUBJECT = 200;
const MAX_BODY = 5000;
const MAX_LOGS = 30;

const KINDS = new Set(["bug", "feedback", "feature"]);
const SEVERITIES = new Set(["low", "med", "high"]);

const APP_VERSION =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "dev";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const kind = typeof body.kind === "string" && KINDS.has(body.kind) ? body.kind : "bug";
  const severity =
    typeof body.severity === "string" && SEVERITIES.has(body.severity) ? body.severity : "med";

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!subject || !text) {
    return NextResponse.json(
      { error: "Subject and body are required" },
      { status: 400 }
    );
  }
  if (subject.length > MAX_SUBJECT || text.length > MAX_BODY) {
    return NextResponse.json({ error: "Too long" }, { status: 400 });
  }

  const pathname = strOr(body.pathname, 500);
  const userAgent = strOr(req.headers.get("user-agent"), 500);
  const viewport = strOr(body.viewport, 40);
  const screenshotUrl = strOr(body.screenshotUrl, 500);

  // Trust no client log claims beyond a small ring buffer.
  let clientLogs: unknown[] = [];
  if (Array.isArray(body.clientLogs)) {
    clientLogs = body.clientLogs.slice(-MAX_LOGS).map((entry: unknown) => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as Record<string, unknown>;
      return {
        ts: typeof e.ts === "number" ? e.ts : Date.now(),
        type: e.type === "unhandledrejection" ? "unhandledrejection" : "error",
        message: typeof e.message === "string" ? e.message.slice(0, 1000) : "",
        source: typeof e.source === "string" ? e.source.slice(0, 500) : undefined,
        stack: typeof e.stack === "string" ? e.stack.slice(0, 2000) : undefined,
      };
    }).filter(Boolean);
  }

  const [row] = await db
    .insert(feedbackReports)
    .values({
      userId: session.userId,
      userRole: session.role,
      userEmail: session.email,
      kind,
      severity,
      subject,
      body: text,
      pathname,
      userAgent,
      viewport,
      appVersion: APP_VERSION,
      clientLogs,
      screenshotUrl,
    })
    .returning({ id: feedbackReports.id });

  return NextResponse.json({ ok: true, id: row.id });
}

function strOr(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

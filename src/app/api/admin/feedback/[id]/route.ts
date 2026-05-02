import { NextRequest, NextResponse } from "next/server";
import { db, feedbackReports } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

const STATUSES = new Set(["open", "triaged", "resolved"]);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status as "open" | "triaged" | "resolved" | undefined;
  if (typeof status !== "string" || !STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await db
    .update(feedbackReports)
    .set({
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
    })
    .where(eq(feedbackReports.id, id));

  return NextResponse.json({ ok: true });
}

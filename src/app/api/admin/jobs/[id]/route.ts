import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth";
import { db, jobOpenings } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (Number.isNaN(jobId)) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const body = await req.json();
  const action = body.action;
  const moderationNotes =
    typeof body.moderationNotes === "string" ? body.moderationNotes.trim() : "";

  if (!["approve", "reject", "reset"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const [job] = await db
    .select({ id: jobOpenings.id })
    .from(jobOpenings)
    .where(eq(jobOpenings.id, jobId))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(jobOpenings)
    .set({
      moderationStatus:
        action === "approve"
          ? "approved"
          : action === "reject"
            ? "rejected"
            : "draft",
      moderationNotes,
      reviewedAt: new Date(),
    })
    .where(eq(jobOpenings.id, jobId))
    .returning();

  return NextResponse.json({ job: updated });
}

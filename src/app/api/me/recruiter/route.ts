import { NextRequest, NextResponse } from "next/server";
import { db, recruiters } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

/** PUT /api/me/recruiter — recruiter updates their own company profile */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { description, positions, jdLink } = body;

  const updates: Record<string, unknown> = {};
  if (typeof description === "string") updates.description = description.trim();
  if (Array.isArray(positions)) updates.positions = positions;
  if (typeof jdLink === "string") updates.jdLink = jdLink.trim() || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(recruiters)
    .set(updates)
    .where(eq(recruiters.userId, session.userId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  return NextResponse.json({ recruiter: updated });
}

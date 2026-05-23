import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  db,
  professionalProfiles,
  referralRequests,
  referrals,
} from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { parseJsonBody, referralRespondSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session || session.role !== "professional") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, referralRespondSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const [profile] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.userId, session.userId))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const [request] = await db
    .select()
    .from(referralRequests)
    .where(
      and(
        eq(referralRequests.id, requestId),
        eq(referralRequests.professionalId, profile.id),
        eq(referralRequests.status, "pending")
      )
    )
    .limit(1);

  if (!request) {
    return NextResponse.json(
      { error: "Request not found or already responded" },
      { status: 404 }
    );
  }

  if (body.action === "accept") {
    if (!body.endorsement || !body.relationship) {
      return NextResponse.json(
        { error: "Endorsement and relationship required" },
        { status: 400 }
      );
    }

    await db.insert(referrals).values({
      professionalId: profile.id,
      applicantId: request.applicantId,
      relationship: body.relationship,
      endorsement: body.endorsement,
    });

    await db
      .update(professionalProfiles)
      .set({ referralCount: sql`${professionalProfiles.referralCount} + 1` })
      .where(eq(professionalProfiles.id, profile.id));
  }

  await db
    .update(referralRequests)
    .set({
      status: body.action === "accept" ? "accepted" : "rejected",
      respondedAt: new Date(),
    })
    .where(eq(referralRequests.id, requestId));

  return NextResponse.json({ success: true });
}

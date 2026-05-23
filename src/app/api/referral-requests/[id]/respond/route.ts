import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  applicantProfiles,
  db,
  professionalProfiles,
  referralRequests,
  referrals,
} from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { parseJsonBody, referralRespondSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notifications";

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

  if (!profile.isVerified) {
    return NextResponse.json(
      { error: "Professional profile is not verified" },
      { status: 403 }
    );
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

  const [applicant] = await db
    .select({
      name: applicantProfiles.name,
      email: applicantProfiles.email,
    })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, request.applicantId))
    .limit(1);

  if (applicant?.email) {
    await createNotification({
      recipientEmail: applicant.email,
      recipientRole: "applicant",
      type: "system",
      title:
        body.action === "accept"
          ? "Referral request accepted"
          : "Referral request declined",
      message:
        body.action === "accept"
          ? `${profile.name} accepted your referral request.`
          : `${profile.name} declined your referral request.`,
      metadata: {
        requestId,
        professionalId: profile.id,
        applicantId: request.applicantId,
      },
    }).catch((error) => {
      console.error("Failed to create referral response notification", error);
    });
  }

  return NextResponse.json({ success: true });
}

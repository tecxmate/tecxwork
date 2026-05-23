import { NextRequest, NextResponse } from "next/server";
import { getApplicantFromSession } from "@/lib/auth";
import {
  db,
  professionalProfiles,
  referralRequests,
  referrals,
} from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { parseJsonBody, referralRequestSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const applicantSession = await getApplicantFromSession();

  if (!applicantSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(req, referralRequestSchema);
  if (!parsed.ok) return parsed.response;
  const { professionalId, message } = parsed.data;

  const [professional] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.id, professionalId))
    .limit(1);

  if (!professional) {
    return NextResponse.json(
      { error: "Professional not found" },
      { status: 404 }
    );
  }

  const [existingReferral] = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.professionalId, professionalId),
        eq(referrals.applicantId, applicantSession.applicantId)
      )
    )
    .limit(1);

  if (existingReferral) {
    return NextResponse.json(
      { error: "You already have a referral from this professional" },
      { status: 409 }
    );
  }

  const [existingRequest] = await db
    .select()
    .from(referralRequests)
    .where(
      and(
        eq(referralRequests.professionalId, professionalId),
        eq(referralRequests.applicantId, applicantSession.applicantId),
        eq(referralRequests.status, "pending")
      )
    )
    .limit(1);

  if (existingRequest) {
    return NextResponse.json(
      { error: "You already have a pending request to this professional" },
      { status: 409 }
    );
  }

  const [request] = await db
    .insert(referralRequests)
    .values({
      applicantId: applicantSession.applicantId,
      professionalId,
      message,
    })
    .returning();

  return NextResponse.json({ request });
}

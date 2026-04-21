import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  db,
  applicantProfiles,
  professionalProfiles,
  referralRequests,
  referrals,
} from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session || session.role !== "applicant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { professionalId: number; message: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.professionalId || !body.message) {
    return NextResponse.json(
      { error: "Professional ID and message required" },
      { status: 400 }
    );
  }

  const [applicant] = await db
    .select()
    .from(applicantProfiles)
    .where(eq(applicantProfiles.userId, session.userId))
    .limit(1);

  if (!applicant) {
    return NextResponse.json(
      { error: "Applicant profile not found" },
      { status: 404 }
    );
  }

  const [professional] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.id, body.professionalId))
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
        eq(referrals.professionalId, body.professionalId),
        eq(referrals.applicantId, applicant.id)
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
        eq(referralRequests.professionalId, body.professionalId),
        eq(referralRequests.applicantId, applicant.id),
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
      applicantId: applicant.id,
      professionalId: body.professionalId,
      message: body.message,
    })
    .returning();

  return NextResponse.json({ request });
}

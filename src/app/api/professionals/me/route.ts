import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  db,
  professionalProfiles,
  referralRequests,
  referrals,
  applicantProfiles,
} from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "professional") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.userId, session.userId))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const requests = await db
    .select({
      id: referralRequests.id,
      applicantId: referralRequests.applicantId,
      applicantName: applicantProfiles.name,
      applicantEmail: applicantProfiles.email,
      applicantMajor: applicantProfiles.major,
      message: referralRequests.message,
      status: referralRequests.status,
      createdAt: referralRequests.createdAt,
    })
    .from(referralRequests)
    .innerJoin(
      applicantProfiles,
      eq(referralRequests.applicantId, applicantProfiles.id)
    )
    .where(eq(referralRequests.professionalId, profile.id))
    .orderBy(desc(referralRequests.createdAt));

  const myReferrals = await db
    .select({
      id: referrals.id,
      applicantName: applicantProfiles.name,
      applicantEmail: applicantProfiles.email,
      relationship: referrals.relationship,
      endorsement: referrals.endorsement,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .innerJoin(applicantProfiles, eq(referrals.applicantId, applicantProfiles.id))
    .where(eq(referrals.professionalId, profile.id))
    .orderBy(desc(referrals.createdAt));

  return NextResponse.json({
    profile: {
      id: profile.id,
      name: profile.name,
      company: profile.company,
      jobTitle: profile.jobTitle,
      referralCount: profile.referralCount,
      isVerified: profile.isVerified,
    },
    requests,
    referrals: myReferrals,
  });
}

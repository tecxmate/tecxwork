import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db, professionalProfiles } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { parseJsonBody, professionalVerifySchema } from "@/lib/validation";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const professionals = await db
    .select({
      id: professionalProfiles.id,
      name: professionalProfiles.name,
      email: professionalProfiles.email,
      company: professionalProfiles.company,
      jobTitle: professionalProfiles.jobTitle,
      industry: professionalProfiles.industry,
      linkedinUrl: professionalProfiles.linkedinUrl,
      bio: professionalProfiles.bio,
      graduatedFrom: professionalProfiles.graduatedFrom,
      graduationYear: professionalProfiles.graduationYear,
      isVerified: professionalProfiles.isVerified,
      referralCount: professionalProfiles.referralCount,
      createdAt: professionalProfiles.createdAt,
    })
    .from(professionalProfiles)
    .orderBy(desc(professionalProfiles.createdAt));

  return NextResponse.json({ professionals });
}

export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(req, professionalVerifySchema);
  if (!parsed.ok) return parsed.response;

  const [professional] = await db
    .update(professionalProfiles)
    .set({ isVerified: parsed.data.isVerified })
    .where(eq(professionalProfiles.id, parsed.data.id))
    .returning({
      id: professionalProfiles.id,
      name: professionalProfiles.name,
      email: professionalProfiles.email,
      company: professionalProfiles.company,
      jobTitle: professionalProfiles.jobTitle,
      industry: professionalProfiles.industry,
      linkedinUrl: professionalProfiles.linkedinUrl,
      bio: professionalProfiles.bio,
      graduatedFrom: professionalProfiles.graduatedFrom,
      graduationYear: professionalProfiles.graduationYear,
      isVerified: professionalProfiles.isVerified,
      referralCount: professionalProfiles.referralCount,
      createdAt: professionalProfiles.createdAt,
    });

  if (!professional) {
    return NextResponse.json(
      { error: "Professional not found" },
      { status: 404 }
    );
  }

  await createNotification({
    recipientEmail: professional.email,
    recipientRole: "professional",
    type: "system",
    title: professional.isVerified
      ? "Referral profile verified"
      : "Referral profile hidden",
    message: professional.isVerified
      ? "Students can now request referrals from you."
      : "Your referral profile is no longer visible to students.",
    metadata: {
      professionalId: professional.id,
      isVerified: professional.isVerified,
    },
  }).catch((error) => {
    console.error("Failed to create professional verification notification", error);
  });

  return NextResponse.json({ professional });
}

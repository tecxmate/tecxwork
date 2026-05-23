import { NextResponse } from "next/server";
import { db, professionalProfiles } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const professionals = await db
    .select({
      id: professionalProfiles.id,
      name: professionalProfiles.name,
      company: professionalProfiles.company,
      jobTitle: professionalProfiles.jobTitle,
      industry: professionalProfiles.industry,
      bio: professionalProfiles.bio,
      graduatedFrom: professionalProfiles.graduatedFrom,
      graduationYear: professionalProfiles.graduationYear,
      isVerified: professionalProfiles.isVerified,
      referralCount: professionalProfiles.referralCount,
    })
    .from(professionalProfiles)
    .where(eq(professionalProfiles.isVerified, true))
    .orderBy(desc(professionalProfiles.referralCount));

  return NextResponse.json({ professionals });
}

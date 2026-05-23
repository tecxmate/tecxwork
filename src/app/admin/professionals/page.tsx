import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";

import { AppTopBar } from "@/components/app-topbar";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";
import { db, professionalProfiles } from "@/lib/db";

import {
  AdminProfessionalsClient,
  type AdminProfessional,
} from "./professionals-client";

async function getProfessionals(): Promise<AdminProfessional[]> {
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

  return professionals.map((professional) => ({
    ...professional,
    createdAt: professional.createdAt.toISOString(),
  }));
}

export default async function AdminProfessionalsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const professionals = await getProfessionals();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar
        href="/"
        navRole="admin"
        currentPath="/admin/professionals"
      />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <AdminProfessionalsClient initialProfessionals={professionals} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

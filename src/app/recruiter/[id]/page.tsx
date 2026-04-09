import { notFound } from "next/navigation";
import { db, recruiters } from "@/lib/db";
import { eq } from "drizzle-orm";
import { RecruiterDetail } from "./recruiter-detail";

export default async function RecruiterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recruiterId = parseInt(id);
  if (isNaN(recruiterId)) notFound();

  const [recruiter] = await db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      industry: recruiters.industry,
      description: recruiters.description,
      positions: recruiters.positions,
      contactEmail: recruiters.contactEmail,
      jdLink: recruiters.jdLink,
    })
    .from(recruiters)
    .where(eq(recruiters.id, recruiterId));

  if (!recruiter) notFound();

  return <RecruiterDetail recruiter={recruiter} />;
}

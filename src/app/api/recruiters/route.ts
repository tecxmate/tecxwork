import { NextResponse } from "next/server";
import { db, recruiters, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const result = await db
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
    .innerJoin(users, eq(recruiters.userId, users.id))
    .orderBy(recruiters.company);

  return NextResponse.json({ recruiters: result });
}

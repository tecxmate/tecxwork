import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";

import { db, schools } from "@/lib/db";
import { getSchoolAliases } from "@/lib/school-aliases";

export async function GET() {
  const result = await db
    .select({
      code: schools.code,
      nameZh: schools.nameZh,
      nameEn: schools.nameEn,
      city: schools.city,
      schoolType: schools.schoolType,
    })
    .from(schools)
    .orderBy(asc(schools.code));

  return NextResponse.json({
    schools: result.map((school) => ({
      ...school,
      aliases: getSchoolAliases(school.code),
      label: `${school.nameZh} / ${school.nameEn}`,
    })),
  });
}

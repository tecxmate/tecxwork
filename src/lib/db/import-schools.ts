import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";
import { loadTaiwanSchoolDataset } from "@/lib/school-dataset";

async function importSchools() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  const schools = await loadTaiwanSchoolDataset();

  if (schools.length === 0) {
    throw new Error("No school records were parsed from the local dataset");
  }

  await db.delete(schema.schools);

  await db
    .insert(schema.schools)
    .values(
      schools.map((school) => ({
        code: school.code,
        nameZh: school.nameZh,
        nameEn: school.nameEn,
        city: school.city,
        schoolType: school.schoolType,
      }))
    )
    .onConflictDoUpdate({
      target: schema.schools.code,
      set: {
        nameZh: sql`excluded.name_zh`,
        nameEn: sql`excluded.name_en`,
        city: sql`excluded.city`,
        schoolType: sql`excluded.school_type`,
      },
    });

  console.log(`Synced ${schools.length} schools`);
}

importSchools().catch((error) => {
  console.error(error);
  process.exit(1);
});

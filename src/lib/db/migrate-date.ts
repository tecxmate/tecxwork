import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

/**
 * Migrate slots and event_config to VSATW 2026 — V-GEN TRIDENT
 * Date:     Saturday, June 6, 2026
 * Time:     10:00 – 17:30 (Asia/Taipei)
 * Location: MCUT (Ming Chi University of Technology)
 */
async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const client = neon(url);
  const db = drizzle(client, { schema });

  console.log("Migrating event to VSATW 2026 — V-GEN TRIDENT (Jun 6)...");

  await db.update(schema.eventConfig).set({
    eventName: "VSATW 2026 — V-GEN TRIDENT",
    eventDate: new Date("2026-06-06T10:00:00+08:00"),
    location: "MCUT (Ming Chi University of Technology)",
  });

  // Clear old data
  await db.execute(sql`DELETE FROM bookings`);
  await db.execute(sql`DELETE FROM slots`);
  await db.execute(sql`DELETE FROM applicant_slots`);
  console.log("Cleared old slots and bookings");

  // Regenerate slots for each recruiter
  const recs = await db
    .select({ id: schema.recruiters.id })
    .from(schema.recruiters);

  const eventDate = "2026-06-06";
  const startHour = 10;
  const endHour = 17;
  const endMinutes = 30; // 17:30

  for (const rec of recs) {
    const slotValues: {
      recruiterId: number;
      startTime: Date;
      endTime: Date;
    }[] = [];

    for (let h = startHour; h < endHour + 1; h++) {
      for (let m = 0; m < 60; m += 15) {
        // Stop at 17:30
        if (h === endHour && m >= endMinutes) break;
        if (h > endHour) break;

        const start = new Date(
          `${eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`
        );
        const end = new Date(start.getTime() + 15 * 60 * 1000);
        slotValues.push({
          recruiterId: rec.id,
          startTime: start,
          endTime: end,
        });
      }
    }

    await db.insert(schema.slots).values(slotValues);
    console.log(
      `Recreated ${slotValues.length} slots for recruiter ${rec.id}`
    );
  }

  console.log("Migration complete!");
}

migrate().catch(console.error);

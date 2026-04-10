import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq, sql } from "drizzle-orm";

/**
 * Migrate slots and event_config from old event date to 2026-06-10.
 * Keeps recruiters, users, and bookings intact.
 */
async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const client = neon(url);
  const db = drizzle(client, { schema });

  console.log("Migrating event to 2026-06-10...");

  // Update event config
  await db
    .update(schema.eventConfig)
    .set({
      eventName: "TecxWork 2026",
      eventDate: new Date("2026-06-10T09:00:00+08:00"),
    });

  // Drop existing slots (unbooked ones have no foreign key constraint)
  // Need to delete bookings first that reference slots (there shouldn't be any real bookings yet)
  await db.execute(sql`DELETE FROM bookings`);
  await db.execute(sql`DELETE FROM slots`);
  await db.execute(sql`DELETE FROM applicant_slots`);
  console.log("Cleared old slots and bookings");

  // Regenerate slots for each recruiter on June 10
  const recs = await db.select({ id: schema.recruiters.id }).from(schema.recruiters);
  const eventDate = "2026-06-10";

  for (const rec of recs) {
    const slotValues: { recruiterId: number; startTime: Date; endTime: Date }[] = [];
    for (let h = 9; h < 17; h++) {
      for (let m = 0; m < 60; m += 15) {
        const start = new Date(
          `${eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`
        );
        const end = new Date(start.getTime() + 15 * 60 * 1000);
        slotValues.push({ recruiterId: rec.id, startTime: start, endTime: end });
      }
    }
    await db.insert(schema.slots).values(slotValues);
    console.log(`Recreated ${slotValues.length} slots for recruiter ${rec.id}`);
  }

  console.log("Migration complete!");
}

migrate().catch(console.error);

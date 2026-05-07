import { count, eq } from "drizzle-orm";

import { db, slots } from "@/lib/db";
import { getEventBranding } from "@/lib/event-branding";

async function buildDefaultSlotValues(recruiterId: number) {
  // Use the live event branding (matches /api/admin/timeframe) and format
  // the event day in Asia/Taipei so an early-morning Taipei start doesn't
  // roll back a day on UTC.
  const branding = await getEventBranding();
  const eventDate = branding.date
    .toLocaleString("sv-SE", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .slice(0, 10);

  const slotValues: { recruiterId: number; startTime: Date; endTime: Date }[] =
    [];
  const dur = branding.slotDuration;
  const slotInterval = dur + branding.bufferMinutes;
  const startMinutes = branding.startHour * 60 + branding.startMinute;
  const endMinutes = branding.endHour * 60 + branding.endMinute;

  for (let t = startMinutes; t + dur <= endMinutes; t += slotInterval) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    const start = new Date(
      `${eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )}:00+08:00`
    );
    const end = new Date(start.getTime() + dur * 60 * 1000);
    slotValues.push({ recruiterId, startTime: start, endTime: end });
  }

  return slotValues;
}

export async function ensureDefaultRecruiterSlots(recruiterId: number) {
  const [existing] = await db
    .select({ count: count() })
    .from(slots)
    .where(eq(slots.recruiterId, recruiterId));

  if ((existing?.count ?? 0) > 0) {
    return;
  }

  const slotValues = await buildDefaultSlotValues(recruiterId);
  if (slotValues.length > 0) {
    await db.insert(slots).values(slotValues);
  }
}

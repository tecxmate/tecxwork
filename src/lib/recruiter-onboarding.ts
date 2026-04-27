import { count, eq } from "drizzle-orm";

import { EVENT_CONFIG } from "@/lib/data";
import { db, slots } from "@/lib/db";

function buildDefaultSlotValues(recruiterId: number) {
  const dateObj = EVENT_CONFIG.date;
  const eventDate = `${dateObj.getFullYear()}-${String(
    dateObj.getMonth() + 1
  ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
  const slotValues: { recruiterId: number; startTime: Date; endTime: Date }[] =
    [];
  const startHour: number = EVENT_CONFIG.startHour;
  const endHour: number = EVENT_CONFIG.endHour;
  const endMinutes: number = EVENT_CONFIG.endMinutes;
  const slotDuration: number = EVENT_CONFIG.slotDuration;

  for (let h = startHour; h < endHour + 1; h++) {
    for (let m = 0; m < 60; m += slotDuration) {
      if (h === endHour && m >= endMinutes) break;
      if (h > endHour) break;

      const start = new Date(
        `${eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(
          2,
          "0"
        )}:00+08:00`
      );
      const end = new Date(start.getTime() + slotDuration * 60 * 1000);
      slotValues.push({ recruiterId, startTime: start, endTime: end });
    }
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

  const slotValues = buildDefaultSlotValues(recruiterId);
  if (slotValues.length > 0) {
    await db.insert(slots).values(slotValues);
  }
}

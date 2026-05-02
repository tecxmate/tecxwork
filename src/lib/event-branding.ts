import "server-only";
import { cache } from "react";
import { db, eventConfig } from "@/lib/db";
import { EVENT_CONFIG } from "@/lib/data";

export type EventBranding = {
  name: string;
  emailEventName: string;
  tagline: string;
  subtitle: string;
  organizer: string;
  organizerShort: string;
  hostedAt: string;
  hostedAtFull: string;
  date: Date;
  endDate: Date;
  displayDate: string;
  displayYear: string;
  location: string;
  timezone: string;
  slotDuration: number;
  startHour: number;
  endHour: number;
  endMinutes: number;
  enableNewsletterOptIn: boolean;
};

/**
 * Fetches event branding fields from the DB and merges with static
 * EVENT_CONFIG defaults. Cached per request via React `cache()`.
 *
 * Use this on the server (metadata, emails, server components) so the
 * admin panel can update event branding for the next job fair without
 * redeploying.
 */
export const getEventBranding = cache(async (): Promise<EventBranding> => {
  try {
    const [row] = await db
      .select({
        eventName: eventConfig.eventName,
        emailEventName: eventConfig.emailEventName,
        tagline: eventConfig.tagline,
        organizer: eventConfig.organizer,
        organizerShort: eventConfig.organizerShort,
        hostedAt: eventConfig.hostedAt,
        hostedAtFull: eventConfig.hostedAtFull,
        displayDate: eventConfig.displayDate,
        displayYear: eventConfig.displayYear,
        eventDate: eventConfig.eventDate,
        eventEndDate: eventConfig.eventEndDate,
        location: eventConfig.location,
      })
      .from(eventConfig)
      .limit(1);

    if (!row) return { ...EVENT_CONFIG };

    return {
      ...EVENT_CONFIG,
      name: row.eventName ?? EVENT_CONFIG.name,
      emailEventName: row.emailEventName ?? EVENT_CONFIG.emailEventName,
      tagline: row.tagline ?? EVENT_CONFIG.tagline,
      organizer: row.organizer ?? EVENT_CONFIG.organizer,
      organizerShort: row.organizerShort ?? EVENT_CONFIG.organizerShort,
      hostedAt: row.hostedAt ?? EVENT_CONFIG.hostedAt,
      hostedAtFull: row.hostedAtFull ?? EVENT_CONFIG.hostedAtFull,
      displayDate: row.displayDate ?? EVENT_CONFIG.displayDate,
      displayYear: row.displayYear ?? EVENT_CONFIG.displayYear,
      date: row.eventDate ?? EVENT_CONFIG.date,
      endDate: row.eventEndDate ?? EVENT_CONFIG.endDate,
      location: row.location ?? EVENT_CONFIG.location,
    };
  } catch (err) {
    console.error("getEventBranding: falling back to static EVENT_CONFIG", err);
    return { ...EVENT_CONFIG };
  }
});

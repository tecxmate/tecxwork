/**
 * iCalendar (RFC 5545) generation for interview bookings.
 *
 * An interview that exists only in this app is an interview people miss. Handing them a
 * .ics file puts it in the calendar they actually look at, with an alarm, without asking
 * anyone to integrate a calendar API or grant OAuth scopes.
 *
 * Everything is emitted in UTC (`...Z`) so there is no VTIMEZONE block to get wrong and
 * no ambiguity about what "10:00" means to a candidate in Vietnam and a recruiter in
 * Taipei. Calendar clients render it in the viewer's own zone, which is what both want.
 */

/** RFC 5545 §3.3.11 — backslash, semicolon and comma are delimiters; newlines become \n. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * RFC 5545 §3.1 — content lines are folded at 75 **octets**, not characters.
 *
 * Company and candidate names here are routinely Chinese or Vietnamese, so folding must
 * count UTF-8 bytes while only ever breaking between whole code points: splitting a
 * multi-byte character across a fold produces mojibake in every calendar client.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let bytes = 0;
  // The first line may use 75 octets; continuation lines spend one on the leading space.
  let limit = 75;

  // Iterating the string directly walks code points, so surrogate pairs stay intact.
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
      limit = 74;
    }
    current += char;
    bytes += size;
  }
  out.push(current);

  return out.join("\r\n ");
}

/** iCalendar UTC timestamp: 20260606T020000Z */
function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export type CalendarEvent = {
  /**
   * Stable across re-sends for the same booking. A client that sees a UID it already has
   * updates that event instead of creating a duplicate — which is what makes a
   * reschedule or a cancellation actually land rather than pile up.
   */
  uid: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  /** Bumped when the event is re-issued; clients ignore a lower sequence than they hold. */
  sequence?: number;
  status?: "CONFIRMED" | "CANCELLED";
  /** Minutes before start to alert. Omit for no alarm. */
  reminderMinutes?: number;
};

/**
 * Build a complete .ics document.
 *
 * METHOD:PUBLISH rather than REQUEST: REQUEST asks the client to render an RSVP card and
 * expects the ORGANIZER address to line up with the sending mailbox. Ours doesn't — mail
 * goes out from the platform address, not the recruiter's — and a mismatch makes some
 * clients drop the invitation entirely. PUBLISH means "here is an event, save it", which
 * is exactly what we want and is honoured everywhere.
 */
export function buildCalendar(events: CalendarEvent[], stamp: Date): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TECXWORK//Interview Scheduling//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(event.uid)}`,
      `DTSTAMP:${formatUtc(stamp)}`,
      `DTSTART:${formatUtc(event.start)}`,
      `DTEND:${formatUtc(event.end)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `SEQUENCE:${event.sequence ?? 0}`,
      `STATUS:${event.status ?? "CONFIRMED"}`
    );

    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);

    if (event.reminderMinutes && event.reminderMinutes > 0) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `TRIGGER:-PT${event.reminderMinutes}M`,
        `DESCRIPTION:${escapeText(event.title)}`,
        "END:VALARM"
      );
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // RFC 5545 requires CRLF line endings; a bare \n is rejected outright by Outlook.
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Stable per booking, so a reissued invite updates rather than duplicates. */
export function bookingUid(bookingId: number): string {
  return `booking-${bookingId}@tecxwork.com`;
}

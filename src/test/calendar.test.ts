import { describe, expect, it } from "vitest";
import { buildCalendar, bookingUid } from "@/lib/calendar";

const STAMP = new Date("2026-06-01T00:00:00Z");

const base = {
  uid: bookingUid(7),
  title: "Interview — Yang Luck",
  start: new Date("2026-06-06T02:00:00Z"), // 10:00 Taipei
  end: new Date("2026-06-06T02:15:00Z"),
};

const ics = (over = {}) => buildCalendar([{ ...base, ...over }], STAMP);

/** Unfold continuation lines the way a calendar client does, then split. */
const unfold = (text: string) => text.replace(/\r\n /g, "").split("\r\n");

describe("ics — structure a calendar client will accept", () => {
  it("uses CRLF line endings", () => {
    const text = ics();
    expect(text).toContain("\r\n");
    // A bare \n anywhere is a parse error in Outlook
    expect(text.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("wraps the event in a complete VCALENDAR with a product id and version", () => {
    const lines = unfold(ics());
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("VERSION:2.0");
    expect(lines).toContain("METHOD:PUBLISH");
    expect(lines.filter((l) => l === "BEGIN:VEVENT")).toHaveLength(1);
    expect(lines.at(-2)).toBe("END:VCALENDAR");
  });

  it("writes times as UTC so the zone is never ambiguous", () => {
    const lines = unfold(ics());
    expect(lines).toContain("DTSTART:20260606T020000Z");
    expect(lines).toContain("DTEND:20260606T021500Z");
    expect(lines).toContain("DTSTAMP:20260601T000000Z");
  });

  it("keeps the uid stable per booking so a resend updates instead of duplicating", () => {
    expect(bookingUid(7)).toBe("booking-7@tecxwork.com");
    expect(unfold(ics())).toContain("UID:booking-7@tecxwork.com");
  });

  it("carries the sequence and status a client needs to supersede an earlier copy", () => {
    const lines = unfold(ics({ sequence: 2, status: "CANCELLED" }));
    expect(lines).toContain("SEQUENCE:2");
    expect(lines).toContain("STATUS:CANCELLED");
  });

  it("emits an alarm when a reminder is asked for, and none when it is not", () => {
    expect(unfold(ics({ reminderMinutes: 60 }))).toContain("TRIGGER:-PT60M");
    expect(ics()).not.toContain("BEGIN:VALARM");
    expect(ics({ reminderMinutes: 0 })).not.toContain("BEGIN:VALARM");
  });

  it("puts several bookings in one file for a whole interview day", () => {
    const text = buildCalendar(
      [base, { ...base, uid: bookingUid(8), start: new Date("2026-06-06T02:30:00Z") }],
      STAMP
    );
    expect(unfold(text).filter((l) => l === "BEGIN:VEVENT")).toHaveLength(2);
  });
});

describe("ics — escaping", () => {
  it("escapes the delimiters that would otherwise split a field", () => {
    const lines = unfold(ics({ title: "Yang Luck, Inc; interview", description: "a\\b" }));
    expect(lines).toContain("SUMMARY:Yang Luck\\, Inc\\; interview");
    expect(lines).toContain("DESCRIPTION:a\\\\b");
  });

  it("folds newlines into the literal \\n a client renders as a line break", () => {
    const lines = unfold(ics({ description: "Bring your ARC.\nRoom 402." }));
    expect(lines).toContain("DESCRIPTION:Bring your ARC.\\nRoom 402.");
    // the raw newline must not survive as an actual line break
    expect(lines).not.toContain("Room 402.");
  });
});

describe("ics — line folding", () => {
  it("folds content lines past 75 octets", () => {
    const raw = ics({ title: "A".repeat(200) });
    for (const line of raw.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it("never splits a multi-byte character, so Chinese company names survive", () => {
    // Each of these is 3 bytes in UTF-8, so the fold boundary lands mid-character
    // unless folding counts octets but breaks on code points.
    const name = "台灣積體電路製造股份有限公司".repeat(6);
    const text = ics({ title: name });

    for (const line of text.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    // The decisive check: unfolding must return exactly the original name.
    const summary = unfold(text).find((l) => l.startsWith("SUMMARY:"));
    expect(summary).toBe(`SUMMARY:${name}`);
    expect(text).not.toContain("�");
  });

  it("leaves short lines untouched", () => {
    expect(unfold(ics())).toContain("SUMMARY:Interview — Yang Luck");
  });
});

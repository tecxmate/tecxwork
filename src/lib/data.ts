export const EVENT_CONFIG = {
  name: "VSATW JOB FAIR 2026: V-GEN TRIDENT",
  emailEventName: "VSATW JOB FAIR 2026: V-GEN TRIDENT",
  tagline: "The Vietnamese Generation — Versatile in Talent, Value in Action",
  subtitle: "Career Fair",
  organizer: "Vietnamese Student Association in Taiwan",
  organizerShort: "VSATW",
  hostedAt: "NTUT (Taipei Tech)",
  hostedAtFull: "National Taipei University of Science and Technology",
  date: new Date("2026-06-06T10:00:00+08:00"),
  displayDate: "June 6, 2026",
  displayYear: "2026",
  endDate: new Date("2026-06-06T17:30:00+08:00"),
  location: "NTUT (Taipei Tech), Taipei",
  timezone: "Asia/Taipei",
  slotDuration: 15,
  startHour: 10,
  endHour: 17,
  endMinutes: 30,
  /** Feature flag: show newsletter opt-in on student registration */
  enableNewsletterOptIn: false,
} as const;

export const INDUSTRIES = [
  "All",
  "Technology",
  "Finance",
  "Semiconductor",
  "Manufacturing",
  "Consulting",
  "Healthcare",
  "E-Commerce",
] as const;

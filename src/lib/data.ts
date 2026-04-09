export const EVENT_CONFIG = {
  name: "TecxMeet 2026",
  subtitle: "University Recruitment Fair",
  date: new Date("2026-05-15T09:00:00+08:00"),
  endDate: new Date("2026-05-15T17:00:00+08:00"),
  location: "National Taiwan University, Taipei",
  timezone: "Asia/Taipei",
  slotDuration: 15,
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

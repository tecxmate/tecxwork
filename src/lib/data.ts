export const EVENT_CONFIG = {
  name: "TecxWork 2026",
  subtitle: "University Recruitment Fair",
  date: new Date("2026-06-10T09:00:00+08:00"),
  endDate: new Date("2026-06-10T17:00:00+08:00"),
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

import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---- Enums ----

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "recruiter",
  "applicant",
]);
export const slotStatusEnum = pgEnum("slot_status", [
  "available",
  "booked",
  "blocked",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "accepted",
  "rejected",
  "waitlisted",
  "cancelled",
]);
export const bookingDirectionEnum = pgEnum("booking_direction", [
  "applicant_books_recruiter",
  "recruiter_books_applicant",
]);
export const eventModeEnum = pgEnum("event_mode", [
  "applicant_books_recruiter",
  "recruiter_books_applicant",
  "both",
]);

// ---- Users (admin + recruiter only) ----

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("recruiter"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Recruiters (profile linked to a user) ----

export const recruiters = pgTable("recruiters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  company: text("company").notNull(),
  industry: text("industry").notNull(),
  description: text("description").notNull().default(""),
  positions: text("positions").array().notNull().default([]),
  contactEmail: text("contact_email").notNull(),
  jdLink: text("jd_link"),
  interviewerCount: integer("interviewer_count").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Job openings (each position has its own JD link) ----

export const jobOpenings = pgTable("job_openings", {
  id: serial("id").primaryKey(),
  recruiterId: integer("recruiter_id")
    .notNull()
    .references(() => recruiters.id),
  title: text("title").notNull(),
  jdLink: text("jd_link"),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Applicant profiles (linked to a user account) ----

export const applicantProfiles = pgTable("applicant_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  major: text("major").notNull().default(""),
  skills: text("skills").array().notNull().default([]),
  cvLink: text("cv_link").notNull(),
  description: text("description").notNull().default(""),
  pipaConsent: boolean("pipa_consent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Recruiter slots (interview windows offered by recruiter — Mode A) ----

export const slots = pgTable(
  "slots",
  {
    id: serial("id").primaryKey(),
    recruiterId: integer("recruiter_id")
      .notNull()
      .references(() => recruiters.id),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    interviewerNumber: integer("interviewer_number").notNull().default(1),
    status: slotStatusEnum("status").notNull().default("available"),
  },
  (table) => [
    uniqueIndex("unique_recruiter_slot_interviewer").on(
      table.recruiterId,
      table.startTime,
      table.interviewerNumber
    ),
  ]
);

// ---- Applicant slots (availability offered by applicant — Mode B) ----

export const applicantSlots = pgTable(
  "applicant_slots",
  {
    id: serial("id").primaryKey(),
    applicantId: integer("applicant_id")
      .notNull()
      .references(() => applicantProfiles.id),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: slotStatusEnum("status").notNull().default("available"),
  },
  (table) => [
    uniqueIndex("unique_applicant_slot").on(
      table.applicantId,
      table.startTime
    ),
  ]
);

// ---- Bookings (supports both directions) ----

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  direction: bookingDirectionEnum("direction")
    .notNull()
    .default("applicant_books_recruiter"),
  /** recruiter slot ID (Mode A) — null when Mode B */
  slotId: integer("slot_id").references(() => slots.id),
  /** applicant slot ID (Mode B) — null when Mode A */
  applicantSlotId: integer("applicant_slot_id").references(
    () => applicantSlots.id
  ),
  recruiterId: integer("recruiter_id")
    .notNull()
    .references(() => recruiters.id),
  applicantId: integer("applicant_id").references(() => applicantProfiles.id),
  /** Denormalized for Mode A where applicant has no profile */
  position: text("position"),
  /** The time the student requested — slot assigned on acceptance */
  requestedTime: timestamp("requested_time", { withTimezone: true }),
  applicantName: text("applicant_name").notNull(),
  applicantEmail: text("applicant_email").notNull(),
  cvLink: text("cv_link").notNull(),
  pipaConsent: boolean("pipa_consent").notNull().default(false),
  status: bookingStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Allowed recruiter email domains (admin whitelist) ----

export const allowedDomains = pgTable("allowed_domains", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull().unique(),
  company: text("company").notNull(),
  industry: text("industry").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Event config (single-row table for global settings) ----

export const eventConfig = pgTable("event_config", {
  id: serial("id").primaryKey(),
  eventName: text("event_name").notNull().default("V-GEN TRIDENT 2026"),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  location: text("location")
    .notNull()
    .default("National Taiwan University, Taipei"),
  slotDurationMinutes: integer("slot_duration_minutes").notNull().default(15),
  startHour: integer("start_hour").notNull().default(10),
  endHour: integer("end_hour").notNull().default(17),
  endMinute: integer("end_minute").notNull().default(30),
  mode: eventModeEnum("mode").notNull().default("both"),
  modeLocked: boolean("mode_locked").notNull().default(false),
  emergencyFallback: boolean("emergency_fallback").notNull().default(false),
  fallbackUrl: text("fallback_url"),
});

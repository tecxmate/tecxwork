import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
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
  location: text("location").notNull().default(""),
  employmentType: text("employment_type").notNull().default(""),
  workplaceType: text("workplace_type").notNull().default(""),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").notNull().default("TWD"),
  salaryPeriod: text("salary_period").notNull().default("month"),
  seniority: text("seniority").notNull().default(""),
  languageRequirement: text("language_requirement").notNull().default(""),
  visaSupport: text("visa_support").notNull().default(""),
  applicationDeadline: text("application_deadline"),
  description: text("description").notNull().default(""),
  responsibilities: text("responsibilities").notNull().default(""),
  requirements: text("requirements").notNull().default(""),
  benefits: text("benefits").notNull().default(""),
  moderationStatus: text("moderation_status").notNull().default("draft"),
  moderationNotes: text("moderation_notes").notNull().default(""),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
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
  phone: text("phone").notNull().default(""),
  nationality: text("nationality").notNull().default(""),
  schoolCode: text("school_code").notNull().default(""),
  schoolName: text("school_name").notNull().default(""),
  schoolNameEn: text("school_name_en").notNull().default(""),
  major: text("major").notNull().default(""),
  studyLevel: text("study_level").notNull().default(""),
  studyYear: text("study_year").notNull().default(""),
  expectedGraduation: text("expected_graduation").notNull().default(""),
  jobSeekingStatus: text("job_seeking_status").notNull().default(""),
  workAuthorization: text("work_authorization").notNull().default(""),
  skills: text("skills").array().notNull().default([]),
  preferredLocations: text("preferred_locations").array().notNull().default([]),
  preferredIndustries: text("preferred_industries").array().notNull().default([]),
  workExperiences: jsonb("work_experiences").notNull().default([]),
  cvLink: text("cv_link").notNull(),
  linkedinUrl: text("linkedin_url").notNull().default(""),
  portfolioUrl: text("portfolio_url").notNull().default(""),
  description: text("description").notNull().default(""),
  pipaConsent: boolean("pipa_consent").notNull().default(false),
  wantsNewsletter: boolean("wants_newsletter").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Taiwan schools (bilingual source of truth for applicant signup) ----

export const schools = pgTable(
  "schools",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    nameZh: text("name_zh").notNull(),
    nameEn: text("name_en").notNull().default(""),
    city: text("city").notNull().default(""),
    schoolType: text("school_type").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("schools_code_idx").on(table.code)]
);

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

// ---- Password reset codes ----

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Email verification codes (signup flow) ----

export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verified: boolean("verified").notNull().default(false),
  failedAttempts: integer("failed_attempts").notNull().default(0),
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
    .default("NTUT (Taipei Tech), Taipei"),
  slotDurationMinutes: integer("slot_duration_minutes").notNull().default(15),
  startHour: integer("start_hour").notNull().default(10),
  endHour: integer("end_hour").notNull().default(17),
  endMinute: integer("end_minute").notNull().default(30),
  mode: eventModeEnum("mode").notNull().default("both"),
  onboardingMode: text("onboarding_mode").notNull().default("full"),
  jobModerationEnabled: boolean("job_moderation_enabled")
    .notNull()
    .default(true),
  modeLocked: boolean("mode_locked").notNull().default(false),
  emergencyFallback: boolean("emergency_fallback").notNull().default(false),
  fallbackUrl: text("fallback_url"),
});

// ---- External job listings (crawled from 104/1111) ----

export const jobSourceEnum = pgEnum("job_source", ["104", "1111"]);
export const jobTypeEnum = pgEnum("job_type", ["full_time", "part_time", "internship", "contract"]);

export const externalJobs = pgTable(
  "external_jobs",
  {
    id: serial("id").primaryKey(),
    source: jobSourceEnum("source").notNull(),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location").notNull(),
    snippet: text("snippet").notNull().default(""),
    jobType: jobTypeEnum("job_type"),
    salary: text("salary"),
    externalUrl: text("external_url").notNull(),
    isVietnameseJob: boolean("is_vietnamese_job").notNull().default(true),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("unique_external_job").on(table.source, table.externalId),
  ]
);

export const crawlLogs = pgTable("crawl_logs", {
  id: serial("id").primaryKey(),
  source: jobSourceEnum("source").notNull(),
  status: text("status").notNull(),
  jobsFound: integer("jobs_found").notNull().default(0),
  jobsInserted: integer("jobs_inserted").notNull().default(0),
  jobsUpdated: integer("jobs_updated").notNull().default(0),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

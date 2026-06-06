import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
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
  "reschedule_proposed",
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
export const notificationTypeEnum = pgEnum("notification_type", [
  "booking_pending",
  "booking_accepted",
  "booking_rejected",
  "booking_waitlisted",
  "booking_cancelled",
  "booking_reschedule_proposed",
  "interview_reminder",
  "system",
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
  // Multi-tenant FK. Phase 0: nullable; backfilled then set NOT NULL. See events table below.
  eventId: integer("event_id").references(() => events.id),
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
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  galleryUrls: text("gallery_urls").array().notNull().default([]),
  interviewerCount: integer("interviewer_count").notNull().default(1),
  // Admin-controlled directory pin. NULL = unpinned (sorts after pinned ones).
  // Lower rank shows first; ranks are 0-based and dense among pinned recruiters.
  pinnedRank: integer("pinned_rank"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Job openings (each position has its own JD link) ----

export const jobOpenings = pgTable("job_openings", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  recruiterId: integer("recruiter_id")
    .notNull()
    .references(() => recruiters.id),
  title: text("title").notNull(),
  jobCategory: text("job_category").notNull().default(""),
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
  certifications: jsonb("certifications").notNull().default([]),
  cvLink: text("cv_link").notNull(),
  linkedinUrl: text("linkedin_url").notNull().default(""),
  portfolioUrl: text("portfolio_url").notNull().default(""),
  avatarUrl: text("avatar_url"),
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
    eventId: integer("event_id").references(() => events.id),
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
    eventId: integer("event_id").references(() => events.id),
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
  eventId: integer("event_id").references(() => events.id),
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
  jobOpeningId: integer("job_opening_id").references(() => jobOpenings.id),
  applicantId: integer("applicant_id").references(() => applicantProfiles.id),
  /** Denormalized for Mode A where applicant has no profile */
  position: text("position"),
  /** The time the student requested — slot assigned on acceptance */
  requestedTime: timestamp("requested_time", { withTimezone: true }),
  /** Recruiter-proposed alternate time; set when status = reschedule_proposed */
  proposedTime: timestamp("proposed_time", { withTimezone: true }),
  /** Email of the recruiter who proposed the alternate time (audit trail) */
  proposedByEmail: text("proposed_by_email"),
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
  eventId: integer("event_id").references(() => events.id),
  domain: text("domain").notNull().unique(),
  company: text("company").notNull(),
  industry: text("industry").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Exact recruiter email approvals (admin-reviewed signup allow-list) ----

export const recruiterEmailApprovals = pgTable("recruiter_email_approvals", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  email: text("email").notNull().unique(),
  company: text("company").notNull(),
  industry: text("industry").notNull(),
  status: text("status").notNull().default("approved"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true })
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
  failedAttempts: integer("failed_attempts").notNull().default(0),
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
  // Phase 0: one config row per event (was a global singleton). Nullable until backfilled.
  eventId: integer("event_id").references(() => events.id),
  eventName: text("event_name").notNull().default("VSATW JOB FAIR 2026: V-GEN TRIDENT"),
  emailEventName: text("email_event_name")
    .notNull()
    .default("VSATW JOB FAIR 2026: V-GEN TRIDENT"),
  tagline: text("tagline")
    .notNull()
    .default("The Vietnamese Generation — Versatile in Talent, Value in Action"),
  organizer: text("organizer")
    .notNull()
    .default("Vietnamese Student Association in Taiwan"),
  organizerShort: text("organizer_short").notNull().default("VSATW"),
  hostedAt: text("hosted_at")
    .notNull()
    .default("MCUT (Ming Chi University of Technology)"),
  hostedAtFull: text("hosted_at_full")
    .notNull()
    .default("Ming Chi University of Technology"),
  displayDate: text("display_date").notNull().default("June 6, 2026"),
  displayYear: text("display_year").notNull().default("2026"),
  eventEndDate: timestamp("event_end_date", { withTimezone: true }),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  location: text("location")
    .notNull()
    .default("MCUT (Ming Chi University of Technology)"),
  slotDurationMinutes: integer("slot_duration_minutes").notNull().default(15),
  bufferMinutes: integer("buffer_minutes").notNull().default(0),
  startHour: integer("start_hour").notNull().default(10),
  startMinute: integer("start_minute").notNull().default(0),
  endHour: integer("end_hour").notNull().default(17),
  endMinute: integer("end_minute").notNull().default(30),
  mode: eventModeEnum("mode").notNull().default("both"),
  onboardingMode: text("onboarding_mode").notNull().default("full"),
  jobModerationEnabled: boolean("job_moderation_enabled")
    .notNull()
    .default(true),
  studentCancellationEnabled: boolean("student_cancellation_enabled")
    .notNull()
    .default(false),
  modeLocked: boolean("mode_locked").notNull().default(false),
  emergencyFallback: boolean("emergency_fallback").notNull().default(false),
  fallbackUrl: text("fallback_url"),
  homepageImages: text("homepage_images").array().notNull().default([]),
  browsePageImages: text("browse_page_images").array().notNull().default([]),
  jobsPageImages: text("jobs_page_images").array().notNull().default([]),
  jobsPageHeroEnabled: boolean("jobs_page_hero_enabled")
    .notNull()
    .default(false),
  heroOverlayEnabled: boolean("hero_overlay_enabled").notNull().default(true),
  salaryCurrencyOptions: text("salary_currency_options")
    .array()
    .notNull()
    .default(["TWD", "VND", "USD"]),
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

// ---- Booking reschedule audit trail ----

export const bookingRescheduleLogs = pgTable("booking_reschedule_logs", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id),
  recruiterId: integer("recruiter_id").references(() => recruiters.id),
  applicantId: integer("applicant_id").references(() => applicantProfiles.id),
  actorRole: userRoleEnum("actor_role").notNull(),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  statusBefore: bookingStatusEnum("status_before"),
  statusAfter: bookingStatusEnum("status_after"),
  requestedTime: timestamp("requested_time", { withTimezone: true }),
  proposedTime: timestamp("proposed_time", { withTimezone: true }),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---- Booking action audit trail ----

export const bookingActionLogs = pgTable(
  "booking_action_logs",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.id),
    recruiterId: integer("recruiter_id").references(() => recruiters.id),
    applicantId: integer("applicant_id").references(() => applicantProfiles.id),
    actorRole: userRoleEnum("actor_role").notNull(),
    actorUserId: integer("actor_user_id").references(() => users.id),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    statusBefore: bookingStatusEnum("status_before"),
    statusAfter: bookingStatusEnum("status_after"),
    requestedTime: timestamp("requested_time", { withTimezone: true }),
    proposedTime: timestamp("proposed_time", { withTimezone: true }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("booking_action_logs_booking_created_idx").on(
      table.bookingId,
      table.createdAt
    ),
    index("booking_action_logs_created_idx").on(table.createdAt),
    index("booking_action_logs_action_idx").on(table.action),
    index("booking_action_logs_actor_idx").on(
      table.actorRole,
      table.actorEmail
    ),
  ]
);

// ---- Email tracking ----

export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // booking_confirmation, rejection, rescheduling, verification, etc.
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject"),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Push subscriptions ----

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- In-app notifications ----

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientEmail: text("recipient_email").notNull(),
  recipientRole: userRoleEnum("recipient_role").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Feedback / bug reports ----

export const feedbackKindEnum = pgEnum("feedback_kind", ["bug", "feedback", "feature"]);
export const feedbackSeverityEnum = pgEnum("feedback_severity", ["low", "med", "high"]);
export const feedbackStatusEnum = pgEnum("feedback_status", ["open", "triaged", "resolved"]);

// ---- Multi-tenancy: organizations, events, memberships, participants ----
// Phase 0 (additive). Tenant model: Organization → Events. Event-scoped data carries
// a nullable `event_id` (backfilled, then NOT NULL). Applicants stay global (Talent
// Passport) and join an event via `event_participants`. See
// docs/wiki/decisions/2026-06-06-multi-tenant-architecture.md.

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "active",
  "archived",
]);

export const membershipRoleEnum = pgEnum("membership_role", [
  "org_admin",
  "recruiter",
]);

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id),
  // Globally unique — addresses the event at /e/[slug].
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  status: eventStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    orgId: integer("org_id")
      .notNull()
      .references(() => organizations.id),
    role: membershipRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("unique_membership_user_org").on(table.userId, table.orgId),
  ]
);

export const eventParticipants = pgTable(
  "event_participants",
  {
    id: serial("id").primaryKey(),
    applicantId: integer("applicant_id")
      .notNull()
      .references(() => applicantProfiles.id),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("unique_event_participant").on(
      table.applicantId,
      table.eventId
    ),
  ]
);

export const feedbackReports = pgTable("feedback_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userRole: userRoleEnum("user_role"),
  userEmail: text("user_email"),
  kind: feedbackKindEnum("kind").notNull().default("bug"),
  severity: feedbackSeverityEnum("severity").notNull().default("med"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  pathname: text("pathname"),
  userAgent: text("user_agent"),
  viewport: text("viewport"),
  appVersion: text("app_version"),
  clientLogs: jsonb("client_logs").notNull().default([]),
  screenshotUrl: text("screenshot_url"),
  status: feedbackStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

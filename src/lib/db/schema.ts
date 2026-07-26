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
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  company: text("company").notNull(),
  industry: text("industry").notNull(),
  // Multi-tenancy: the org (tenant) this recruiter belongs to (Phase 1).
  orgId: integer("org_id").references(() => orgs.id),
  // Demo agency model: "subsidiary" / "client" companies vs the "agency" itself.
  clientKind: text("client_kind").notNull().default("client"),
  // Trust signal: employer vetted (agency-verified in the demo; admin-settable
  // in the real product). Defaults false so ordinary sign-ups are NOT verified.
  verified: boolean("verified").notNull().default(false),
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
  recruiterId: integer("recruiter_id")
    .notNull()
    .references(() => recruiters.id),
  orgId: integer("org_id").references(() => orgs.id),
  title: text("title").notNull(),
  jobCategory: text("job_category").notNull().default(""),
  // Agency model: the client company Yang Luck is placing this role for, and
  // whether it's a group subsidiary vs an external client ("" for normal jobs).
  clientCompany: text("client_company").notNull().default(""),
  clientIndustry: text("client_industry").notNull().default(""),
  clientKind: text("client_kind").notNull().default(""),
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

// ---- Applications / ATS pipeline (Yang Luck demo) ----
// One row per candidate applying to a job; drives the recruiter kanban board.
// Distinct from `bookings` (interview-slot machinery) on purpose.

export const pipelineStageEnum = pgEnum("pipeline_stage", [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
]);

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    jobOpeningId: integer("job_opening_id")
      .notNull()
      .references(() => jobOpenings.id),
    applicantId: integer("applicant_id")
      .notNull()
      .references(() => applicantProfiles.id),
    // Denormalized for fast board queries (a job always belongs to one recruiter).
    recruiterId: integer("recruiter_id")
      .notNull()
      .references(() => recruiters.id),
    orgId: integer("org_id").references(() => orgs.id),
    // Legacy fixed stage (Phase 0). Kept as a fallback for rows without stageId.
    stage: pipelineStageEnum("stage").notNull().default("applied"),
    // Configurable pipeline (Phase 1b): authoritative stage → pipeline_stages.
    stageId: integer("stage_id").references(() => pipelineStages.id),
    stageUpdatedAt: timestamp("stage_updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    notes: text("notes").notNull().default(""),
    // Mocked "AI CV screening" score (0-100) for the demo badge — not real inference.
    aiScore: integer("ai_score"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("unique_application_job_applicant").on(
      table.jobOpeningId,
      table.applicantId
    ),
    index("applications_recruiter_stage_idx").on(
      table.recruiterId,
      table.stage
    ),
  ]
);

// ---- ATS multi-tenancy + RBAC + audit (Phase 1) ----

export const memberRoleEnum = pgEnum("member_role", [
  "admin",
  "account_manager",
  "recruiter",
  "hiring_manager",
  "interviewer",
  "coordinator",
  "viewer",
]);

// A tenant. An agency (Yang Luck) or a corporate employer. Everything ATS is
// scoped to one org; the agency's client companies live as data WITHIN its org.
export const orgs = pgTable("orgs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  kind: text("kind").notNull().default("agency"), // agency | employer
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// A user's role within an org. Replaces the single recruiters.userId link as the
// authorization source of truth (a user can belong to one org here; multi-org
// per user is a later extension).
export const memberships = pgTable(
  "memberships",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => orgs.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    role: memberRoleEnum("role").notNull().default("recruiter"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("unique_org_member").on(table.orgId, table.userId)]
);

// Append-only PII/access audit trail. Stores field NAMES + non-PII metadata,
// never raw PII values, so candidate erasure never has to touch this table.
// Grant the app DB role INSERT+SELECT only (no UPDATE/DELETE) once RLS lands.
export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").references(() => orgs.id),
    actorUserId: integer("actor_user_id").references(() => users.id),
    actorType: text("actor_type").notNull().default("user"), // user | system | job
    action: text("action").notNull(), // view | create | update | move_stage | export | ...
    entityType: text("entity_type").notNull(), // application | candidate | job | ...
    entityId: integer("entity_id"),
    fieldNames: text("field_names").array(),
    metadata: jsonb("metadata"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_log_org_entity_idx").on(
      table.orgId,
      table.entityType,
      table.entityId,
      table.createdAt
    ),
    index("audit_log_org_actor_idx").on(
      table.orgId,
      table.actorUserId,
      table.createdAt
    ),
  ]
);

// ---- Configurable pipeline (Phase 1b) ----
// Stages are ROWS, not a fixed enum, so each org (later each job) can shape its
// own pipeline. `stage_kind` is the stable, coarse label used for cross-org
// reporting even when display names differ.

export const stageKindEnum = pgEnum("stage_kind", [
  "sourced",
  "screened",
  "internal_submit",
  "client_submit",
  "interview",
  "offer",
  "placed",
  "onboarding",
  "started",
  "rejected",
]);

export const pipelineTemplates = pgTable("pipeline_templates", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => orgs.id),
  name: text("name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pipelineStages = pgTable(
  "pipeline_stages",
  {
    id: serial("id").primaryKey(),
    templateId: integer("template_id")
      .notNull()
      .references(() => pipelineTemplates.id),
    name: text("name").notNull(),
    stageKind: stageKindEnum("stage_kind").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isTerminal: boolean("is_terminal").notNull().default(false),
    slaDays: integer("sla_days"),
  },
  (table) => [
    index("pipeline_stages_template_idx").on(table.templateId, table.sortOrder),
  ]
);

// Append-only stage history — the source of truth for funnel + time-in-stage
// reporting. Never derive those from the mutable applications.stage_id cache.
export const applicationStageTransitions = pgTable(
  "application_stage_transitions",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").references(() => orgs.id),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id),
    fromStageId: integer("from_stage_id").references(() => pipelineStages.id),
    toStageId: integer("to_stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    movedByUserId: integer("moved_by_user_id").references(() => users.id),
    movedAt: timestamp("moved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("app_stage_transitions_app_idx").on(
      table.applicationId,
      table.movedAt
    ),
  ]
);

// ---- Agency CRM (Phase 2 — a LAYER mirroring the recruiter/job/application
// model into the Bullhorn-style client → job_order → submission → placement
// spine. The student-facing recruiter/job/application model is unchanged. ----

// A client company the agency places into (mirrors a non-agency recruiter).
export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => orgs.id),
    // Source mirror: the recruiter row this client was backfilled from.
    recruiterId: integer("recruiter_id").references(() => recruiters.id),
    name: text("name").notNull(),
    nameZh: text("name_zh"),
    industry: text("industry").notNull().default(""),
    city: text("city"),
    unifiedBusinessNo: text("unified_business_no"), // 統一編號
    ownerUserId: integer("owner_user_id").references(() => users.id),
    defaultFeePct: integer("default_fee_pct"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("unique_client_recruiter").on(table.recruiterId)]
);

// A hiring contact at a client.
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => orgs.id),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const jobOrderTypeEnum = pgEnum("job_order_type", [
  "client_order",
  "internal_req",
]);

// The opening the agency is filling (mirrors a job_opening). type distinguishes
// an agency client order from a corporate internal requisition.
export const jobOrders = pgTable(
  "job_orders",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => orgs.id),
    clientId: integer("client_id").references(() => clients.id), // null for internal_req
    recruiterId: integer("recruiter_id").references(() => recruiters.id),
    jobOpeningId: integer("job_opening_id").references(() => jobOpenings.id), // source mirror
    type: jobOrderTypeEnum("type").notNull().default("client_order"),
    title: text("title").notNull(),
    headcount: integer("headcount").notNull().default(1),
    feePct: integer("fee_pct"),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("unique_joborder_jobopening").on(table.jobOpeningId)]
);

// A candidate presented to a job order (mirrors an application). The pipeline
// spine between candidate and job order.
export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => orgs.id),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => applicantProfiles.id),
    jobOrderId: integer("job_order_id")
      .notNull()
      .references(() => jobOrders.id),
    applicationId: integer("application_id").references(() => applications.id), // source mirror
    stageId: integer("stage_id").references(() => pipelineStages.id),
    submittedByUserId: integer("submitted_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("unique_submission_application").on(table.applicationId),
    uniqueIndex("unique_submission_candidate_joborder").on(
      table.candidateId,
      table.jobOrderId
    ),
  ]
);

// A confirmed hire, created from a winning submission.
export const placements = pgTable(
  "placements",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => orgs.id),
    submissionId: integer("submission_id").references(() => submissions.id),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => applicantProfiles.id),
    jobOrderId: integer("job_order_id")
      .notNull()
      .references(() => jobOrders.id),
    clientId: integer("client_id").references(() => clients.id),
    status: text("status").notNull().default("placed"),
    startDate: text("start_date"),
    salary: integer("salary"),
    feeAmount: integer("fee_amount"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("unique_placement_submission").on(table.submissionId)]
);

// ---- Migrant-labor compliance documents (Phase 3) ----
// Taiwan MOL requires a valid work permit + ARC (居留證) for the whole
// employment; ARC renewal must be filed ≥30 days before expiry. Expiry status
// is computed live from expiry_date (see getAgencyCrm) — no cron needed.

export const docTypeEnum = pgEnum("doc_type", [
  "passport",
  "visa",
  "arc", // 居留證
  "work_permit", // 工作許可
  "medical",
  "contract",
  "diploma",
  "criminal_record",
  "health_insurance",
]);

export const complianceDocuments = pgTable(
  "compliance_documents",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => orgs.id),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => applicantProfiles.id),
    placementId: integer("placement_id").references(() => placements.id),
    docType: docTypeEnum("doc_type").notNull(),
    docNumber: text("doc_number"),
    issuingAuthority: text("issuing_authority"),
    issueDate: text("issue_date"),
    expiryDate: text("expiry_date"), // YYYY-MM-DD
    status: text("status").notNull().default("valid"),
    fileId: text("file_id"),
    verifiedByUserId: integer("verified_by_user_id").references(() => users.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("unique_candidate_doc_type").on(table.candidateId, table.docType),
    index("compliance_docs_expiry_idx").on(table.orgId, table.expiryDate),
  ]
);

// ---- Collaboration: activity feed + scorecards (Phase 4b) ----

// Per-application timeline: recruiter notes + stage-change events.
export const activity = pgTable(
  "activity",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => orgs.id),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id),
    type: text("type").notNull().default("note"), // note | stage_change
    body: text("body").notNull().default(""),
    authorUserId: integer("author_user_id").references(() => users.id),
    authorName: text("author_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("activity_application_idx").on(table.applicationId, table.createdAt)]
);

export const scorecardRecommendationEnum = pgEnum("scorecard_recommendation", [
  "strong_no",
  "no",
  "yes",
  "strong_yes",
]);

// Structured interview evaluation of one candidate.
export const scorecards = pgTable(
  "scorecards",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => orgs.id),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id),
    interviewerUserId: integer("interviewer_user_id").references(() => users.id),
    interviewerName: text("interviewer_name"),
    recommendation: scorecardRecommendationEnum("recommendation").notNull(),
    ratings: jsonb("ratings"), // [{ attribute, rating (1-4) }]
    comment: text("comment").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("scorecards_application_idx").on(table.applicationId, table.createdAt)]
);

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

// ---- Exact recruiter email approvals (admin-reviewed signup allow-list) ----

export const recruiterEmailApprovals = pgTable("recruiter_email_approvals", {
  id: serial("id").primaryKey(),
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

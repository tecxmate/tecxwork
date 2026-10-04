/**
 * Public demo company seed — the account linked from the TECXWORK article.
 *
 * Everything here is fictional. No real person, company or CV appears in this file.
 *
 * TWO SAFETY PROPERTIES, both deliberate, and the reason this seed exists separately
 * from seed-yang-luck.ts (which models the AGENCY side):
 *
 *   1. clientKind stays "client" — never "agency".
 *   2. orgId stays null.
 *
 * `resolveAgencyActor` in src/lib/agency-auth.ts requires BOTH clientKind === "agency"
 * AND orgId != null. Failing either one makes it return null, so this account cannot
 * reach the agency surface: /dashboard/candidates redirects away, and clients,
 * placements, compliance and billing never render.
 *
 * That matters because `searchCandidates` has NO tenant condition — it searches every
 * applicant_profiles row on the deployment. An agency-kind demo login published on the
 * open web would hand anyone the entire candidate pool, including real CVs and
 * compliance-document status. A client-kind account sees only what was submitted to its
 * own job openings, which is exactly the tour the article walks through.
 *
 * WHERE TO RUN IT: a demo deployment with its own database. Not production. The password
 * below is published, so anyone can sign in and write — post a job, accept a booking. On
 * a shared deployment those writes reach real students via the public job board.
 *
 *   DEMO_SEED=1 DATABASE_URL="<demo db>" npx tsx src/lib/db/seed-demo-company.ts
 *
 * Idempotent: every insert is onConflictDoNothing, so re-running tops up without
 * duplicating. To wipe between demos, see scripts/reset-demo-data.sql.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

/** Same URL-based switch as src/lib/db, so the demo world seeds locally too. */
function connect(url: string) {
  const host = new URL(url).hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  return isLocal
    ? drizzlePg(new Pool({ connectionString: url }), { schema })
    : drizzleNeon(neon(url), { schema });
}

export const DEMO_EMAIL = "demo@tecxwork.com";
export const DEMO_PASSWORD = "TecxworkDemo2026";

const COMPANY = {
  name: "TECXWORK Demo Co.",
  industry: "Manufacturing",
  description:
    "A fictional company that exists only so visitors can try the recruiter dashboard. " +
    "Every candidate, application and interview below is invented sample data.",
  contactEmail: DEMO_EMAIL,
};

const JOBS = [
  {
    title: "Production Engineer",
    category: "tech",
    seniority: "entry_level",
    salaryMin: 42000,
    salaryMax: 58000,
    description: "Sample posting. Owns line efficiency on an assembly cell.",
    responsibilities:
      "Monitor line output, investigate stoppages, and propose process changes with the shift supervisor.",
    requirements:
      "Mechanical or industrial engineering background. Mandarin working proficiency; English a plus.",
  },
  {
    title: "Export Sales Coordinator",
    category: "business",
    seniority: "entry_level",
    salaryMin: 38000,
    salaryMax: 50000,
    description: "Sample posting. Handles overseas customer orders end to end.",
    responsibilities:
      "Process orders, coordinate shipping documents, and keep customers updated on lead times.",
    requirements:
      "Business or trade background. English required; Vietnamese is a strong plus.",
  },
  {
    title: "Quality Assurance Technician",
    category: "tech",
    seniority: "entry_level",
    salaryMin: 36000,
    salaryMax: 46000,
    description: "Sample posting. Inspects incoming material and finished goods.",
    responsibilities:
      "Run sampling inspections, log defects, and escalate recurring faults to engineering.",
    requirements: "Attention to detail and willingness to work a rotating shift.",
  },
] as const;

/** Fictional candidates. Invented names, invented schools, placeholder CV links. */
const CANDIDATES = [
  { name: "Tran Minh Khoi", nationality: "Vietnam", major: "Mechanical Engineering", studyLevel: "bachelor", skills: ["AutoCAD", "SolidWorks", "Mandarin"], job: 0, stage: "interview" },
  { name: "Nguyen Thi Lan", nationality: "Vietnam", major: "International Trade", studyLevel: "bachelor", skills: ["Excel", "English", "Logistics"], job: 1, stage: "offer" },
  { name: "Pham Duc Anh", nationality: "Vietnam", major: "Industrial Engineering", studyLevel: "master", skills: ["Lean", "Six Sigma", "Python"], job: 0, stage: "screening" },
  { name: "Le Hoang Nam", nationality: "Vietnam", major: "Materials Science", studyLevel: "bachelor", skills: ["QC", "Metrology"], job: 2, stage: "applied" },
  { name: "Vu Thi Mai", nationality: "Vietnam", major: "Business Administration", studyLevel: "bachelor", skills: ["English", "Customer Service"], job: 1, stage: "screening" },
  { name: "Do Quang Huy", nationality: "Vietnam", major: "Mechatronics", studyLevel: "bachelor", skills: ["PLC", "AutoCAD"], job: 0, stage: "applied" },
  { name: "Hoang Thi Thu", nationality: "Vietnam", major: "Supply Chain", studyLevel: "master", skills: ["SAP", "English", "Mandarin"], job: 1, stage: "applied" },
  { name: "Bui Van Son", nationality: "Vietnam", major: "Quality Engineering", studyLevel: "bachelor", skills: ["ISO 9001", "Inspection"], job: 2, stage: "interview" },
] as const;

const CV_PLACEHOLDER = "https://work.tecxmate.com/demo-cv-placeholder";

async function seedDemoCompany() {
  if (process.env.DEMO_SEED !== "1") {
    throw new Error(
      "Refusing to run without DEMO_SEED=1. This seed publishes a known password — " +
        "point DATABASE_URL at a demo database, never production."
    );
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const db = connect(url);
  console.log(`Seeding ${COMPANY.name}...`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await db
    .insert(schema.users)
    .values({
      email: DEMO_EMAIL,
      name: "Demo Recruiter",
      passwordHash,
      role: "recruiter",
    })
    .onConflictDoNothing();

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_EMAIL));
  if (!user) throw new Error("demo user missing after insert");

  await db
    .insert(schema.recruiters)
    .values({
      userId: user.id,
      company: COMPANY.name,
      industry: COMPANY.industry,
      description: COMPANY.description,
      contactEmail: COMPANY.contactEmail,
      // Both of these are load-bearing — see the header comment. Do not "upgrade"
      // this account to an agency to show off the commercial tabs: that opens the
      // whole candidate pool to anyone holding the published password.
      clientKind: "client",
      orgId: null,
      verified: false,
    })
    .onConflictDoNothing();

  const [recruiter] = await db
    .select()
    .from(schema.recruiters)
    .where(eq(schema.recruiters.userId, user.id));
  if (!recruiter) throw new Error("demo recruiter missing after insert");

  await db
    .insert(schema.jobOpenings)
    .values(
      JOBS.map((j) => ({
        recruiterId: recruiter.id,
        title: j.title,
        jobCategory: j.category,
        location: "Taichung, Taiwan",
        employmentType: "full_time",
        workplaceType: "onsite",
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryCurrency: "TWD",
        salaryPeriod: "month",
        seniority: j.seniority,
        languageRequirement: "Mandarin working proficiency; English a plus.",
        visaSupport: "case_by_case",
        description: j.description,
        responsibilities: j.responsibilities,
        requirements: j.requirements,
        moderationStatus: "approved" as const,
        reviewedAt: new Date(),
      }))
    )
    .onConflictDoNothing();

  const jobRows = await db
    .select()
    .from(schema.jobOpenings)
    .where(eq(schema.jobOpenings.recruiterId, recruiter.id));
  console.log(`  ${jobRows.length} job openings`);

  // Interview slots across one demo day, 10:00–17:30 at 15 minutes, matching the
  // event-day grid the platform generates for a fair.
  const day = "2026-11-20";
  const slotValues: { recruiterId: number; startTime: Date; endTime: Date }[] = [];
  for (let h = 10; h < 17; h++) {
    for (let m = 0; m < 60; m += 15) {
      const start = new Date(
        `${day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`
      );
      slotValues.push({
        recruiterId: recruiter.id,
        startTime: start,
        endTime: new Date(start.getTime() + 15 * 60 * 1000),
      });
    }
  }
  await db.insert(schema.slots).values(slotValues).onConflictDoNothing();

  const slotRows = await db
    .select()
    .from(schema.slots)
    .where(eq(schema.slots.recruiterId, recruiter.id));

  // Candidates, their applications, and a few bookings in different states so the
  // interviews tab has something to accept, decline and reschedule.
  const bookingStatuses = ["pending", "accepted", "pending", "accepted"] as const;
  let bookingIdx = 0;

  for (const c of CANDIDATES) {
    const email = `${c.name.toLowerCase().replace(/[^a-z]+/g, ".")}@demo.invalid`;
    await db
      .insert(schema.applicantProfiles)
      .values({
        name: c.name,
        email,
        nationality: c.nationality,
        schoolName: "Demo University of Technology",
        schoolNameEn: "Demo University of Technology",
        major: c.major,
        studyLevel: c.studyLevel,
        skills: [...c.skills],
        cvLink: CV_PLACEHOLDER,
      })
      .onConflictDoNothing();

    const [applicant] = await db
      .select()
      .from(schema.applicantProfiles)
      .where(eq(schema.applicantProfiles.email, email));
    if (!applicant) continue;

    const job = jobRows[c.job];
    if (!job) continue;

    await db
      .insert(schema.applications)
      .values({
        jobOpeningId: job.id,
        applicantId: applicant.id,
        recruiterId: recruiter.id,
        stage: c.stage,
        stageUpdatedAt: new Date(),
      })
      .onConflictDoNothing();

    if (c.stage === "interview" || c.stage === "offer") {
      const slot = slotRows[bookingIdx * 3];
      if (slot) {
        await db
          .insert(schema.bookings)
          .values({
            direction: "applicant_books_recruiter",
            slotId: slot.id,
            recruiterId: recruiter.id,
            jobOpeningId: job.id,
            applicantId: applicant.id,
            position: job.title,
            applicantName: c.name,
            applicantEmail: email,
            cvLink: CV_PLACEHOLDER,
            pipaConsent: true,
            status: bookingStatuses[bookingIdx % bookingStatuses.length],
          })
          .onConflictDoNothing();
      }
      bookingIdx += 1;
    }
  }

  console.log(`  ${CANDIDATES.length} fictional candidates with applications`);
  console.log(`  ${slotValues.length} interview slots on ${day}`);
  console.log(`\nSign in at /login as ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log("Seed complete.");
}

seedDemoCompany().catch((err) => {
  console.error(err);
  process.exit(1);
});

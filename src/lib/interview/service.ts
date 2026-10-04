import "server-only";

import { randomBytes } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  aiInterviews,
  aiInterviewTurns,
  applicantProfiles,
  applications,
  jobOpenings,
  recruiters,
} from "@/lib/db/schema";

import { advance, grade, plan, type TranscriptEntry } from "./engine";
import { baseline, distance, profile, DRIFT_THRESHOLD } from "./register";
import { buildIntegrityReport, scoreTurn } from "./telemetry";
import type { CandidateContext, JobContext } from "./prompts";
import { TURN_BUDGET } from "./prompts";
import {
  CONSENT_DISCLOSURES,
  EMPTY_TELEMETRY,
  type Claim,
  type IntegrityReport,
  type IntegritySignal,
  type InterviewReport,
  type Probe,
  type TurnTelemetry,
} from "./types";

/** How long a link stays good. Long enough for a weekend, short enough to be a screening step. */
const INVITE_TTL_DAYS = 7;

export function newToken(): string {
  // 32 bytes of CSPRNG. The token is the candidate's only credential, so it
  // carries no encoded meaning — nothing about the application can be read off
  // it, and guessing one is the only way in.
  return randomBytes(32).toString("base64url");
}

// ---------------------------------------------------------------------------
// What the candidate's browser may see.
//
// The single most important boundary in this feature. `lookingFor` says what a
// good answer contains, `plantedError` names the detail we deliberately got
// wrong, and `claims` is the ledger of what we are checking. Any of the three
// reaching the candidate turns the interview into an open-book exercise — and a
// screening tool that leaks its own answer key is worse than none, because the
// recruiter still believes the score.
//
// So the candidate-facing shape is built by an explicit allow-list here, and
// every candidate route returns THIS type. A field added to `Probe` later is
// invisible to the candidate until someone adds it below on purpose.
// ---------------------------------------------------------------------------
export interface PublicQuestion {
  idx: number;
  question: string;
  timeLimitSec: number;
  wordCap: number;
  /** For the progress indicator. */
  total: number;
}

export function publicQuestion(row: { idx: number; question: string; timeLimitSec: number; wordCap: number }): PublicQuestion {
  return {
    idx: row.idx,
    question: row.question,
    timeLimitSec: row.timeLimitSec,
    wordCap: row.wordCap,
    total: TURN_BUDGET,
  };
}

export interface InterviewBrief {
  status: "invited" | "in_progress" | "completed" | "abandoned" | "expired";
  jobTitle: string;
  company: string;
  candidateName: string;
  disclosures: readonly string[];
  totalQuestions: number;
  /** The question waiting to be answered, when one is. */
  current: PublicQuestion | null;
}

type InterviewRow = typeof aiInterviews.$inferSelect;

async function loadRow(token: string): Promise<InterviewRow | null> {
  const db = getDb();
  const [row] = await db.select().from(aiInterviews).where(eq(aiInterviews.token, token)).limit(1);
  return row ?? null;
}

function isExpired(row: InterviewRow): boolean {
  return row.status !== "completed" && row.expiresAt.getTime() < Date.now();
}

async function contexts(row: InterviewRow): Promise<{ job: JobContext; candidate: CandidateContext }> {
  const db = getDb();
  const [job] = await db.select().from(jobOpenings).where(eq(jobOpenings.id, row.jobOpeningId)).limit(1);
  const [cand] = await db
    .select()
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, row.applicantId))
    .limit(1);
  if (!job || !cand) throw new Error("Interview is missing its job or candidate.");

  const [rec] = await db.select().from(recruiters).where(eq(recruiters.id, job.recruiterId)).limit(1);

  return {
    job: {
      title: job.title,
      // An agency job is placed FOR a client company; that is the company the
      // candidate would work at, and the one the scenario questions must be about.
      company: job.clientCompany || rec?.company || "",
      location: job.location,
      seniority: job.seniority,
      employmentType: job.employmentType,
      languageRequirement: job.languageRequirement,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
    },
    candidate: {
      name: cand.name,
      nationality: cand.nationality,
      schoolName: cand.schoolNameEn || cand.schoolName,
      major: cand.major,
      studyLevel: cand.studyLevel,
      studyYear: cand.studyYear,
      expectedGraduation: cand.expectedGraduation,
      skills: cand.skills,
      workExperiences: cand.workExperiences,
      certifications: cand.certifications,
      description: cand.description,
      cvLink: cand.cvLink,
    },
  };
}

// ---------------------------------------------------------------------------
// Recruiter side
// ---------------------------------------------------------------------------

export interface CreateInviteInput {
  applicationId: number;
  orgId: number;
  userId: number;
}

/**
 * Issue (or re-issue) an interview link for an application.
 *
 * An application gets at most one LIVE interview: a second link while the first
 * is unanswered would let a candidate take the interview twice and keep the
 * better run, which is the one thing that makes the whole exercise meaningless.
 * A completed interview can be re-invited — that is a deliberate second round,
 * and the old row and its report stay exactly where they are.
 */
export async function createInvite(input: CreateInviteInput): Promise<{ token: string; reused: boolean }> {
  const db = getDb();

  const [app] = await db
    .select({
      id: applications.id,
      orgId: applications.orgId,
      jobOpeningId: applications.jobOpeningId,
      applicantId: applications.applicantId,
    })
    .from(applications)
    .where(eq(applications.id, input.applicationId))
    .limit(1);
  if (!app) throw new Error("No such application.");
  // Tenant isolation, checked here as well as in the route: this function is the
  // one that mints a credential, so it does not take the caller's word for it.
  if (app.orgId != null && app.orgId !== input.orgId) throw new Error("Application belongs to another org.");

  const [live] = await db
    .select()
    .from(aiInterviews)
    .where(and(eq(aiInterviews.applicationId, input.applicationId), eq(aiInterviews.status, "invited")))
    .limit(1);
  if (live && live.expiresAt.getTime() > Date.now()) return { token: live.token, reused: true };

  const token = newToken();
  await db.insert(aiInterviews).values({
    orgId: app.orgId,
    applicationId: app.id,
    jobOpeningId: app.jobOpeningId,
    applicantId: app.applicantId,
    token,
    status: "invited",
    createdByUserId: input.userId,
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
  });
  return { token, reused: false };
}

export interface RecruiterView {
  id: number;
  status: InterviewRow["status"];
  createdAt: Date;
  completedAt: Date | null;
  token: string;
  report: InterviewReport | null;
  integrity: IntegrityReport | null;
  competencies: string[];
  claims: Claim[];
  turns: {
    idx: number;
    kind: string;
    question: string;
    lookingFor: string;
    plantedError: { asserted: string; actual: string } | null;
    answer: string | null;
    telemetry: TurnTelemetry | null;
    signals: IntegritySignal[];
    assessment: unknown;
    wordCap: number;
    timeLimitSec: number;
  }[];
}

export async function recruiterView(interviewId: number, orgId: number): Promise<RecruiterView | null> {
  const db = getDb();
  const [row] = await db.select().from(aiInterviews).where(eq(aiInterviews.id, interviewId)).limit(1);
  if (!row) return null;
  if (row.orgId != null && row.orgId !== orgId) return null;

  const turns = await db
    .select()
    .from(aiInterviewTurns)
    .where(eq(aiInterviewTurns.interviewId, row.id))
    .orderBy(asc(aiInterviewTurns.idx));

  return {
    id: row.id,
    status: row.status,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    token: row.token,
    report: (row.report as InterviewReport | null) ?? null,
    integrity: (row.integrity as IntegrityReport | null) ?? null,
    competencies: (row.competencies as string[]) ?? [],
    claims: (row.claims as Claim[]) ?? [],
    turns: turns.map((t) => ({
      idx: t.idx,
      kind: t.kind,
      question: t.question,
      lookingFor: t.lookingFor,
      plantedError: (t.plantedError as { asserted: string; actual: string } | null) ?? null,
      answer: t.answer,
      telemetry: (t.telemetry as TurnTelemetry | null) ?? null,
      signals: (t.signals as IntegritySignal[]) ?? [],
      assessment: t.assessment,
      wordCap: t.wordCap,
      timeLimitSec: t.timeLimitSec,
    })),
  };
}

export async function latestForApplication(applicationId: number, orgId: number): Promise<RecruiterView | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: aiInterviews.id })
    .from(aiInterviews)
    .where(eq(aiInterviews.applicationId, applicationId))
    .orderBy(asc(aiInterviews.createdAt))
    .limit(1);
  return row ? recruiterView(row.id, orgId) : null;
}

// ---------------------------------------------------------------------------
// Candidate side
// ---------------------------------------------------------------------------

export async function brief(token: string): Promise<InterviewBrief | null> {
  const row = await loadRow(token);
  if (!row) return null;

  const { job, candidate } = await contexts(row);
  const db = getDb();

  let current: PublicQuestion | null = null;
  if (row.status === "in_progress") {
    const turns = await db
      .select()
      .from(aiInterviewTurns)
      .where(eq(aiInterviewTurns.interviewId, row.id))
      .orderBy(asc(aiInterviewTurns.idx));
    // Resuming: the first question with no answer is where they left off. A
    // reload mid-interview lands back on the same question rather than skipping
    // it, and the clock is the only thing they lose.
    const unanswered = turns.find((t) => t.answer == null);
    if (unanswered) current = publicQuestion(unanswered);
  }

  return {
    status: isExpired(row) ? "expired" : row.status,
    jobTitle: job.title,
    company: job.company,
    // First name only. The link may be forwarded, opened on a shared machine, or
    // land in a screenshot; a full name on the pre-consent screen is PII given
    // away before anyone has agreed to anything.
    candidateName: candidate.name.split(/\s+/)[0] ?? candidate.name,
    disclosures: CONSENT_DISCLOSURES,
    totalQuestions: TURN_BUDGET,
    current,
  };
}

/**
 * Record consent, prepare the interview, and return the first question.
 *
 * Idempotent on a double-submit: a candidate who reloads during the (slow) plan
 * call would otherwise get a second interview plan and a second question 0,
 * which the unique index would reject — leaving them stuck on a page that says
 * "starting" forever.
 */
export async function start(token: string): Promise<{ question: PublicQuestion } | { error: string }> {
  const db = getDb();
  const row = await loadRow(token);
  if (!row) return { error: "not_found" };
  if (isExpired(row)) return { error: "expired" };
  if (row.status === "completed") return { error: "already_completed" };

  if (row.status === "in_progress") {
    const turns = await db
      .select()
      .from(aiInterviewTurns)
      .where(eq(aiInterviewTurns.interviewId, row.id))
      .orderBy(asc(aiInterviewTurns.idx));
    const unanswered = turns.find((t) => t.answer == null);
    if (unanswered) return { question: publicQuestion(unanswered) };
  }

  const { job, candidate } = await contexts(row);
  const prepared = await plan({ job, candidate });

  await db
    .update(aiInterviews)
    .set({
      status: "in_progress",
      competencies: prepared.competencies,
      claims: prepared.claims,
      consentAt: new Date(),
      consentDisclosures: [...CONSENT_DISCLOSURES],
      startedAt: new Date(),
    })
    .where(eq(aiInterviews.id, row.id));

  await insertTurn(row.id, 0, prepared.opening);
  return { question: publicQuestion({ idx: 0, ...prepared.opening }) };
}

async function insertTurn(interviewId: number, idx: number, probe: Probe): Promise<void> {
  await getDb()
    .insert(aiInterviewTurns)
    .values({
      interviewId,
      idx,
      kind: probe.kind,
      question: probe.question,
      lookingFor: probe.lookingFor,
      plantedError: probe.plantedError ?? null,
      targets: probe.targets,
      timeLimitSec: probe.timeLimitSec,
      wordCap: probe.wordCap,
    })
    .onConflictDoNothing();
}

export type AnswerResult =
  | { done: false; question: PublicQuestion }
  | { done: true }
  | { error: string };

export async function submitAnswer(input: {
  token: string;
  idx: number;
  answer: string;
  telemetry: TurnTelemetry;
}): Promise<AnswerResult> {
  const db = getDb();
  const row = await loadRow(input.token);
  if (!row) return { error: "not_found" };
  if (isExpired(row)) return { error: "expired" };
  if (row.status !== "in_progress") return { error: "not_in_progress" };

  const turns = await db
    .select()
    .from(aiInterviewTurns)
    .where(eq(aiInterviewTurns.interviewId, row.id))
    .orderBy(asc(aiInterviewTurns.idx));

  const target = turns.find((t) => t.idx === input.idx);
  if (!target) return { error: "no_such_question" };
  // A resubmitted answer is dropped rather than overwritten. The follow-up was
  // already written against the first version, so accepting a second one would
  // let a candidate revise an answer after seeing what it provoked.
  if (target.answer != null) {
    const next = turns.find((t) => t.answer == null);
    return next ? { done: false, question: publicQuestion(next) } : { done: true };
  }

  const answer = input.answer.trim().slice(0, 4000);
  const telemetry: TurnTelemetry = { ...EMPTY_TELEMETRY, ...input.telemetry };
  const signals = scoreTurn({ turnIdx: input.idx, telemetry, wordCap: target.wordCap });

  await db
    .update(aiInterviewTurns)
    .set({ answer, telemetry, signals, answeredAt: new Date() })
    .where(eq(aiInterviewTurns.id, target.id));

  const answeredCount = turns.filter((t) => t.answer != null).length + 1;
  const transcript: TranscriptEntry[] = [];
  for (const t of turns) {
    transcript.push({ role: "interviewer", text: t.question });
    const text = t.id === target.id ? answer : t.answer;
    if (text != null) transcript.push({ role: "candidate", text });
  }

  const { job, candidate } = await contexts(row);
  const claims = (row.claims as Claim[]) ?? [];
  const notes = (row.notes as string[]) ?? [];
  const falsePremisesUsed = turns.filter((t) => t.kind === "false_premise").length;

  const lastQuestionReached = answeredCount >= TURN_BUDGET;

  const result = await advance({
    job,
    candidate,
    competencies: (row.competencies as string[]) ?? [],
    claims,
    transcript,
    turnIdx: input.idx,
    falsePremisesUsed,
    integrityNote: integrityNoteFor(target.plantedError as { asserted: string } | null, signals),
  });

  const nextNotes = [...notes, result.assessment.note];
  await db
    .update(aiInterviews)
    .set({ claims: result.claims, notes: nextNotes })
    .where(eq(aiInterviews.id, row.id));
  await db
    .update(aiInterviewTurns)
    .set({ assessment: result.assessment })
    .where(eq(aiInterviewTurns.id, target.id));

  if (!lastQuestionReached && result.probe) {
    await insertTurn(row.id, input.idx + 1, result.probe);
    return { done: false, question: publicQuestion({ idx: input.idx + 1, ...result.probe }) };
  }

  await finish(row.id, { completed: true });
  return { done: true };
}

/**
 * What the interviewer is told about the answer it just received, beyond the text.
 *
 * Only two things, and both are facts it cannot read off the transcript: whether
 * the previous question planted a wrong detail (so it knows a correction is a
 * correction rather than a digression), and whether the answer arrived in a way
 * worth one careful verification question. It is NOT told the integrity score,
 * and it is told in the prompt never to mention any of this — an interviewer that
 * starts hinting at suspicion turns a false positive into an accusation.
 */
function integrityNoteFor(
  planted: { asserted: string } | null,
  signals: IntegritySignal[]
): string {
  const parts: string[] = [];
  if (planted) {
    parts.push(
      `Your previous question asserted "${planted.asserted}", which is not what their CV says. Record whether they corrected it, then move on without drawing attention to it.`
    );
  }
  if (signals.some((s) => s.severity === "high")) {
    parts.push(
      "That answer arrived in an unusual way. Do not react to it and do not hint at it. Make your next question one that needs a specific, checkable detail they would only have if the experience is theirs."
    );
  }
  return parts.join(" ");
}

/** Grade and close. Safe to call twice — the second call sees the report already there and returns it. */
export async function finish(
  interviewId: number,
  opts: { completed: boolean }
): Promise<{ report: InterviewReport; integrity: IntegrityReport } | null> {
  const db = getDb();
  const [row] = await db.select().from(aiInterviews).where(eq(aiInterviews.id, interviewId)).limit(1);
  if (!row) return null;
  if (row.report) {
    return {
      report: row.report as InterviewReport,
      integrity: (row.integrity as IntegrityReport) ?? buildIntegrityReport([]),
    };
  }

  const turns = await db
    .select()
    .from(aiInterviewTurns)
    .where(eq(aiInterviewTurns.interviewId, row.id))
    .orderBy(asc(aiInterviewTurns.idx));

  const answered = turns.filter((t) => t.answer != null);
  const transcript: TranscriptEntry[] = [];
  for (const t of turns) {
    transcript.push({ role: "interviewer", text: t.question });
    if (t.answer != null) transcript.push({ role: "candidate", text: t.answer });
  }

  const { job, candidate } = await contexts(row);
  const report = await grade({
    job,
    candidate,
    competencies: (row.competencies as string[]) ?? [],
    claims: (row.claims as Claim[]) ?? [],
    transcript,
    notes: (row.notes as string[]) ?? [],
    completed: opts.completed && answered.length >= Math.ceil(TURN_BUDGET * 0.6),
  });

  const perTurn = answered.flatMap((t) => (t.signals as IntegritySignal[]) ?? []);
  const integrity = buildIntegrityReport([...perTurn, ...registerSignals(answered)]);

  await db
    .update(aiInterviews)
    .set({
      status: opts.completed ? "completed" : "abandoned",
      report,
      integrity,
      fitScore: report.fitScore,
      recommendation: report.recommendation,
      integrityScore: integrity.score,
      completedAt: new Date(),
    })
    .where(eq(aiInterviews.id, row.id));

  // The kanban badge reads applications.ai_score, which until now has been the
  // seeded placeholder. A real interview overwrites it, so the board shows the
  // number that was actually earned.
  await db
    .update(applications)
    .set({ aiScore: report.fitScore })
    .where(eq(applications.id, row.applicationId));

  return { report, integrity };
}

/**
 * Writing-register drift across the interview.
 *
 * The baseline is the first two answers — before a candidate has settled into
 * the format, and the closest thing we have to their unaided prose. Anything
 * later that sits far from it is compared, and a signal is raised only when
 * SEVERAL answers drift, never one: a single question that happened to be about
 * familiar ground pulls better English out of anyone, and one flagged answer in
 * a report is one a recruiter will read as proof.
 */
function registerSignals(answered: { idx: number; answer: string | null }[]): IntegritySignal[] {
  const texts = answered.map((t) => t.answer ?? "");
  if (texts.length < 5) return [];

  const base = baseline(texts.slice(0, 2));
  if (base.words < 25) return [];

  const drifted = answered
    .slice(2)
    .filter((t) => distance(base, profile(t.answer ?? "")) >= DRIFT_THRESHOLD)
    .map((t) => t.idx);

  if (drifted.length < 2) return [];
  return [
    {
      code: "register_drift",
      severity: drifted.length >= 4 ? "medium" : "low",
      turnIdx: -1,
      detail: `The writing in ${drifted.length} later answers (questions ${drifted.map((i) => i + 1).join(", ")}) is measurably different from the first two — longer sentences, more formal vocabulary, or discourse markers the early answers do not use. People do warm up, and a candidate who drafts in their own language and translates will show this on every answer.`,
    },
  ];
}

export async function abandon(token: string): Promise<void> {
  const row = await loadRow(token);
  if (!row || row.status !== "in_progress") return;
  await finish(row.id, { completed: false });
}

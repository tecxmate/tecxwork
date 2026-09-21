import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import { mergeClaims, markProbed, pickNextTarget } from "./claims";
import {
  CAP_BY_KIND,
  TURN_BUDGET,
  systemPrompt,
  turnInstruction,
  type CandidateContext,
  type JobContext,
} from "./prompts";
import { PROBE_KINDS, type Claim, type InterviewReport, type Probe } from "./types";

/**
 * The interviewer's calls to Claude. Three of them:
 *
 *   plan()    once, before the first question — competencies and the opening ledger
 *   advance() once per answer — assess, update the ledger, write the next question
 *   grade()   once at the end — the report the recruiter reads
 *
 * advance() does all three of its jobs in ONE request rather than three, and that
 * is a design decision rather than a saving: the doctrine in prompts.ts turns on
 * the follow-up arriving while the candidate is still looking at what they wrote.
 * Three round trips put eight seconds between the answer and the question that
 * tests it, which is exactly the window the attack needs.
 */

export const INTERVIEW_MODEL = "claude-opus-5";

/**
 * Effort. Planning and grading are the two calls whose quality the recruiter
 * actually reads, and neither is on the candidate's clock — they get `high`.
 * The per-turn call is on the clock, so it runs at `medium`, where the probe
 * quality holds and the follow-up lands while the answer is still warm. Override
 * per deployment if a demo wants the slower, sharper version.
 */
const EFFORT_OFFLINE = (process.env.INTERVIEW_EFFORT_OFFLINE ?? "high") as "high" | "max";
const EFFORT_TURN = (process.env.INTERVIEW_EFFORT_TURN ?? "medium") as "low" | "medium" | "high";

let _client: Anthropic | null = null;

export function interviewerConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set — the AI interviewer cannot run.");
    }
    _client = new Anthropic();
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Schemas. Every field the model fills is described here rather than in prose,
// because a described field is one the model does not have to guess the purpose
// of — and because these double as the validation the route handlers rely on.
// ---------------------------------------------------------------------------

const probeSchema = z.object({
  kind: z.enum(PROBE_KINDS),
  question: z.string().describe("The question, addressed to the candidate. One question, not three."),
  timeLimitSec: z.number().int().min(30).max(240),
  wordCap: z.number().int().min(15).max(120).describe("Soft cap shown to the candidate."),
  targets: z.array(z.string()).describe("Claim ids this question tests. Empty for a scenario."),
  plantedError: z
    .object({
      asserted: z.string().describe("The wrong detail you stated."),
      actual: z.string().describe("What the CV actually says."),
    })
    .nullable()
    .describe("Only for kind=false_premise. Null otherwise."),
  lookingFor: z.string().describe("What a good answer contains. Recruiter-only; never shown to the candidate."),
});

const claimSchema = z.object({
  id: z.string().describe("Existing ledger id when updating one, or a new kebab-case id."),
  text: z.string().describe("The assertion in one line."),
  source: z.enum(["cv", "answer"]),
  field: z.string().nullable().describe("Which CV field, when source is cv."),
  status: z.enum(["unprobed", "probed", "corroborated", "contradicted", "evaded"]),
  notes: z.string().describe("What the transcript shows about it so far. Empty if nothing yet."),
});

const planSchema = z.object({
  competencies: z
    .array(z.string())
    .min(3)
    .max(6)
    .describe("What this specific job actually requires, drawn from the JD — not generic traits."),
  claims: z
    .array(claimSchema)
    .min(3)
    .max(14)
    .describe("Checkable assertions seeded from the CV. Prefer ones with a number, a date, a named system or a named employer."),
  opening: probeSchema,
});

const advanceSchema = z.object({
  assessment: z.object({
    answered: z.boolean().describe("Did they answer the question that was asked, as opposed to something adjacent?"),
    specificity: z.number().int().min(1).max(4).describe("1 = generic, 4 = specific and checkable."),
    correctedPremise: z
      .boolean()
      .describe("If the previous question planted a wrong detail: did they correct it? False otherwise."),
    note: z.string().describe("One or two sentences of evidence, quoting them where it matters."),
  }),
  claims: z.array(claimSchema).describe("New claims, plus any existing ones whose status changed."),
  probe: probeSchema.nullable().describe("The next question. Null only when closing."),
});

const reportSchema = z.object({
  recommendation: z.enum(["strong_yes", "yes", "no", "strong_no", "inconclusive"]),
  fitScore: z.number().int().min(0).max(100),
  summary: z.string().describe("Four to six sentences. What they can do, what is unproven, and the one thing that decided it."),
  competencies: z.array(
    z.object({
      name: z.string(),
      rating: z.number().int().min(1).max(4),
      evidence: z.string(),
      quotes: z.array(z.string()).describe("Verbatim from the transcript, so the rating can be checked against what was said."),
    })
  ),
  unsupportedClaims: z.array(
    z.object({
      claim: z.string(),
      whatHappened: z.string().describe("How it failed to stand up: evaded, contradicted, or never given a number."),
    })
  ),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  followUpForHuman: z
    .array(z.string())
    .min(1)
    .describe("Questions a human should ask at the next stage. This bot is a filter, not a decision."),
});

// ---------------------------------------------------------------------------

function toClaim(raw: z.infer<typeof claimSchema>, turnIdx: number | null): Claim {
  return {
    id: raw.id,
    text: raw.text,
    source: raw.source,
    field: raw.field ?? undefined,
    turnIdx: raw.source === "answer" ? turnIdx : null,
    status: raw.status,
    probes: 0,
    lastProbedTurn: null,
    notes: raw.notes,
  };
}

/**
 * Clamp whatever the model asked for to the caps in prompts.ts.
 *
 * The model sets a time limit and a word cap per question, which is right — a
 * scenario needs more room than a drill. But the caps are a defence, not a
 * preference: a generous cap is exactly what a relayed answer needs, and a model
 * that has been talked into "be accommodating" by a persuasive candidate would
 * otherwise hand it over. So the ceiling is enforced here, in code, where the
 * conversation cannot reach it.
 */
function clampProbe(p: z.infer<typeof probeSchema>): Probe {
  const cap = CAP_BY_KIND[p.kind] ?? CAP_BY_KIND.cv_drill;
  return {
    kind: p.kind,
    question: p.question.trim(),
    timeLimitSec: Math.min(p.timeLimitSec, cap.seconds),
    wordCap: Math.min(p.wordCap, cap.words),
    targets: p.targets,
    plantedError: p.plantedError ?? undefined,
    lookingFor: p.lookingFor,
  };
}

export interface PlanResult {
  competencies: string[];
  claims: Claim[];
  opening: Probe;
}

export async function plan(input: {
  job: JobContext;
  candidate: CandidateContext;
}): Promise<PlanResult> {
  const res = await client().messages.parse({
    model: INTERVIEW_MODEL,
    max_tokens: 16000,
    system: `You are preparing a screening interview. Read the role and the candidate's own account of themselves, then decide what this interview has to find out and which of their claims are worth testing.

THE ROLE
${JSON.stringify(input.job, null, 1)}

THE CANDIDATE
${JSON.stringify(input.candidate, null, 1)}

Competencies must come from THIS job description, not from a generic list. Claims must be things this candidate specifically asserted, preferring ones carrying a number, a date, a named employer or a named system — those are the ones a follow-up can stand on. The opening question is a warmup: low stakes, short, and about something they wrote. Its real job is to establish how this person writes when nobody is helping them.`,
    messages: [{ role: "user", content: "Prepare the interview." }],
    output_config: { format: zodOutputFormat(planSchema), effort: EFFORT_OFFLINE },
  });

  const parsed = res.parsed_output;
  if (!parsed) throw new Error("The interviewer could not prepare this interview.");

  return {
    competencies: parsed.competencies,
    claims: parsed.claims.map((c) => toClaim(c, null)),
    opening: clampProbe({ ...parsed.opening, kind: "warmup" }),
  };
}

export interface TranscriptEntry {
  role: "interviewer" | "candidate";
  text: string;
}

export interface AdvanceResult {
  assessment: z.infer<typeof advanceSchema>["assessment"];
  claims: Claim[];
  probe: Probe | null;
}

export async function advance(input: {
  job: JobContext;
  candidate: CandidateContext;
  competencies: string[];
  claims: Claim[];
  transcript: TranscriptEntry[];
  /** Index of the question just answered. */
  turnIdx: number;
  falsePremisesUsed: number;
  /** What the telemetry has shown so far, in one line. Informs the interviewer; never shown to the candidate. */
  integrityNote: string;
}): Promise<AdvanceResult> {
  const nextIdx = input.turnIdx + 1;
  const target = pickNextTarget(input.claims, nextIdx);

  const res = await client().messages.parse({
    model: INTERVIEW_MODEL,
    max_tokens: 16000,
    // One cached block: the role, the CV and the doctrine do not change across
    // the interview, so every turn after the first reads them from cache.
    system: [
      {
        type: "text" as const,
        text: systemPrompt({
          job: input.job,
          candidate: input.candidate,
          competencies: input.competencies,
        }),
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [
      ...input.transcript.map((e) => ({
        role: (e.role === "interviewer" ? "assistant" : "user") as "assistant" | "user",
        content: e.text,
      })),
      {
        role: "user" as const,
        content: [
          "LEDGER (internal — never mention it):",
          input.claims
            .map((c) => `- [${c.id}] ${c.text} — ${c.status}, probed ${c.probes}×${c.notes ? `; ${c.notes}` : ""}`)
            .join("\n") || "(empty)",
          "",
          turnInstruction({
            turnIdx: nextIdx,
            target,
            falsePremisesUsed: input.falsePremisesUsed,
            remaining: Math.max(0, TURN_BUDGET - nextIdx - 1),
            integrityNote: input.integrityNote,
          }),
        ].join("\n"),
      },
    ],
    output_config: { format: zodOutputFormat(advanceSchema), effort: EFFORT_TURN },
  });

  const parsed = res.parsed_output;
  if (!parsed) throw new Error("The interviewer could not continue.");

  const probe = parsed.probe ? clampProbe(parsed.probe) : null;
  let claims = mergeClaims(
    input.claims,
    parsed.claims.map((c) => toClaim(c, input.turnIdx))
  );
  if (probe?.targets.length) claims = markProbed(claims, probe.targets, nextIdx);

  return { assessment: parsed.assessment, claims, probe };
}

export async function grade(input: {
  job: JobContext;
  candidate: CandidateContext;
  competencies: string[];
  claims: Claim[];
  transcript: TranscriptEntry[];
  /** Per-turn assessments accumulated during the interview. */
  notes: string[];
  /** Whether the interview ran to the end. A short interview is graded as short, not as bad. */
  completed: boolean;
}): Promise<InterviewReport> {
  const res = await client().messages.parse({
    model: INTERVIEW_MODEL,
    max_tokens: 16000,
    system: `You are writing the screening report a recruiter will read before deciding whether to spend an hour on this candidate. Be strict and be specific: a rating with no quote behind it is worth nothing to them.

THE ROLE
${JSON.stringify(input.job, null, 1)}

WHAT THE INTERVIEW WAS ASSESSING
${input.competencies.map((c, i) => `${i + 1}. ${c}`).join("\n")}

THE CLAIM LEDGER AT THE END
${input.claims.map((c) => `- ${c.text} — ${c.status} (probed ${c.probes}×)${c.notes ? `; ${c.notes}` : ""}`).join("\n")}

YOUR OWN NOTES DURING THE INTERVIEW
${input.notes.map((n, i) => `Q${i + 1}: ${n}`).join("\n")}

${input.completed ? "" : "THIS INTERVIEW WAS NOT FINISHED. Grade only what was covered, say so in the summary, and use `inconclusive` unless what you did see is decisive on its own.\n"}
RULES

- Rate only what the transcript supports. If a competency never came up, rate it
  against the evidence you have and say so in its "evidence" field.
- A claim the candidate could not stand up goes in unsupportedClaims with what
  actually happened — evaded, contradicted, or never given a number. Do not
  soften it and do not editorialise beyond what was said.
- Judge the ANSWERS, not how they were composed. You have no access to typing
  measurements and must not speculate about them; that goes in a separate report
  with its own caveats, and mixing the two would let a slow connection read as a
  character finding.
- Do not weigh anything unlawful to consider in Taiwanese hiring — age, marital
  or family status, pregnancy, religion, health, ethnicity — even if the
  candidate volunteered it.
- followUpForHuman is the point of the whole exercise: name what a person should
  press on next. Never write a final hiring decision.`,
    messages: [
      {
        role: "user",
        content: [
          "TRANSCRIPT",
          ...input.transcript.map((e) => `${e.role === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${e.text}`),
          "",
          "Write the report.",
        ].join("\n"),
      },
    ],
    output_config: { format: zodOutputFormat(reportSchema), effort: EFFORT_OFFLINE },
  });

  const parsed = res.parsed_output;
  if (!parsed) throw new Error("The interviewer could not write the report.");
  return parsed;
}

/** Turn an SDK error into something a route handler can return without leaking a key or a stack. */
export function describeEngineError(error: unknown): { status: number; message: string } {
  if (error instanceof Anthropic.AuthenticationError) {
    return { status: 503, message: "The interviewer is not configured correctly." };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { status: 429, message: "The interviewer is busy. Wait a moment and send your answer again." };
  }
  if (error instanceof Anthropic.APIError) {
    console.error("[ai-interview] Anthropic error", error.status, error.message);
    return { status: 502, message: "The interviewer could not respond. Your answer was saved." };
  }
  console.error("[ai-interview]", error);
  return { status: 500, message: "Something went wrong." };
}

/**
 * Client-safe types for the AI interviewer. No server imports — the candidate's
 * browser imports this file to shape the telemetry it collects, and the grading
 * code on the server imports the same definitions so the two cannot drift.
 */

/** What the interviewer is trying to do with a question. */
export const PROBE_KINDS = [
  /** One low-stakes opener. Its real job is a typing + writing-register baseline. */
  "warmup",
  /** A specific claim from the CV, asked for a number, a basis, and a witness. */
  "cv_drill",
  /** An immediate drill on the answer just given, quoting it back. */
  "followup",
  /** Re-asks a claim from turns ago, from a different angle. */
  "consistency",
  /** Asserts a plausible but WRONG detail about their background. */
  "false_premise",
  /** A scenario built from the job's real constraints and invented numbers. */
  "micro_scenario",
  /** Requires a constraint the interviewer stated earlier in this conversation. */
  "constraint_recall",
  /** Asks them to attack their own earlier answer. */
  "self_critique",
  "closing",
] as const;

export type ProbeKind = (typeof PROBE_KINDS)[number];

/**
 * What the candidate's browser measures while they answer one question.
 *
 * All of it is disclosed on the consent screen before the interview starts —
 * see `CONSENT_DISCLOSURES`. None of it is keystroke *content*: we count events
 * and measure time, and never record what keys were pressed.
 */
export interface TurnTelemetry {
  /** Question shown → first character typed. Null if they never typed (pure paste). */
  firstKeystrokeMs: number | null;
  /** Question shown → submit. */
  elapsedMs: number;
  /** Characters in the submitted answer. */
  chars: number;
  /** Key presses that inserted a character. */
  keystrokes: number;
  /** Backspace / delete presses. */
  corrections: number;
  pasteCount: number;
  pastedChars: number;
  /** Times the window lost focus while this question was open. */
  blurCount: number;
  /** Total milliseconds the window was unfocused. */
  blurMs: number;
  /** Total milliseconds the tab was hidden (a different tab, or another app). */
  hiddenMs: number;
  /** Fastest sustained typing rate over any 2-second window, chars/second. */
  peakCps: number;
}

export const EMPTY_TELEMETRY: TurnTelemetry = {
  firstKeystrokeMs: null,
  elapsedMs: 0,
  chars: 0,
  keystrokes: 0,
  corrections: 0,
  pasteCount: 0,
  pastedChars: 0,
  blurCount: 0,
  blurMs: 0,
  hiddenMs: 0,
  peakCps: 0,
};

export type SignalSeverity = "low" | "medium" | "high";

/**
 * One reason to look closer. Never a verdict: every signal here is
 * circumstantial, and the report says so in the candidate's favour.
 */
export interface IntegritySignal {
  code: string;
  severity: SignalSeverity;
  /** Shown to the recruiter, in English. States the measurement, not a conclusion. */
  detail: string;
  /** Which turn produced it. -1 for interview-wide signals. */
  turnIdx: number;
}

/**
 * A single assertion we are holding the candidate to. Seeded from the CV, then
 * grown from what they say — this is the ledger that makes an outside AI useless,
 * because it has neither the CV nor the earlier transcript.
 */
export interface Claim {
  id: string;
  /** The claim in one line, as stated. */
  text: string;
  source: "cv" | "answer";
  /** Which CV field it came from, when source is "cv". */
  field?: string;
  /** Turn that produced it, when source is "answer". */
  turnIdx: number | null;
  status: "unprobed" | "probed" | "corroborated" | "contradicted" | "evaded";
  /** How many times we have asked about it. */
  probes: number;
  /** Last turn index at which it was probed, for spacing the re-ask. */
  lastProbedTurn: number | null;
  notes: string;
}

/** A question the interviewer has decided to ask. */
export interface Probe {
  kind: ProbeKind;
  question: string;
  /** Seconds on the clock for this one. */
  timeLimitSec: number;
  /** Soft word cap shown to the candidate. Short answers are the point — see the note in `prompts.ts`. */
  wordCap: number;
  /** Claim ids this question is testing. */
  targets: string[];
  /**
   * For a false_premise probe: the detail we deliberately got wrong, and what
   * the CV actually says. Never shown to the candidate; the grader needs both
   * to tell a correction from a confabulation.
   */
  plantedError?: { asserted: string; actual: string };
  /** The interviewer's own note on what a good answer looks like. Recruiter-only. */
  lookingFor: string;
}

export interface CompetencyScore {
  name: string;
  /** 1–4, the same scale the existing scorecards use. */
  rating: number;
  evidence: string;
  /** Verbatim from the transcript, so the recruiter can check the rating against what was said. */
  quotes: string[];
}

export type Recommendation =
  | "strong_yes"
  | "yes"
  | "no"
  | "strong_no"
  | "inconclusive";

export interface InterviewReport {
  recommendation: Recommendation;
  /** 0–100 fit against the job description. */
  fitScore: number;
  summary: string;
  competencies: CompetencyScore[];
  /** Claims the interview could not stand up, with what was said. */
  unsupportedClaims: { claim: string; whatHappened: string }[];
  strengths: string[];
  concerns: string[];
  /** What a human interviewer should ask next. The bot is a filter, not a decision. */
  followUpForHuman: string[];
}

/** Everything the recruiter sees about how the answers were composed. */
export interface IntegrityReport {
  /** 0–100. 100 = nothing measured looked unusual. */
  score: number;
  verdict: "clean" | "watch" | "review_required";
  signals: IntegritySignal[];
  /** Written for a human who must not over-read a circumstantial signal. */
  caveat: string;
}

/**
 * Shown on the consent screen, verbatim, before anything is recorded. Listed
 * here rather than in the component so the API can assert the candidate saw the
 * same list the code actually implements.
 */
export const CONSENT_DISCLOSURES = [
  "Your answers are recorded and reviewed by the hiring team.",
  "This interview is conducted by an AI. A human makes the hiring decision.",
  "Questions are drawn from your CV, and later questions revisit earlier answers.",
  "Each question has a time limit, shown on screen.",
  "While a question is open, the page measures how long you take to start typing, how fast you type, whether you paste, and whether you switch away from this tab. It does not record which keys you press or anything outside this page.",
  "You can stop at any time; a stopped interview is reported as incomplete, not as a failure.",
] as const;

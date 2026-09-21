/**
 * Composition-integrity scoring: what the browser measured while an answer was
 * typed, turned into reasons for a human to look closer.
 *
 * WHAT THIS IS FOR. The threat is not a candidate who knows the answer. It is a
 * candidate with a second screen: paste the question into an LLM, read the reply
 * back. That leaves marks in *how* the answer arrived even when the answer itself
 * is excellent — a long silence, then 600 characters at a speed nobody composes
 * at, with no backspaces, while the tab was hidden.
 *
 * WHAT THIS IS NOT. Proof. Every rule here has an innocent explanation, and the
 * ones that matter most for THIS product — Vietnamese, Indonesian and Chinese
 * speakers typing in a second or third language, often on a phone, often on a
 * shared connection — are exactly the ones that fire it. So:
 *
 *   - nothing here fails a candidate; it produces a flag on a recruiter's screen;
 *   - each signal states the MEASUREMENT, not a conclusion ("38s hidden, then
 *     612 chars in 9s" — not "cheated");
 *   - the thresholds are deliberately conservative, and each one carries the
 *     human baseline it was set from;
 *   - `caveat` travels with the score so it cannot be quoted without it.
 *
 * Deliberately deterministic and model-free: an integrity flag that a model
 * produced could not be audited or explained to a candidate who disputes it.
 */
import type { IntegritySignal, IntegrityReport, TurnTelemetry } from "./types";

/**
 * A fast touch typist runs ~80 wpm ≈ 6.7 chars/s on familiar prose. Sustained
 * transcription (reading and copying, not composing) reaches ~10. Above 13 over
 * a full two seconds, in a second language, is not composition.
 */
const CPS_IMPLAUSIBLE = 13;
const CPS_FAST = 9;

/** Below this many characters, every rate and ratio here is noise. */
const MIN_CHARS_FOR_RATE = 60;

/** A pause long enough to have asked something else and read a reply. */
const LONG_STALL_MS = 20_000;

/** Leaving the page briefly is normal — a notification, a glance. Sustained is not. */
const AWAY_NOTABLE_MS = 6_000;
const AWAY_SERIOUS_MS = 15_000;

/**
 * Keystrokes per character. Above 1.0 is the norm and rises with an IME:
 * Chinese pinyin spends ~3 keys per character, Vietnamese telex ~1.4. So a
 * count *below* the character count means text arrived without being typed.
 * Kept at medium severity because a composition-event IME can commit a phrase
 * without emitting per-character keydowns, and that is a real false positive
 * for this candidate pool rather than a hypothetical one.
 */
const KEYSTROKE_DEFICIT_RATIO = 0.55;

/** Composing this much original prose with zero corrections is unusual, not impossible. */
const NO_CORRECTION_CHARS = 260;

export interface TurnForScoring {
  turnIdx: number;
  telemetry: TurnTelemetry;
  /** The soft cap the candidate was shown, for the over-run signal. */
  wordCap: number;
}

/**
 * Signals for one answer. Exported separately so a turn can be flagged live,
 * while the interview is still running.
 */
export function scoreTurn(turn: TurnForScoring): IntegritySignal[] {
  const t = turn.telemetry;
  const at = turn.turnIdx;
  const out: IntegritySignal[] = [];
  const seconds = Math.max(t.elapsedMs / 1000, 0.001);

  const pastedShare = t.chars > 0 ? t.pastedChars / t.chars : 0;
  if (t.pasteCount > 0 && t.chars >= MIN_CHARS_FOR_RATE && pastedShare >= 0.5) {
    out.push({
      code: "pasted_answer",
      severity: "high",
      turnIdx: at,
      detail: `${Math.round(pastedShare * 100)}% of this answer (${t.pastedChars} of ${t.chars} characters) arrived as a paste, in ${t.pasteCount} paste event${t.pasteCount === 1 ? "" : "s"}.`,
    });
  } else if (t.pasteCount > 0) {
    out.push({
      code: "paste_used",
      severity: "low",
      turnIdx: at,
      detail: `${t.pasteCount} paste event${t.pasteCount === 1 ? "" : "s"} inserting ${t.pastedChars} character${t.pastedChars === 1 ? "" : "s"}.`,
    });
  }

  if (t.chars >= MIN_CHARS_FOR_RATE && t.keystrokes < t.chars * KEYSTROKE_DEFICIT_RATIO && pastedShare < 0.5) {
    out.push({
      code: "keystroke_deficit",
      severity: "medium",
      turnIdx: at,
      detail: `${t.chars} characters were submitted but only ${t.keystrokes} key presses were seen. Text may have arrived by a route other than typing — though a Chinese or Vietnamese input method that commits whole phrases can also produce this.`,
    });
  }

  if (t.peakCps >= CPS_IMPLAUSIBLE && t.chars >= MIN_CHARS_FOR_RATE) {
    out.push({
      code: "typing_rate_implausible",
      severity: "high",
      turnIdx: at,
      detail: `Peak sustained typing reached ${t.peakCps.toFixed(1)} characters per second over two seconds. A fast typist composing in a second language runs about 6–7.`,
    });
  } else if (t.peakCps >= CPS_FAST && t.chars >= MIN_CHARS_FOR_RATE) {
    out.push({
      code: "typing_rate_high",
      severity: "low",
      turnIdx: at,
      detail: `Peak sustained typing reached ${t.peakCps.toFixed(1)} characters per second — fast, and consistent with transcribing rather than composing.`,
    });
  }

  const stalled = t.firstKeystrokeMs != null && t.firstKeystrokeMs >= LONG_STALL_MS;
  if (stalled && t.peakCps >= CPS_FAST && t.chars >= MIN_CHARS_FOR_RATE) {
    out.push({
      code: "stall_then_burst",
      severity: "high",
      turnIdx: at,
      detail: `${Math.round((t.firstKeystrokeMs ?? 0) / 1000)}s passed before the first keystroke, then ${t.chars} characters went in at up to ${t.peakCps.toFixed(1)}/s. Thinking usually shows as typing and deleting, not as silence followed by a clean run.`,
    });
  }

  const away = Math.max(t.hiddenMs, t.blurMs);
  if (away >= AWAY_SERIOUS_MS) {
    out.push({
      code: "away_from_page",
      severity: "high",
      turnIdx: at,
      detail: `The tab was hidden or unfocused for ${Math.round(away / 1000)}s of the ${Math.round(seconds)}s spent on this question, across ${t.blurCount} switch${t.blurCount === 1 ? "" : "es"}.`,
    });
  } else if (away >= AWAY_NOTABLE_MS) {
    out.push({
      code: "away_from_page",
      severity: "medium",
      turnIdx: at,
      detail: `The tab was hidden or unfocused for ${Math.round(away / 1000)}s while this question was open.`,
    });
  }

  if (t.corrections === 0 && t.chars >= NO_CORRECTION_CHARS && t.pasteCount === 0) {
    out.push({
      code: "no_corrections",
      severity: "low",
      turnIdx: at,
      detail: `${t.chars} characters typed with no backspaces at all.`,
    });
  }

  // Over-running a stated cap is weak on its own. It earns its place because
  // length is the one habit a language model will not drop when asked: the cap
  // is set low (see prompts.ts) precisely so that ignoring it costs something.
  const words = Math.round(t.chars / 5.5);
  if (turn.wordCap > 0 && words > turn.wordCap * 2.5 && t.chars >= MIN_CHARS_FOR_RATE) {
    out.push({
      code: "over_word_cap",
      severity: "low",
      turnIdx: at,
      detail: `Roughly ${words} words against a stated cap of ${turn.wordCap}.`,
    });
  }

  return out;
}

const WEIGHT: Record<IntegritySignal["severity"], number> = {
  low: 3,
  medium: 9,
  high: 22,
};

/**
 * Roll per-turn signals, plus any interview-wide ones (register drift, claim
 * contradictions), into one score.
 *
 * Repeats of the SAME code are damped: a candidate on a bad connection will trip
 * `away_from_page` on every question, and eight copies of one circumstance is
 * one circumstance, not eight. The first occurrence of a code costs full weight,
 * each repeat a third.
 */
export function buildIntegrityReport(signals: IntegritySignal[]): IntegrityReport {
  const seen = new Map<string, number>();
  let penalty = 0;
  for (const s of signals) {
    const n = seen.get(s.code) ?? 0;
    penalty += n === 0 ? WEIGHT[s.severity] : WEIGHT[s.severity] / 3;
    seen.set(s.code, n + 1);
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const highs = signals.filter((s) => s.severity === "high").length;

  const verdict: IntegrityReport["verdict"] =
    score >= 80 && highs === 0 ? "clean" : score >= 55 && highs <= 1 ? "watch" : "review_required";

  return {
    score,
    verdict,
    signals: [...signals].sort(
      (a, b) => WEIGHT[b.severity] - WEIGHT[a.severity] || a.turnIdx - b.turnIdx
    ),
    caveat:
      "These are measurements of how the answers were composed, not evidence of dishonesty. A slow connection, a phone keyboard, an input method for Chinese or Vietnamese, or a candidate drafting elsewhere out of nerves all produce the same marks. Treat this as a reason to ask a question live, never as a reason to reject.",
  };
}

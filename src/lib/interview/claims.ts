/**
 * The claim ledger — the part an outside AI cannot help with.
 *
 * A helper on a second screen sees one question at a time. It does not have the
 * candidate's CV, and it does not have what the candidate said eleven minutes
 * ago. So the ledger seeds itself from the CV, grows with every answer, and the
 * interviewer keeps coming back to the same assertions from new angles. Pasting
 * one question elsewhere gets a fluent answer about nothing in particular;
 * pasting enough context to answer a consistency probe means pasting the whole
 * transcript, every turn, against a clock.
 *
 * Pure and deterministic: choosing WHAT to re-ask is bookkeeping, and bookkeeping
 * a model does is bookkeeping nobody can audit. The model writes the question;
 * this file decides which claim it is about.
 */
import type { Claim } from "./types";

/**
 * Turns before a probed claim is worth revisiting. Short enough to fit a
 * 12-question interview, long enough that the candidate is no longer holding
 * their earlier wording in their head — which is the whole point: an honest
 * answer re-derives the same facts, a recalled script drifts.
 */
export const RE_PROBE_GAP = 5;

export function claimId(text: string, salt: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9À-ỹ]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${salt}-${base || "claim"}`;
}

export function cvClaim(text: string, field: string): Claim {
  return {
    id: claimId(text, "cv"),
    text,
    source: "cv",
    field,
    turnIdx: null,
    status: "unprobed",
    probes: 0,
    lastProbedTurn: null,
    notes: "",
  };
}

export function answerClaim(text: string, turnIdx: number): Claim {
  return {
    id: claimId(text, `t${turnIdx}`),
    text,
    source: "answer",
    turnIdx,
    status: "unprobed",
    probes: 0,
    lastProbedTurn: null,
    notes: "",
  };
}

/**
 * Fold newly extracted claims into the ledger.
 *
 * Existing entries keep their status and probe history — the model re-states
 * claims it has already logged, and letting a re-statement reset `probes` to 0
 * would make the interviewer ask the same opening question forever. Only `notes`
 * and a status that has actually moved off "unprobed" are taken from the incoming
 * copy.
 */
export function mergeClaims(existing: Claim[], incoming: Claim[]): Claim[] {
  const byId = new Map(existing.map((c) => [c.id, c]));
  for (const next of incoming) {
    const prev = byId.get(next.id);
    if (!prev) {
      byId.set(next.id, next);
      continue;
    }
    byId.set(next.id, {
      ...prev,
      status: next.status !== "unprobed" ? next.status : prev.status,
      notes: next.notes.trim() ? next.notes : prev.notes,
      probes: Math.max(prev.probes, next.probes),
      lastProbedTurn:
        next.lastProbedTurn != null && (prev.lastProbedTurn == null || next.lastProbedTurn > prev.lastProbedTurn)
          ? next.lastProbedTurn
          : prev.lastProbedTurn,
    });
  }
  return [...byId.values()];
}

export function markProbed(claims: Claim[], ids: string[], turnIdx: number): Claim[] {
  const targeted = new Set(ids);
  return claims.map((c) =>
    targeted.has(c.id)
      ? {
          ...c,
          status: c.status === "unprobed" ? "probed" : c.status,
          probes: c.probes + 1,
          lastProbedTurn: turnIdx,
        }
      : c
  );
}

export interface NextTarget {
  claim: Claim;
  /** Why this one — the interviewer prompt uses it to pick the question's shape. */
  reason: "unprobed" | "due_for_consistency" | "contradicted";
}

/**
 * Which claim the next question should be about.
 *
 * Order of preference:
 *  1. a claim already flagged `contradicted` — an open conflict outranks new ground;
 *  2. a claim probed once and now far enough back to re-ask cold;
 *  3. an unprobed claim, CV-sourced first, because a CV claim is the one we can
 *     check against a document and the candidate cannot revise mid-interview.
 *
 * Returns null when everything is either fresh or already settled, which is the
 * signal to move to a scenario or to close.
 */
export function pickNextTarget(claims: Claim[], currentTurn: number): NextTarget | null {
  const contradicted = claims.find((c) => c.status === "contradicted" && c.probes < 3);
  if (contradicted) return { claim: contradicted, reason: "contradicted" };

  const due = claims
    .filter(
      (c) =>
        c.status === "probed" &&
        c.probes === 1 &&
        c.lastProbedTurn != null &&
        currentTurn - c.lastProbedTurn >= RE_PROBE_GAP
    )
    .sort((a, b) => (a.lastProbedTurn ?? 0) - (b.lastProbedTurn ?? 0))[0];
  if (due) return { claim: due, reason: "due_for_consistency" };

  const fresh = claims
    .filter((c) => c.status === "unprobed")
    .sort((a, b) => {
      if (a.source !== b.source) return a.source === "cv" ? -1 : 1;
      return (a.turnIdx ?? -1) - (b.turnIdx ?? -1);
    })[0];
  return fresh ? { claim: fresh, reason: "unprobed" } : null;
}

/**
 * CV fields worth planting a false premise in: each is a discrete, checkable
 * value the candidate wrote down themselves, so a wrong version of it is one an
 * honest candidate corrects without hesitating. Free text is excluded on
 * purpose — "you said you enjoy teamwork" has no wrong version to plant.
 */
export const FALSE_PREMISE_FIELDS = [
  "school",
  "major",
  "study level",
  "graduation year",
  "employer",
  "job title",
  "employment dates",
  "certification",
  "tool or system named in a work experience",
] as const;

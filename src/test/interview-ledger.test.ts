import { describe, expect, it } from "vitest";

import { RE_PROBE_GAP, answerClaim, cvClaim, markProbed, mergeClaims, pickNextTarget } from "@/lib/interview/claims";
import { DRIFT_THRESHOLD, baseline, distance, profile } from "@/lib/interview/register";
import { publicQuestion } from "@/lib/interview/service";
import type { Claim } from "@/lib/interview/types";

describe("the claim ledger — what the interviewer comes back to", () => {
  it("keeps probe history when the model re-states a claim it already logged", () => {
    // The model re-emits claims each turn. If a re-statement reset the counter,
    // the interviewer would ask its opening question about the same claim for
    // the whole interview and never reach a consistency check.
    const seeded = markProbed([cvClaim("Cut pick error at the Taichung DC", "work")], [
      cvClaim("Cut pick error at the Taichung DC", "work").id,
    ], 2);
    const merged = mergeClaims(seeded, [cvClaim("Cut pick error at the Taichung DC", "work")]);

    expect(merged).toHaveLength(1);
    expect(merged[0].probes).toBe(1);
    expect(merged[0].lastProbedTurn).toBe(2);
    expect(merged[0].status).toBe("probed");
  });

  it("takes a status that has moved, but never un-probes one that has not", () => {
    const base = markProbed([cvClaim("Led the WMS rollout", "work")], [cvClaim("Led the WMS rollout", "work").id], 1);
    const contradicted: Claim = { ...base[0], status: "contradicted", notes: "dates do not line up" };

    expect(mergeClaims(base, [contradicted])[0].status).toBe("contradicted");
    expect(mergeClaims(contradicted ? [contradicted] : [], [{ ...base[0], status: "unprobed", notes: "" }])[0].status).toBe(
      "contradicted"
    );
  });

  it("puts an open contradiction ahead of new ground", () => {
    const fresh = cvClaim("Holds a TOCFL level 4", "certification");
    const conflict: Claim = { ...answerClaim("The line ran three shifts", 3), status: "contradicted", probes: 1, lastProbedTurn: 3 };
    expect(pickNextTarget([fresh, conflict], 6)?.reason).toBe("contradicted");
  });

  it("waits before re-asking a claim, so the candidate is re-deriving rather than reciting", () => {
    const probed = markProbed([cvClaim("Ran a team of 12", "work")], [cvClaim("Ran a team of 12", "work").id], 2);

    // Too soon: they still have their own wording in their head, and matching it
    // proves only that they have a memory.
    expect(pickNextTarget(probed, 2 + RE_PROBE_GAP - 1)?.reason).not.toBe("due_for_consistency");
    expect(pickNextTarget(probed, 2 + RE_PROBE_GAP)?.reason).toBe("due_for_consistency");
  });

  it("drills CV claims before claims the candidate made in the room", () => {
    // A CV claim is the one that can be checked against a document and cannot be
    // revised mid-interview, so it is worth more per question.
    const fromAnswer = answerClaim("I handle supplier calls in Mandarin", 1);
    const fromCv = cvClaim("Internship at 麗明營造, 2024", "work");
    expect(pickNextTarget([fromAnswer, fromCv], 4)?.claim.id).toBe(fromCv.id);
  });

  it("returns nothing when the ledger is settled, which is the cue to move to a scenario", () => {
    const settled: Claim[] = [{ ...cvClaim("x", "work"), status: "corroborated", probes: 2, lastProbedTurn: 3 }];
    expect(pickNextTarget(settled, 9)).toBeNull();
  });
});

describe("writing register — the drift measure and its limits", () => {
  const plain = [
    "I work night shift at the warehouse. My job is check the picking list and fix error.",
    "Before we have many mistake in packing. I make a small checklist for the team.",
  ];

  it("scores a candidate's own plain prose as close to itself", () => {
    expect(distance(baseline(plain), profile(plain.join(" ")))).toBeLessThan(DRIFT_THRESHOLD);
  });

  it("separates that from prose with model discourse markers and longer clauses", () => {
    const polished =
      "Firstly, I established a structured verification process for inbound shipments, which significantly reduced discrepancies. " +
      "Furthermore, I collaborated with the logistics team to implement comprehensive documentation standards. " +
      "Consequently, operational accuracy improved substantially across the subsequent quarter.";
    expect(distance(baseline(plain), profile(polished))).toBeGreaterThanOrEqual(DRIFT_THRESHOLD);
  });

  it("refuses to judge a sample too short to carry the measure", () => {
    // One-line answers are common and legitimate; a distance computed from
    // fifteen words is arithmetic, not evidence.
    expect(distance(baseline(plain), profile("Yes, about three months."))).toBe(0);
  });
});

describe("the candidate-facing allow-list", () => {
  it("never carries the answer key out to the browser", () => {
    // The single most important boundary in this feature. `lookingFor` says what
    // a good answer contains and `plantedError` names the detail we deliberately
    // got wrong — either one reaching the candidate turns a screening interview
    // into an open-book exercise that still produces a confident score.
    const shaped = publicQuestion({
      idx: 4,
      question: "What was the scrap rate before you changed the jig?",
      timeLimitSec: 90,
      wordCap: 45,
      // Extra fields are what a future `Probe` will bring. They must not pass.
      ...({
        lookingFor: "A number, a basis, and who measured it.",
        plantedError: { asserted: "Oracle WMS", actual: "the CV says SAP" },
        targets: ["cv-scrap-rate"],
        kind: "cv_drill",
      } as Record<string, unknown>),
    });

    expect(Object.keys(shaped).sort()).toEqual(["idx", "question", "timeLimitSec", "total", "wordCap"]);
  });
});

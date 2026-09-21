import { describe, expect, it } from "vitest";

import { buildIntegrityReport, scoreTurn } from "@/lib/interview/telemetry";
import { EMPTY_TELEMETRY, type TurnTelemetry } from "@/lib/interview/types";

function telemetry(over: Partial<TurnTelemetry>): TurnTelemetry {
  return { ...EMPTY_TELEMETRY, ...over };
}

const codes = (s: { code: string }[]) => s.map((x) => x.code);

describe("composition integrity — what each measurement is allowed to mean", () => {
  it("says nothing about a short answer, however it arrived", () => {
    // Below the rate floor every ratio is noise: a 30-character answer typed in
    // one burst is a normal answer, and flagging it would bury the real signals
    // under one per question.
    const signals = scoreTurn({
      turnIdx: 0,
      wordCap: 40,
      telemetry: telemetry({ chars: 30, keystrokes: 2, elapsedMs: 1500, peakCps: 20 }),
    });
    expect(signals).toEqual([]);
  });

  it("flags a pasted answer, and separates a big paste from a small one", () => {
    const mostly = scoreTurn({
      turnIdx: 3,
      wordCap: 40,
      telemetry: telemetry({ chars: 400, pastedChars: 380, pasteCount: 1, keystrokes: 20, elapsedMs: 9000 }),
    });
    expect(codes(mostly)).toContain("pasted_answer");
    expect(mostly.find((s) => s.code === "pasted_answer")?.severity).toBe("high");

    // A quoted term or a corrected typo is not the same event and must not read
    // as one on a recruiter's screen.
    const little = scoreTurn({
      turnIdx: 3,
      wordCap: 40,
      telemetry: telemetry({ chars: 400, pastedChars: 12, pasteCount: 1, keystrokes: 420, elapsedMs: 60000 }),
    });
    expect(codes(little)).toContain("paste_used");
    expect(codes(little)).not.toContain("pasted_answer");
  });

  it("keeps the keystroke-deficit signal at medium, because an IME produces it honestly", () => {
    const signals = scoreTurn({
      turnIdx: 2,
      wordCap: 40,
      telemetry: telemetry({ chars: 300, keystrokes: 100, elapsedMs: 40000 }),
    });
    const deficit = signals.find((s) => s.code === "keystroke_deficit");
    expect(deficit?.severity).toBe("medium");
    // The explanation must carry the innocent reading — a recruiter who reads
    // only the headline is the person this wording is for.
    expect(deficit?.detail).toMatch(/input method/i);
  });

  it("does not double-count a paste as a keystroke deficit", () => {
    // One event, one signal. Reporting the same paste twice inflates the penalty
    // and makes the score look like two independent problems.
    const signals = scoreTurn({
      turnIdx: 1,
      wordCap: 40,
      telemetry: telemetry({ chars: 500, pastedChars: 480, pasteCount: 1, keystrokes: 20, elapsedMs: 8000 }),
    });
    expect(codes(signals)).toContain("pasted_answer");
    expect(codes(signals)).not.toContain("keystroke_deficit");
  });

  it("flags a long silence followed by a clean fast run", () => {
    const signals = scoreTurn({
      turnIdx: 6,
      wordCap: 40,
      telemetry: telemetry({
        chars: 612,
        keystrokes: 640,
        corrections: 0,
        firstKeystrokeMs: 41_000,
        elapsedMs: 50_000,
        peakCps: 11,
        hiddenMs: 38_000,
      }),
    });
    expect(codes(signals)).toEqual(expect.arrayContaining(["stall_then_burst", "away_from_page"]));
  });

  it("treats a candidate who thinks, types, deletes and retypes as clean", () => {
    const signals = scoreTurn({
      turnIdx: 4,
      wordCap: 45,
      telemetry: telemetry({
        chars: 210,
        keystrokes: 260,
        corrections: 31,
        firstKeystrokeMs: 4_000,
        elapsedMs: 88_000,
        peakCps: 4.2,
      }),
    });
    expect(signals).toEqual([]);
  });

  it("damps repeats of one code, so a bad connection is one circumstance not eight", () => {
    const once = buildIntegrityReport([
      { code: "away_from_page", severity: "medium", detail: "", turnIdx: 1 },
    ]);
    const eight = buildIntegrityReport(
      Array.from({ length: 8 }, (_, i) => ({
        code: "away_from_page" as const,
        severity: "medium" as const,
        detail: "",
        turnIdx: i,
      }))
    );
    expect(once.score).toBe(91);
    // Eight of the same thing costs more than one, but nowhere near eight times
    // more — otherwise every candidate on a phone fails the integrity check.
    expect(eight.score).toBeGreaterThan(60);
    expect(eight.score).toBeLessThan(once.score);
  });

  it("escalates on the second high-severity flag, not the first", () => {
    // The ladder is deliberate. One high flag means "read that question" —
    // which a recruiter can act on. Calling a whole interview unreliable on one
    // event would fire on every candidate who pasted a term they had looked up,
    // and a verdict that fires constantly is one nobody reads.
    const one = buildIntegrityReport([
      { code: "pasted_answer", severity: "high", detail: "", turnIdx: 0 },
    ]);
    expect(one.verdict).toBe("watch");

    const two = buildIntegrityReport([
      { code: "pasted_answer", severity: "high", detail: "", turnIdx: 0 },
      { code: "stall_then_burst", severity: "high", detail: "", turnIdx: 5 },
    ]);
    expect(two.verdict).toBe("review_required");
  });

  it("never returns a score without the caveat attached", () => {
    const report = buildIntegrityReport([
      { code: "pasted_answer", severity: "high", detail: "", turnIdx: 0 },
    ]);
    expect(report.caveat).toMatch(/never as a reason to reject/i);
  });

  it("calls a clean interview clean", () => {
    const report = buildIntegrityReport([]);
    expect(report).toMatchObject({ score: 100, verdict: "clean" });
  });
});

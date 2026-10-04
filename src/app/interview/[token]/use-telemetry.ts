"use client";

import { useCallback, useEffect, useRef } from "react";

import { EMPTY_TELEMETRY, type TurnTelemetry } from "@/lib/interview/types";

/**
 * Measures how one answer was composed.
 *
 * Counts and durations only. It never records which keys were pressed, never
 * reads the clipboard's contents (only how many characters a paste inserted),
 * and stops at the edge of this page — there is no way for a web page to see
 * another tab, and this does not pretend otherwise. What it CAN see is that
 * this tab stopped being the visible one, which is the honest version of the
 * same question.
 *
 * Every number here is disclosed on the consent screen before the interview
 * starts, in the same words the scorer uses to report it.
 */

interface Sample {
  t: number;
  len: number;
}

interface Mutable {
  shownAt: number;
  firstKeystrokeAt: number | null;
  keystrokes: number;
  corrections: number;
  pasteCount: number;
  pastedChars: number;
  blurCount: number;
  blurMs: number;
  blurredAt: number | null;
  hiddenMs: number;
  hiddenAt: number | null;
  /** Only the last WINDOW_MS of samples — enough to extend the running peak. */
  samples: Sample[];
  /** Running maximum, kept incrementally so pruning the window cannot lose it. */
  peak: number;
}

function fresh(): Mutable {
  return {
    shownAt: Date.now(),
    firstKeystrokeAt: null,
    keystrokes: 0,
    corrections: 0,
    pasteCount: 0,
    pastedChars: 0,
    blurCount: 0,
    blurMs: 0,
    blurredAt: null,
    hiddenMs: 0,
    hiddenAt: null,
    samples: [],
    peak: 0,
  };
}

/** Window for the sustained-rate measure. Two seconds smooths out a fast burst of one word. */
const WINDOW_MS = 2_000;
/** Shorter than this and the rate is dominated by a single keypress. */
const MIN_SPAN_MS = 900;

export function peakCps(samples: Sample[]): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      const span = samples[j].t - samples[i].t;
      if (span < MIN_SPAN_MS) continue;
      if (span > WINDOW_MS) break;
      const gained = samples[j].len - samples[i].len;
      if (gained <= 0) continue;
      peak = Math.max(peak, gained / (span / 1000));
    }
  }
  return peak;
}

export interface Telemetry {
  /** Call when a new question appears. */
  reset: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  /** Call on every value change, with the new length. */
  onChange: (length: number) => void;
  snapshot: (finalLength: number) => TurnTelemetry;
}

export function useTelemetry(): Telemetry {
  const m = useRef<Mutable>(fresh());

  useEffect(() => {
    const onBlur = () => {
      if (m.current.blurredAt == null) {
        m.current.blurredAt = Date.now();
        m.current.blurCount += 1;
      }
    };
    const onFocus = () => {
      if (m.current.blurredAt != null) {
        m.current.blurMs += Date.now() - m.current.blurredAt;
        m.current.blurredAt = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (m.current.hiddenAt == null) m.current.hiddenAt = Date.now();
      } else if (m.current.hiddenAt != null) {
        m.current.hiddenMs += Date.now() - m.current.hiddenAt;
        m.current.hiddenAt = null;
      }
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const reset = useCallback(() => {
    m.current = fresh();
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === "Backspace" || k === "Delete") {
      m.current.corrections += 1;
      return;
    }
    // `key.length === 1` is a printable character. "Process" and "Unidentified"
    // are what an IME reports while composing — Chinese pinyin and Vietnamese
    // telex both go through here, and dropping them would make every candidate
    // typing in their own language look like they had pasted their answer.
    if (k.length === 1 || k === "Process" || k === "Unidentified") {
      m.current.keystrokes += 1;
      if (m.current.firstKeystrokeAt == null) m.current.firstKeystrokeAt = Date.now();
    }
  }, []);

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    // Length only. What was pasted is the candidate's business; how much of the
    // answer they did not type is the hiring team's.
    const text = e.clipboardData?.getData("text") ?? "";
    m.current.pasteCount += 1;
    m.current.pastedChars += text.length;
  }, []);

  const onChange = useCallback((length: number) => {
    const now = Date.now();
    const c = m.current;
    c.samples.push({ t: now, len: length });
    // Extend the running peak against everything still in the window, THEN prune.
    // Computing the peak once at the end over a pruned array would only ever see
    // the last two seconds of a three-minute answer — which is exactly the part
    // a candidate finishing slowly spends fixing typos in.
    c.peak = Math.max(c.peak, peakCps(c.samples));
    const cutoff = now - WINDOW_MS;
    while (c.samples.length > 2 && c.samples[0].t < cutoff) c.samples.shift();
    if (c.firstKeystrokeAt == null && length > 0) c.firstKeystrokeAt = now;
  }, []);

  const snapshot = useCallback((finalLength: number): TurnTelemetry => {
    const c = m.current;
    const now = Date.now();
    // Close any interval still open: submitting while the tab is hidden (a
    // keyboard shortcut, a script) would otherwise report zero time away.
    const blurMs = c.blurMs + (c.blurredAt != null ? now - c.blurredAt : 0);
    const hiddenMs = c.hiddenMs + (c.hiddenAt != null ? now - c.hiddenAt : 0);
    return {
      ...EMPTY_TELEMETRY,
      firstKeystrokeMs: c.firstKeystrokeAt != null ? c.firstKeystrokeAt - c.shownAt : null,
      elapsedMs: now - c.shownAt,
      chars: finalLength,
      keystrokes: c.keystrokes,
      corrections: c.corrections,
      pasteCount: c.pasteCount,
      pastedChars: c.pastedChars,
      blurCount: c.blurCount,
      blurMs,
      hiddenMs,
      peakCps: Number(Math.max(c.peak, peakCps(c.samples)).toFixed(2)),
    };
  }, []);

  return { reset, onKeyDown, onPaste, onChange, snapshot };
}

"use client";

/**
 * Tiny ring buffer that captures the last 20 client-side errors and unhandled
 * promise rejections so the feedback form can attach them to a bug report.
 *
 * Lives only in memory on the current tab. We never read clipboard / DOM /
 * other tabs, and never send anything until the user submits feedback.
 */

export type FeedbackLogEntry = {
  ts: number;
  type: "error" | "unhandledrejection";
  message: string;
  source?: string;
  stack?: string;
};

const MAX = 20;
const buf: FeedbackLogEntry[] = [];
let installed = false;

function push(entry: FeedbackLogEntry) {
  buf.push(entry);
  if (buf.length > MAX) buf.shift();
}

export function installFeedbackLogBuffer() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    push({
      ts: Date.now(),
      type: "error",
      message: e.message ?? String(e.error ?? "unknown"),
      source: e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : undefined,
      stack: e.error?.stack ? truncate(String(e.error.stack), 1500) : undefined,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    push({
      ts: Date.now(),
      type: "unhandledrejection",
      message: typeof reason === "string" ? reason : reason?.message ?? "unhandled rejection",
      stack: reason?.stack ? truncate(String(reason.stack), 1500) : undefined,
    });
  });
}

export function getFeedbackLogs(): FeedbackLogEntry[] {
  return buf.slice(-MAX);
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

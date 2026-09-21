"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { InterviewBrief, PublicQuestion } from "@/lib/interview/service";

import { useTelemetry } from "./use-telemetry";

type Phase = "loading" | "consent" | "asking" | "thinking" | "done" | "closed" | "error";

interface Exchange {
  question: string;
  answer: string;
}

function countWords(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

export function InterviewRoom({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [brief, setBrief] = useState<InterviewBrief | null>(null);
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [history, setHistory] = useState<Exchange[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  const telemetry = useTelemetry();
  const boxRef = useRef<HTMLTextAreaElement>(null);
  // Submitting is guarded by a ref, not by `phase`: the timer's auto-submit and a
  // click on the button can land in the same tick, and two submissions of one
  // answer means the second is dropped by the server and the candidate sees a
  // question they have already been asked.
  const sending = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/ai-interviews/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!alive) return;
        if (!r.ok) {
          setError(data.error ?? "This interview link is not valid.");
          setPhase("error");
          return;
        }
        setBrief(data);
        if (data.status === "completed") setPhase("done");
        else if (data.status === "expired" || data.status === "abandoned") {
          setError(
            data.status === "expired"
              ? "This interview link has expired. Ask the recruiter for a new one."
              : "This interview was closed."
          );
          setPhase("error");
        } else if (data.status === "in_progress" && data.current) {
          setQuestion(data.current);
          setPhase("asking");
        } else {
          setPhase("consent");
        }
      })
      .catch(() => {
        if (alive) {
          setError("Could not reach the interview.");
          setPhase("error");
        }
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const present = useCallback(
    (q: PublicQuestion) => {
      setQuestion(q);
      setDraft("");
      telemetry.reset();
      setSecondsLeft(q.timeLimitSec);
      setPhase("asking");
      // Focus after paint, so the clock and the answer box start together.
      requestAnimationFrame(() => boxRef.current?.focus());
    },
    [telemetry]
  );

  const send = useCallback(
    async (text: string) => {
      if (sending.current || !question) return;
      sending.current = true;
      const snapshot = telemetry.snapshot(text.length);
      setHistory((h) => [...h, { question: question.question, answer: text }]);
      setPhase("thinking");
      try {
        const res = await fetch(`/api/ai-interviews/${token}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idx: question.idx, answer: text, telemetry: snapshot }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not send that answer.");
          setPhase("error");
          return;
        }
        if (data.done) setPhase("done");
        else present(data.question);
      } catch {
        setError("Your connection dropped. Reload this page to pick up where you left off.");
        setPhase("error");
      } finally {
        sending.current = false;
      }
    },
    [present, question, telemetry, token]
  );

  // The clock. Running out submits whatever is in the box, including nothing —
  // an unanswered question is an answer, and stopping the interview because
  // somebody froze would throw away everything they had already given.
  useEffect(() => {
    if (phase !== "asking") return;
    if (secondsLeft <= 0) {
      void send(draft);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsLeft, draft, send]);

  const begin = async () => {
    setPhase("thinking");
    try {
      const res = await fetch(`/api/ai-interviews/${token}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start the interview.");
        setPhase("error");
        return;
      }
      present(data.question);
    } catch {
      setError("Could not start the interview.");
      setPhase("error");
    }
  };

  const stop = async () => {
    await fetch(`/api/ai-interviews/${token}/answer`, { method: "DELETE" });
    setPhase("closed");
  };

  if (phase === "loading") {
    return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  }

  if (phase === "error") {
    return (
      <Shell>
        <h1 className="text-lg font-semibold">Interview unavailable</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
      </Shell>
    );
  }

  if (phase === "closed") {
    return (
      <Shell>
        <h1 className="text-lg font-semibold">Interview stopped</h1>
        <p className="mt-2 text-muted-foreground">
          Thanks for the time you gave. The hiring team will see what you answered and that the
          interview was not finished.
        </p>
      </Shell>
    );
  }

  if (phase === "done") {
    return (
      <Shell>
        <h1 className="text-lg font-semibold">That is everything — thank you.</h1>
        <p className="mt-2 text-muted-foreground">
          {brief?.company ? `${brief.company}'s` : "The"} hiring team will review your answers and
          come back to you. Nothing else is needed from you now.
        </p>
      </Shell>
    );
  }

  if (phase === "consent") {
    return (
      <Shell>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Screening interview
        </p>
        <h1 className="mt-1 text-xl font-semibold">
          {brief?.jobTitle}
          {brief?.company ? ` · ${brief.company}` : ""}
        </h1>
        <p className="mt-4 text-muted-foreground">
          Hello {brief?.candidateName}. This is a short written interview — about{" "}
          {brief?.totalQuestions} questions, roughly 20 minutes. Before you start, here is exactly
          what happens and what is recorded.
        </p>
        <ul className="mt-5 space-y-2.5">
          {brief?.disclosures.map((d) => (
            <li key={d} className="flex gap-2.5 text-sm text-muted-foreground">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
          Answer in your own words. Short is good — every question has a word guide, and a specific
          two-line answer scores better here than a polished paragraph.
        </p>
        <Button size="lg" className="mt-6" onClick={begin}>
          I understand — start the interview
        </Button>
      </Shell>
    );
  }

  const words = countWords(draft);
  const overCap = question ? words > question.wordCap : false;
  const urgent = secondsLeft <= 15;

  return (
    <Shell wide>
      <header className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{brief?.jobTitle}</p>
          <p className="truncate text-xs text-muted-foreground">{brief?.company}</p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
          Question {(question?.idx ?? 0) + 1} of {question?.total}
        </p>
      </header>

      <div className="mt-5 space-y-5">
        {history.slice(-2).map((x, i) => (
          <div key={i} className="space-y-1.5 opacity-55">
            <p className="text-sm">{x.question}</p>
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              {x.answer || <em>No answer given</em>}
            </p>
          </div>
        ))}

        {phase === "thinking" ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Thinking about your answer…
          </p>
        ) : null}

        {phase === "asking" && question ? (
          <div>
            <p className="text-base leading-relaxed font-medium" aria-live="polite">
              {question.question}
            </p>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs tabular-nums">
              <span className={overCap ? "text-destructive" : "text-muted-foreground"}>
                {words} / {question.wordCap} words
              </span>
              <span
                className={urgent ? "font-medium text-destructive" : "text-muted-foreground"}
                role="timer"
                aria-live="off"
              >
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </span>
            </div>

            <textarea
              ref={boxRef}
              value={draft}
              rows={5}
              placeholder="Your answer…"
              className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              onKeyDown={(e) => {
                telemetry.onKeyDown(e);
                // Enter submits, Shift+Enter breaks the line. The clock is
                // running; reaching for the mouse costs seconds the candidate
                // did nothing to deserve losing.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (draft.trim()) void send(draft);
                }
              }}
              onPaste={telemetry.onPaste}
              onChange={(e) => {
                setDraft(e.target.value);
                telemetry.onChange(e.target.value.length);
              }}
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <Button size="lg" onClick={() => void send(draft)} disabled={!draft.trim()}>
                Send answer
              </Button>
              <button
                type="button"
                onClick={() => void stop()}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Stop the interview
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-5 py-10">
      <div className={wide ? "w-full" : "w-full max-w-xl"}>{children}</div>
    </main>
  );
}

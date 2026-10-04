"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecruiterView } from "@/lib/interview/service";
import type { IntegritySignal } from "@/lib/interview/types";

type Locale = "zh" | "en";

const T: Record<Locale, Record<string, string>> = {
  zh: {
    title: "AI 初篩面試",
    none: "尚未進行 AI 初篩面試。",
    invite: "產生面試連結",
    creating: "產生中…",
    copied: "已複製",
    copy: "複製連結",
    sent: "連結已產生。傳給候選人，無需登入即可作答。",
    waiting: "已寄出，候選人尚未開始。",
    running: "面試進行中。",
    writing: "面試已結束，報告產生中。重新整理即可查看。",
    fit: "職務適配",
    rec: "建議",
    competencies: "能力評估",
    unsupported: "無法佐證的陳述",
    strengths: "優勢",
    concerns: "疑慮",
    next: "請人資接續追問",
    integrity: "作答過程檢查",
    transcript: "逐字紀錄",
    lookingFor: "評分重點",
    planted: "刻意植入的錯誤前提",
    noAnswer: "未作答",
    disclaimer: "AI 初篩僅供參考，最終決定由人決定。",
  },
  en: {
    title: "AI screening interview",
    none: "No AI screening interview yet.",
    invite: "Create interview link",
    creating: "Creating…",
    copied: "Copied",
    copy: "Copy link",
    sent: "Link created. Send it to the candidate — no account needed.",
    waiting: "Sent. The candidate has not started yet.",
    running: "Interview in progress.",
    writing: "Interview finished; the report is being written. Reload to see it.",
    fit: "Fit",
    rec: "Recommendation",
    competencies: "Competencies",
    unsupported: "Claims that did not stand up",
    strengths: "Strengths",
    concerns: "Concerns",
    next: "For the human interviewer",
    integrity: "How the answers were composed",
    transcript: "Transcript",
    lookingFor: "What a good answer contains",
    planted: "Deliberately wrong detail planted here",
    noAnswer: "No answer given",
    disclaimer: "A screening aid. A person makes the decision.",
  },
};

const REC_LABEL: Record<string, Record<Locale, string>> = {
  strong_yes: { zh: "強烈推薦", en: "Strong yes" },
  yes: { zh: "推薦", en: "Yes" },
  no: { zh: "不推薦", en: "No" },
  strong_no: { zh: "強烈不推薦", en: "Strong no" },
  inconclusive: { zh: "資訊不足", en: "Inconclusive" },
};

const REC_STYLE: Record<string, string> = {
  strong_yes: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  yes: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  no: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  strong_no: "bg-destructive/15 text-destructive",
  inconclusive: "bg-muted text-muted-foreground",
};

const SEVERITY_STYLE: Record<IntegritySignal["severity"], string> = {
  high: "text-destructive",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-muted-foreground",
};

export function AiInterviewPanel({
  applicationId,
  locale,
}: {
  applicationId: number;
  locale: Locale;
}) {
  const t = T[locale];
  const [view, setView] = useState<RecruiterView | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/ai-interview`);
      const data = await res.json();
      if (res.ok) setView(data.interview ?? null);
    } catch {
      /* a panel that cannot load is empty, not broken — the rest of the drawer still works */
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/ai-interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create the link.");
        return;
      }
      setLink(`${window.location.origin}${data.path}`);
      await load();
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    const url = link || (view ? `${window.location.origin}/interview/${view.token}` : "");
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return (
      <Section title={t.title}>
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </Section>
    );
  }

  if (!view) {
    return (
      <Section title={t.title}>
        <p className="text-sm text-muted-foreground">{t.none}</p>
        <Button size="sm" className="mt-2.5" onClick={() => void invite()} disabled={creating}>
          {creating ? t.creating : t.invite}
        </Button>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </Section>
    );
  }

  if (view.status === "invited" || view.status === "in_progress") {
    return (
      <Section title={t.title}>
        <p className="text-sm text-muted-foreground">
          {view.status === "invited" ? t.waiting : t.running}
        </p>
        <Button size="sm" variant="outline" className="mt-2.5" onClick={() => void copy()}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? t.copied : t.copy}
        </Button>
      </Section>
    );
  }

  if (!view.report) {
    return (
      <Section title={t.title}>
        <p className="text-sm text-muted-foreground">{t.writing}</p>
      </Section>
    );
  }

  const r = view.report;

  return (
    <Section title={t.title}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={cn("border-0", REC_STYLE[r.recommendation] ?? REC_STYLE.inconclusive)}>
          {REC_LABEL[r.recommendation]?.[locale] ?? r.recommendation}
        </Badge>
        <span className="text-xs text-muted-foreground tabular-nums">
          {t.fit} {r.fitScore}/100
        </span>
        {view.integrity ? <IntegrityBadge integrity={view.integrity} /> : null}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground">{r.summary}</p>

      <Block label={t.competencies}>
        <ul className="space-y-2.5">
          {r.competencies.map((c) => (
            <li key={c.name}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{c.name}</p>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {c.rating}/4
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.evidence}</p>
              {c.quotes.map((q, i) => (
                <p
                  key={i}
                  className="mt-1 border-l-2 border-border pl-2 text-xs text-muted-foreground italic"
                >
                  “{q}”
                </p>
              ))}
            </li>
          ))}
        </ul>
      </Block>

      {r.unsupportedClaims.length ? (
        <Block label={t.unsupported}>
          <ul className="space-y-2">
            {r.unsupportedClaims.map((u, i) => (
              <li key={i} className="text-xs">
                <p className="font-medium text-foreground">{u.claim}</p>
                <p className="text-muted-foreground">{u.whatHappened}</p>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {r.strengths.length ? <Bullets label={t.strengths} items={r.strengths} /> : null}
      {r.concerns.length ? <Bullets label={t.concerns} items={r.concerns} /> : null}
      <Bullets label={t.next} items={r.followUpForHuman} />

      {view.integrity ? (
        <Block label={t.integrity}>
          {view.integrity.signals.length ? (
            <ul className="space-y-1.5">
              {view.integrity.signals.map((s, i) => (
                <li key={i} className={cn("flex gap-2 text-xs", SEVERITY_STYLE[s.severity])}>
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                  <span>
                    {s.turnIdx >= 0 ? <b className="tabular-nums">Q{s.turnIdx + 1} · </b> : null}
                    {s.detail}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nothing unusual was measured in how the answers were composed.
            </p>
          )}
          {/* The caveat travels with the signals, always. A list of flags with
              the qualification stripped off is how a circumstantial measurement
              becomes a rejection. */}
          <p className="mt-2.5 rounded-lg bg-muted/60 p-2.5 text-xs leading-relaxed text-muted-foreground">
            {view.integrity.caveat}
          </p>
        </Block>
      ) : null}

      <Block label={t.transcript}>
        <ol className="space-y-3">
          {view.turns.map((turn) => (
            <li key={turn.idx}>
              <p className="text-xs font-medium text-foreground">
                <span className="tabular-nums text-muted-foreground">Q{turn.idx + 1}. </span>
                {turn.question}
              </p>
              <p className="mt-1 rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                {turn.answer || <em>{t.noAnswer}</em>}
              </p>
              {turn.plantedError ? (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {t.planted}: “{turn.plantedError.asserted}” — {turn.plantedError.actual}
                </p>
              ) : null}
              {turn.lookingFor ? (
                <p className="mt-1 text-xs text-muted-foreground/80">
                  {t.lookingFor}: {turn.lookingFor}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </Block>

      <p className="mt-4 text-xs text-muted-foreground">{t.disclaimer}</p>
    </Section>
  );
}

function IntegrityBadge({ integrity }: { integrity: NonNullable<RecruiterView["integrity"]> }) {
  const clean = integrity.verdict === "clean";
  const Icon = clean ? ShieldCheck : ShieldAlert;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        clean ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"
      )}
      title={integrity.caveat}
    >
      <Icon className="size-3.5" />
      <span className="tabular-nums">{integrity.score}/100</span>
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-border/60 pt-3">
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function Bullets({ label, items }: { label: string; items: string[] }) {
  return (
    <Block label={label}>
      <ul className="space-y-1">
        {items.map((s, i) => (
          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
            <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </Block>
  );
}

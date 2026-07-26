"use client";

import { Users, UserCheck, Percent, Clock } from "lucide-react";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PipelineReport } from "@/lib/pipeline-report";
import type { StageKind } from "@/lib/pipeline-types";

type Locale = "zh" | "en";

const T: Record<Locale, Record<string, string>> = {
  zh: {
    title: "招募分析 Reports",
    subtitle: "招募漏斗 · 各階段停留天數 · 媒合成效",
    candidates: "候選人總數",
    placements: "媒合成功",
    placementRate: "成功率",
    avgDays: "平均停留天數",
    funnel: "招募漏斗",
    days: "天",
    aging: "停留最久的候選人",
    candidate: "候選人",
    position: "職位",
    stage: "階段",
    inStage: "停留天數",
    none: "目前沒有候選人在流程中",
  },
  en: {
    title: "Reports",
    subtitle: "Pipeline funnel · time-in-stage · placement performance",
    candidates: "Candidates",
    placements: "Placements",
    placementRate: "Placement rate",
    avgDays: "Avg days in stage",
    funnel: "Pipeline funnel",
    days: "d",
    aging: "Longest in stage",
    candidate: "Candidate",
    position: "Position",
    stage: "Stage",
    inStage: "Days in stage",
    none: "No candidates currently in the pipeline",
  },
};

const STAGE_KIND_LABEL: Record<string, Record<Locale, string>> = {
  sourced: { zh: "收到履歷", en: "Applied" },
  screened: { zh: "初步篩選", en: "Screening" },
  internal_submit: { zh: "內部推薦", en: "Internal" },
  client_submit: { zh: "推薦客戶", en: "Client submit" },
  interview: { zh: "安排面試", en: "Interview" },
  offer: { zh: "發送錄取", en: "Offer" },
  placed: { zh: "到職", en: "Hired" },
  onboarding: { zh: "報到準備", en: "Onboarding" },
  started: { zh: "已上工", en: "Started" },
  rejected: { zh: "未錄取", en: "Rejected" },
};

const STAGE_KIND_ACCENT: Record<string, string> = {
  sourced: "#64748b",
  screened: "#2563eb",
  internal_submit: "#0ea5e9",
  client_submit: "#6366f1",
  interview: "#d97706",
  offer: "#7c3aed",
  placed: "#059669",
  onboarding: "#0d9488",
  started: "#16a34a",
  rejected: "#dc2626",
};

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex flex-row items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

export function PipelineReportView({ report }: { report: PipelineReport }) {
  const { locale } = useRecruiterI18n();
  const loc: Locale = locale === "zh-TW" ? "zh" : "en";
  const t = T[loc];
  const kindLabel = (k: StageKind) => STAGE_KIND_LABEL[k]?.[loc] ?? k;
  const maxCount = Math.max(1, ...report.funnel.map((f) => f.count));

  return (
    <section aria-label={t.title}>
      <div className="mb-4">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {t.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={Users} label={t.candidates} value={String(report.metrics.candidates)} />
        <Metric icon={UserCheck} label={t.placements} value={String(report.metrics.placements)} />
        <Metric
          icon={Percent}
          label={t.placementRate}
          value={`${Math.round(report.metrics.placementRate * 100)}%`}
        />
        <Metric
          icon={Clock}
          label={t.avgDays}
          value={`${report.metrics.avgDaysInStage}${t.days}`}
        />
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t.funnel}
      </p>
      <Card className="mb-6 space-y-2 p-4">
        {report.funnel.map((f) => (
          <div key={f.stageKind} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-medium" style={{ color: STAGE_KIND_ACCENT[f.stageKind] }}>
              {kindLabel(f.stageKind)}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded bg-muted/50">
              <div
                className="flex h-full items-center rounded px-2 text-[11px] font-semibold text-white transition-all"
                style={{
                  width: `${Math.max(6, (f.count / maxCount) * 100)}%`,
                  background: STAGE_KIND_ACCENT[f.stageKind],
                }}
              >
                {f.count}
              </div>
            </div>
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {f.avgDays}
              {t.days}
            </span>
          </div>
        ))}
      </Card>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t.aging}
      </p>
      {report.aging.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">{t.candidate}</th>
                  <th className="px-4 py-2.5 font-semibold">{t.position}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.stage}</th>
                  <th className="px-4 py-2.5 text-right font-semibold">{t.inStage}</th>
                </tr>
              </thead>
              <tbody>
                {report.aging.map((a, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2 font-medium text-foreground">{a.candidateName}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      <span className="line-clamp-1">{a.jobTitle}</span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="secondary"
                        style={{ color: STAGE_KIND_ACCENT[a.stageKind] }}
                      >
                        {kindLabel(a.stageKind)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      <span className={a.days >= 30 ? "font-bold text-amber-600" : ""}>
                        {a.days}
                        {t.days}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">{t.none}</p>
      )}
    </section>
  );
}

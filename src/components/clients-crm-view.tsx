"use client";

import { Building2, FileText, UserCheck, Send } from "lucide-react";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgencyCrm } from "@/lib/agency-crm";

type Locale = "zh" | "en";

const T: Record<Locale, Record<string, string>> = {
  zh: {
    title: "客戶管理 Clients",
    subtitle: "客戶企業 · 職缺委託 · 推薦 · 媒合成功",
    clients: "客戶企業",
    jobOrders: "職缺委託",
    submissions: "推薦人數",
    placements: "媒合成功",
    client: "客戶",
    industry: "產業",
    funnel: "推薦流程",
  },
  en: {
    title: "Clients",
    subtitle: "Accounts · job orders · submissions · placements",
    clients: "Clients",
    jobOrders: "Job orders",
    submissions: "Submissions",
    placements: "Placements",
    client: "Client",
    industry: "Industry",
    funnel: "Submission funnel",
  },
};

const STAGE_KIND_LABEL: Record<string, Record<Locale, string>> = {
  sourced: { zh: "收到履歷", en: "Applied" },
  screened: { zh: "初步篩選", en: "Screening" },
  interview: { zh: "安排面試", en: "Interview" },
  offer: { zh: "發送錄取", en: "Offer" },
  placed: { zh: "到職", en: "Hired" },
  internal_submit: { zh: "內部推薦", en: "Internal" },
  client_submit: { zh: "推薦客戶", en: "Client submit" },
  onboarding: { zh: "報到準備", en: "Onboarding" },
  started: { zh: "已上工", en: "Started" },
  rejected: { zh: "未錄取", en: "Rejected" },
};

const STAGE_ORDER = [
  "sourced",
  "screened",
  "internal_submit",
  "client_submit",
  "interview",
  "offer",
  "placed",
  "onboarding",
  "started",
];

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
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

export function ClientsCrmView({ crm }: { crm: AgencyCrm }) {
  const { locale } = useRecruiterI18n();
  const loc: Locale = locale === "zh-TW" ? "zh" : "en";
  const t = T[loc];

  return (
    <section aria-label={t.title}>
      <div className="mb-4">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {t.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Building2} label={t.clients} value={crm.totals.clients} />
        <Stat icon={FileText} label={t.jobOrders} value={crm.totals.jobOrders} />
        <Stat icon={Send} label={t.submissions} value={crm.totals.submissions} />
        <Stat icon={UserCheck} label={t.placements} value={crm.totals.placements} />
      </div>

      {crm.byStage.length ? (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.funnel}
          </p>
          <div className="flex flex-wrap gap-2">
            {STAGE_ORDER.filter((k) => crm.byStage.some((s) => s.kind === k)).map(
              (kind) => {
                const n = crm.byStage.find((s) => s.kind === kind)?.count ?? 0;
                return (
                  <Badge key={kind} variant="secondary" className="gap-1.5">
                    {STAGE_KIND_LABEL[kind]?.[loc] ?? kind}
                    <span className="font-bold text-primary">{n}</span>
                  </Badge>
                );
              }
            )}
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold">{t.client}</th>
                <th className="px-4 py-2.5 font-semibold">{t.industry}</th>
                <th className="px-3 py-2.5 text-right font-semibold">{t.jobOrders}</th>
                <th className="px-3 py-2.5 text-right font-semibold">{t.submissions}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{t.placements}</th>
              </tr>
            </thead>
            <tbody>
              {crm.clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <Badge variant="outline" className="text-xs font-normal">
                      {c.industry}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.jobOrders}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.submissions}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {c.placements > 0 ? (
                      <Badge className="tabular-nums" style={{ background: "#059669" }}>
                        {c.placements}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

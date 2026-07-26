"use client";

import { Building2, FileText, UserCheck, Send, ShieldAlert } from "lucide-react";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgencyCrm, ComplianceStatus } from "@/lib/agency-crm";

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
    compliance: "證件合規追蹤",
    complianceSub: "居留證 / 工作許可到期提醒",
    expired: "已過期",
    expiringSoon: "30天內到期",
    allValid: "所有證件皆在有效期內 ✓",
    candidate: "候選人",
    docType: "證件",
    docNo: "證號",
    expiry: "到期日",
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
    compliance: "Document compliance",
    complianceSub: "ARC / work-permit expiry alerts",
    expired: "Expired",
    expiringSoon: "Expiring ≤30 days",
    allValid: "All documents currently valid ✓",
    candidate: "Candidate",
    docType: "Document",
    docNo: "No.",
    expiry: "Expiry",
  },
};

const DOC_TYPE_LABEL: Record<string, Record<Locale, string>> = {
  passport: { zh: "護照", en: "Passport" },
  visa: { zh: "簽證", en: "Visa" },
  arc: { zh: "居留證 ARC", en: "ARC" },
  work_permit: { zh: "工作許可", en: "Work permit" },
  medical: { zh: "體檢", en: "Medical" },
  contract: { zh: "勞動契約", en: "Contract" },
  diploma: { zh: "學歷證明", en: "Diploma" },
  criminal_record: { zh: "無犯罪紀錄", en: "Criminal record" },
  health_insurance: { zh: "健保", en: "Health insurance" },
};

const STATUS_STYLE: Record<ComplianceStatus, { bg: string; label: Record<Locale, string> }> = {
  expired: { bg: "#dc2626", label: { zh: "已過期", en: "Expired" } },
  expiring_soon: { bg: "#d97706", label: { zh: "即將到期", en: "Expiring" } },
  valid: { bg: "#059669", label: { zh: "有效", en: "Valid" } },
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

      {crm.compliance.total > 0 ? (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.compliance}{" "}
            <span className="font-normal normal-case text-muted-foreground/70">
              · {t.complianceSub}
            </span>
          </p>
          <div className="mb-3 flex flex-wrap gap-3">
            <Card className="flex flex-row items-center gap-3 border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xl font-bold leading-none text-red-700 dark:text-red-300">
                  {crm.compliance.expired}
                </p>
                <p className="text-xs text-red-700/80 dark:text-red-300/80">{t.expired}</p>
              </div>
            </Card>
            <Card className="flex flex-row items-center gap-3 border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xl font-bold leading-none text-amber-700 dark:text-amber-300">
                  {crm.compliance.expiringSoon}
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                  {t.expiringSoon}
                </p>
              </div>
            </Card>
          </div>
          {crm.compliance.attention.length ? (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2.5 font-semibold">{t.candidate}</th>
                      <th className="px-4 py-2.5 font-semibold">{t.docType}</th>
                      <th className="px-3 py-2.5 font-semibold">{t.docNo}</th>
                      <th className="px-3 py-2.5 font-semibold">{t.expiry}</th>
                      <th className="px-4 py-2.5 text-right font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {crm.compliance.attention.map((d, i) => (
                      <tr key={i} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-2 font-medium text-foreground">
                          {d.candidateName}
                        </td>
                        <td className="px-4 py-2">
                          {DOC_TYPE_LABEL[d.docType]?.[loc] ?? d.docType}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">
                          {d.docNumber}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{d.expiryDate}</td>
                        <td className="px-4 py-2 text-right">
                          <Badge
                            className="text-white"
                            style={{ background: STATUS_STYLE[d.status].bg }}
                          >
                            {STATUS_STYLE[d.status].label[loc]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">{t.allValid}</p>
          )}
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

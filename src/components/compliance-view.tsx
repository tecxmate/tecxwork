"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgencyCrm, ComplianceStatus } from "@/lib/agency-crm";

type Locale = "zh" | "en";

const T: Record<Locale, Record<string, string>> = {
  zh: {
    title: "證件合規追蹤 Compliance",
    subtitle: "移工證件到期管理 — 居留證 (ARC) / 工作許可 / 護照 / 體檢",
    expired: "已過期",
    expiringSoon: "30天內到期",
    valid: "有效證件",
    allValid: "目前所有證件皆在有效期內 ✓",
    attention: "需處理證件",
    candidate: "候選人",
    docType: "證件",
    docNo: "證號",
    authority: "核發機關",
    expiry: "到期日",
  },
  en: {
    title: "Compliance",
    subtitle: "Migrant-worker document expiry — ARC / work permit / passport / medical",
    expired: "Expired",
    expiringSoon: "Expiring ≤30 days",
    valid: "Valid documents",
    allValid: "All documents are currently valid ✓",
    attention: "Documents needing attention",
    candidate: "Candidate",
    docType: "Document",
    docNo: "No.",
    authority: "Issuer",
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

function AlertStat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "red" | "amber" | "green";
}) {
  const cls = {
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300",
  }[tone];
  const Icon = tone === "green" ? ShieldCheck : ShieldAlert;
  return (
    <Card className={`flex flex-row items-center gap-3 p-4 ${cls}`}>
      <Icon className="h-6 w-6" />
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs opacity-80">{label}</p>
      </div>
    </Card>
  );
}

export function ComplianceView({ compliance }: { compliance: AgencyCrm["compliance"] }) {
  const { locale } = useRecruiterI18n();
  const loc: Locale = locale === "zh-TW" ? "zh" : "en";
  const t = T[loc];
  const valid = compliance.total - compliance.expired - compliance.expiringSoon;

  return (
    <section aria-label={t.title}>
      <div className="mb-4">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {t.title}
        </h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <AlertStat value={compliance.expired} label={t.expired} tone="red" />
        <AlertStat value={compliance.expiringSoon} label={t.expiringSoon} tone="amber" />
        <AlertStat value={valid} label={t.valid} tone="green" />
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t.attention}
      </p>
      {compliance.attention.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">{t.candidate}</th>
                  <th className="px-4 py-2.5 font-semibold">{t.docType}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.docNo}</th>
                  <th className="px-4 py-2.5 font-semibold">{t.authority}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.expiry}</th>
                  <th className="px-4 py-2.5 text-right font-semibold" />
                </tr>
              </thead>
              <tbody>
                {compliance.attention.map((d, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2 font-medium text-foreground">{d.candidateName}</td>
                    <td className="px-4 py-2">
                      {DOC_TYPE_LABEL[d.docType]?.[loc] ?? d.docType}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{d.docNumber}</td>
                    <td className="px-4 py-2 text-muted-foreground">{d.issuingAuthority}</td>
                    <td className="px-3 py-2 tabular-nums">{d.expiryDate}</td>
                    <td className="px-4 py-2 text-right">
                      <Badge className="text-white" style={{ background: STATUS_STYLE[d.status].bg }}>
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
    </section>
  );
}

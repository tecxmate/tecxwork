"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  Download,
  ShieldAlert,
  UserMinus,
  Users,
} from "lucide-react";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgencyFormDialog, type FieldDef } from "@/components/agency-form-dialog";
import type { PlacementLifecycle, PlacementRow } from "@/lib/placement-lifecycle";

type Locale = "zh" | "en";

const T: Record<Locale, Record<string, string>> = {
  zh: {
    title: "媒合後追蹤",
    subtitle: "在職狀況 · 保證期 · 證件到期風險",
    active: "在職中",
    inGuarantee: "保證期內",
    docRisk: "證件風險",
    fellOff: "提前離職",
    feeAtRisk: "保證期內服務費",
    candidate: "候選人",
    client: "客戶",
    position: "職位",
    started: "到職日",
    guarantee: "保證期至",
    docs: "證件",
    manage: "更新",
    none: "目前沒有媒合成功的紀錄。",
    noneHint: "在「客戶管理」用「登錄媒合成功」新增第一筆。",
    daysLeft: "天後到期",
    overdue: "已結束",
    update: "更新媒合狀態",
    updateSub: "標記到職、正常結束，或提前離職。提前離職若發生在保證期內，服務費需退還。",
    save: "儲存",
    fStatus: "狀態",
    fStart: "到職日",
    fProbation: "試用期至",
    fGuarantee: "保證期至",
    fEnd: "結束日",
    fReason: "結束原因",
    warnInGuarantee: "此筆仍在保證期內 —— 若標記為提前離職，服務費將面臨退還。",
  },
  en: {
    title: "Placements",
    subtitle: "Who is working · guarantee windows · document risk",
    active: "Active",
    inGuarantee: "In guarantee",
    docRisk: "Document risk",
    fellOff: "Fell off",
    feeAtRisk: "Fee inside guarantee",
    candidate: "Candidate",
    client: "Client",
    position: "Position",
    started: "Started",
    guarantee: "Guarantee ends",
    docs: "Documents",
    manage: "Update",
    none: "No placements recorded yet.",
    noneHint: "Add the first one with “Record placement” on the Clients screen.",
    daysLeft: "days left",
    overdue: "ended",
    update: "Update placement",
    updateSub:
      "Mark them started, completed, or fallen off. Falling off inside the guarantee window means the fee is clawed back.",
    save: "Save",
    fStatus: "Status",
    fStart: "Start date",
    fProbation: "Probation until",
    fGuarantee: "Guarantee until",
    fEnd: "End date",
    fReason: "End reason",
    warnInGuarantee:
      "This placement is still inside its guarantee window — marking it fallen off puts the fee at risk of clawback.",
  },
};

const STATUS_STYLE: Record<string, { bg: string; label: Record<Locale, string> }> = {
  placed: { bg: "#6366f1", label: { zh: "已錄取", en: "Placed" } },
  started: { bg: "#059669", label: { zh: "在職中", en: "Started" } },
  completed: { bg: "#64748b", label: { zh: "已完成", en: "Completed" } },
  fell_off: { bg: "#dc2626", label: { zh: "提前離職", en: "Fell off" } },
};

const DOC_STYLE: Record<string, { bg: string; label: Record<Locale, string> }> = {
  valid: { bg: "#059669", label: { zh: "有效", en: "Valid" } },
  expiring: { bg: "#d97706", label: { zh: "即將到期", en: "Expiring" } },
  expired: { bg: "#dc2626", label: { zh: "已過期", en: "Expired" } },
};

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone?: "warn" | "danger";
}) {
  const colour =
    tone === "danger" ? "#dc2626" : tone === "warn" ? "#d97706" : undefined;
  return (
    <Card className="flex flex-row items-center gap-3 p-4">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{
          background: colour ? `${colour}1a` : undefined,
          color: colour,
        }}
      >
        <Icon className={colour ? "h-5 w-5" : "h-5 w-5 text-primary"} />
      </span>
      <div className="min-w-0">
        <p
          className="text-2xl font-bold leading-none tabular-nums"
          style={{ color: colour }}
        >
          {value}
        </p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

export function PlacementsView({ data }: { data: PlacementLifecycle }) {
  const { locale } = useRecruiterI18n();
  const loc: Locale = locale === "zh-TW" ? "zh" : "en";
  const t = T[loc];
  const router = useRouter();
  const [editing, setEditing] = useState<PlacementRow | null>(null);
  const done = useCallback(() => router.refresh(), [router]);

  const fields: FieldDef[] = [
    {
      name: "status",
      label: t.fStatus,
      type: "select",
      required: true,
      options: Object.entries(STATUS_STYLE).map(([value, s]) => ({
        value,
        label: s.label[loc],
      })),
    },
    { name: "startDate", label: t.fStart, type: "date", half: true },
    { name: "probationUntil", label: t.fProbation, type: "date", half: true },
    { name: "guaranteeUntil", label: t.fGuarantee, type: "date", half: true },
    { name: "endDate", label: t.fEnd, type: "date", half: true },
    { name: "endReason", label: t.fReason },
  ];

  return (
    <section aria-label={t.title}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        {data.rows.length > 0 ? (
          // File download, so a plain anchor rather than a Link.
          <a
            href="/api/agency/export/placements"
            download
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        ) : null}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={Users} label={t.active} value={data.totals.active} />
        <Stat icon={BadgeCheck} label={t.inGuarantee} value={data.totals.inGuarantee} />
        <Stat
          icon={ShieldAlert}
          label={t.docRisk}
          value={data.totals.docRisk}
          tone={data.totals.docRisk > 0 ? "danger" : undefined}
        />
        <Stat icon={UserMinus} label={t.fellOff} value={data.totals.fellOff} />
        <Stat
          icon={CircleDollarSign}
          label={t.feeAtRisk}
          value={data.totals.feeAtRisk ? data.totals.feeAtRisk.toLocaleString() : "—"}
          tone={data.totals.feeAtRisk > 0 ? "warn" : undefined}
        />
      </div>

      <AgencyFormDialog
        open={editing !== null}
        title={`${t.update}${editing ? ` — ${editing.candidateName}` : ""}`}
        description={
          editing?.inGuarantee ? `${t.updateSub} ${t.warnInGuarantee}` : t.updateSub
        }
        fields={fields}
        submitLabel={t.save}
        endpoint={editing ? `/api/agency/placements/${editing.id}` : ""}
        method="PATCH"
        initial={
          editing
            ? {
                status: editing.status,
                startDate: editing.startDate,
                probationUntil: editing.probationUntil,
                guaranteeUntil: editing.guaranteeUntil,
                endDate: editing.endDate,
                endReason: editing.endReason,
              }
            : undefined
        }
        onClose={() => setEditing(null)}
        onDone={done}
      />

      {data.rows.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-medium text-foreground">{t.none}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.noneHint}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">{t.candidate}</th>
                  <th className="px-4 py-2.5 font-semibold">{t.client}</th>
                  <th className="px-4 py-2.5 font-semibold">{t.position}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.started}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.guarantee}</th>
                  <th className="px-3 py-2.5 font-semibold">{t.docs}</th>
                  <th className="px-4 py-2.5 text-right font-semibold" />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => {
                  const st = STATUS_STYLE[r.status];
                  const doc = DOC_STYLE[r.docStatus];
                  return (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-foreground">{r.candidateName}</div>
                        {st ? (
                          <Badge
                            className="mt-0.5 text-[11px] text-white"
                            style={{ background: st.bg }}
                          >
                            {st.label[loc]}
                          </Badge>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.clientName ?? "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.position}</td>
                      <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                        {r.startDate ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {r.guaranteeUntil ? (
                          <div>
                            <div>{r.guaranteeUntil}</div>
                            <div
                              className="text-xs"
                              style={{
                                color: r.inGuarantee
                                  ? (r.guaranteeDaysLeft ?? 0) <= 30
                                    ? "#d97706"
                                    : undefined
                                  : undefined,
                              }}
                            >
                              {r.inGuarantee
                                ? `${r.guaranteeDaysLeft} ${t.daysLeft}`
                                : t.overdue}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {doc ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              className="w-fit gap-1 text-[11px] text-white"
                              style={{ background: doc.bg }}
                            >
                              {r.docStatus !== "valid" ? (
                                <AlertTriangle className="h-3 w-3" />
                              ) : null}
                              {doc.label[loc]}
                            </Badge>
                            {r.soonestDocExpiry ? (
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {r.soonestDocExpiry}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => setEditing(r)}
                        >
                          {t.manage}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}

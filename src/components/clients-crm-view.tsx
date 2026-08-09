"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, FileText, UserCheck, Send, Plus, UserPlus } from "lucide-react";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgencyFormDialog, type FieldDef } from "@/components/agency-form-dialog";
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
    addClient: "新增客戶",
    addContact: "新增聯絡人",
    addJobOrder: "新增職缺委託",
    addPlacement: "登錄媒合成功",
    newClient: "新增客戶企業",
    newClientSub: "建立一個仲介要為其徵才的客戶。",
    newContact: "新增客戶聯絡人",
    newContactSub: "客戶端的窗口。",
    newJobOrder: "新增職缺委託",
    newJobOrderSub: "客戶委託仲介去補的職位。",
    newPlacement: "登錄媒合成功",
    newPlacementSub: "候選人真的到職了 —— 這是仲介收費的依據。",
    save: "儲存",
    fName: "公司名稱（英文）",
    fNameZh: "公司名稱（中文）",
    fIndustry: "產業",
    fCity: "城市",
    fUbn: "統一編號",
    fFeePct: "預設服務費 %",
    fStatus: "狀態",
    fContactName: "聯絡人姓名",
    fTitle: "職稱",
    fEmail: "電子信箱",
    fPhone: "電話",
    fPrimary: "設為主要聯絡人",
    fClient: "客戶",
    fJobTitle: "職缺名稱",
    fHeadcount: "需求人數",
    fCandidate: "候選人",
    fJobOrder: "職缺委託",
    fStartDate: "到職日",
    fSalary: "月薪",
    fFeeAmount: "服務費金額",
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
    addClient: "Add client",
    addContact: "Add contact",
    addJobOrder: "Add job order",
    addPlacement: "Record placement",
    newClient: "New client",
    newClientSub: "A company the agency recruits for.",
    newContact: "New client contact",
    newContactSub: "The person you deal with on the client side.",
    newJobOrder: "New job order",
    newJobOrderSub: "A position a client has asked the agency to fill.",
    newPlacement: "Record a placement",
    newPlacementSub: "A candidate actually started — this is what the agency is paid on.",
    save: "Save",
    fName: "Company name",
    fNameZh: "Company name (Chinese)",
    fIndustry: "Industry",
    fCity: "City",
    fUbn: "Unified business no.",
    fFeePct: "Default fee %",
    fStatus: "Status",
    fContactName: "Contact name",
    fTitle: "Job title",
    fEmail: "Email",
    fPhone: "Phone",
    fPrimary: "Primary contact",
    fClient: "Client",
    fJobTitle: "Position title",
    fHeadcount: "Headcount",
    fCandidate: "Candidate",
    fJobOrder: "Job order",
    fStartDate: "Start date",
    fSalary: "Monthly salary",
    fFeeAmount: "Fee amount",
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

type Dialog = "client" | "contact" | "jobOrder" | "placement" | null;

export function ClientsCrmView({ crm }: { crm: AgencyCrm }) {
  const { locale } = useRecruiterI18n();
  const loc: Locale = locale === "zh-TW" ? "zh" : "en";
  const t = T[loc];
  const router = useRouter();

  const [dialog, setDialog] = useState<Dialog>(null);
  const [jobOrders, setJobOrders] = useState<{ id: number; title: string }[]>([]);
  const [candidates, setCandidates] = useState<{ id: number; name: string }[]>([]);

  // Only the placement form needs job orders and candidates, and they can both be long —
  // fetch them when that dialog opens rather than on every page view.
  useEffect(() => {
    if (dialog !== "placement") return;
    let alive = true;
    (async () => {
      const [jo, cand] = await Promise.all([
        fetch("/api/agency/job-orders").then((r) => r.json()).catch(() => ({})),
        fetch("/api/agency/compliance").then((r) => r.json()).catch(() => ({})),
      ]);
      if (!alive) return;
      setJobOrders(jo?.jobOrders ?? []);
      setCandidates(cand?.candidates ?? []);
    })();
    return () => {
      alive = false;
    };
  }, [dialog]);

  // Server Components hold this data, so a refresh is what makes a new row appear.
  const done = useCallback(() => router.refresh(), [router]);

  const clientOptions = crm.clients.map((c) => ({ value: String(c.id), label: c.name }));

  const clientFields: FieldDef[] = [
    { name: "name", label: t.fName, required: true, half: true },
    { name: "nameZh", label: t.fNameZh, half: true },
    { name: "industry", label: t.fIndustry, half: true, placeholder: "營造 Construction" },
    { name: "city", label: t.fCity, half: true, placeholder: "台中 Taichung" },
    { name: "unifiedBusinessNo", label: t.fUbn, half: true, hint: "8 digits" },
    { name: "defaultFeePct", label: t.fFeePct, type: "number", half: true },
    {
      name: "status",
      label: t.fStatus,
      type: "select",
      half: true,
      options: [
        { value: "active", label: "Active" },
        { value: "paused", label: "Paused" },
        { value: "closed", label: "Closed" },
      ],
    },
  ];

  const contactFields: FieldDef[] = [
    { name: "clientId", label: t.fClient, type: "select", required: true, options: clientOptions },
    { name: "name", label: t.fContactName, required: true, half: true },
    { name: "title", label: t.fTitle, half: true },
    { name: "email", label: t.fEmail, half: true },
    { name: "phone", label: t.fPhone, half: true },
    { name: "isPrimary", label: t.fPrimary, type: "checkbox" },
  ];

  const jobOrderFields: FieldDef[] = [
    { name: "clientId", label: t.fClient, type: "select", required: true, options: clientOptions },
    { name: "title", label: t.fJobTitle, required: true },
    { name: "headcount", label: t.fHeadcount, type: "number", half: true, placeholder: "1" },
    { name: "feePct", label: t.fFeePct, type: "number", half: true },
    {
      name: "status",
      label: t.fStatus,
      type: "select",
      half: true,
      options: [
        { value: "open", label: "Open" },
        { value: "on_hold", label: "On hold" },
        { value: "filled", label: "Filled" },
        { value: "closed", label: "Closed" },
      ],
    },
  ];

  const placementFields: FieldDef[] = [
    {
      name: "candidateId",
      label: t.fCandidate,
      type: "select",
      required: true,
      options: candidates.map((c) => ({ value: String(c.id), label: c.name })),
    },
    {
      name: "jobOrderId",
      label: t.fJobOrder,
      type: "select",
      required: true,
      options: jobOrders.map((j) => ({ value: String(j.id), label: j.title })),
    },
    { name: "startDate", label: t.fStartDate, type: "date", half: true },
    { name: "salary", label: t.fSalary, type: "number", half: true },
    { name: "feeAmount", label: t.fFeeAmount, type: "number", half: true },
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
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setDialog("client")}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t.addClient}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDialog("contact")}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            {t.addContact}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDialog("jobOrder")}>
            <FileText className="mr-1.5 h-4 w-4" />
            {t.addJobOrder}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDialog("placement")}>
            <UserCheck className="mr-1.5 h-4 w-4" />
            {t.addPlacement}
          </Button>
        </div>
      </div>

      <AgencyFormDialog
        open={dialog === "client"}
        title={t.newClient}
        description={t.newClientSub}
        fields={clientFields}
        submitLabel={t.save}
        endpoint="/api/agency/clients"
        onClose={() => setDialog(null)}
        onDone={done}
      />
      <AgencyFormDialog
        open={dialog === "contact"}
        title={t.newContact}
        description={t.newContactSub}
        fields={contactFields}
        submitLabel={t.save}
        endpoint="/api/agency/contacts"
        onClose={() => setDialog(null)}
        onDone={done}
      />
      <AgencyFormDialog
        open={dialog === "jobOrder"}
        title={t.newJobOrder}
        description={t.newJobOrderSub}
        fields={jobOrderFields}
        submitLabel={t.save}
        endpoint="/api/agency/job-orders"
        onClose={() => setDialog(null)}
        onDone={done}
      />
      <AgencyFormDialog
        open={dialog === "placement"}
        title={t.newPlacement}
        description={t.newPlacementSub}
        fields={placementFields}
        submitLabel={t.save}
        endpoint="/api/agency/placements"
        onClose={() => setDialog(null)}
        onDone={done}
      />

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

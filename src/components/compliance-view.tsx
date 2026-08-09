"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Paperclip, ShieldAlert, ShieldCheck, Plus, RefreshCw } from "lucide-react";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgencyFormDialog, type FieldDef } from "@/components/agency-form-dialog";
import type { AgencyCrm, ComplianceDocRow, ComplianceStatus } from "@/lib/agency-crm";

type Locale = "zh" | "en";

const T: Record<Locale, Record<string, string>> = {
  zh: {
    addDoc: "新增證件",
    newDoc: "新增證件紀錄",
    newDocSub: "ARC、工作許可、護照或體檢報告，含到期日。",
    renew: "換發",
    renewTitle: "換發證件",
    renewSub: "舊的那一筆會標記為已被取代並保留下來 —— 稽核時需要看得到歷史，不是只有現況。",
    save: "儲存",
    fCandidate: "候選人",
    fDocType: "證件種類",
    fDocNo: "證件號碼",
    fAuthority: "核發機關",
    fIssueDate: "核發日",
    fExpiryDate: "到期日",
    fNotes: "備註",
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
    addDoc: "Add document",
    newDoc: "New document record",
    newDocSub: "ARC, work permit, passport or medical check, with its expiry date.",
    renew: "Renew",
    renewTitle: "Renew document",
    renewSub: "The old record is kept and marked superseded — an audit needs the history, not just the current state.",
    save: "Save",
    fCandidate: "Candidate",
    fDocType: "Document type",
    fDocNo: "Document number",
    fAuthority: "Issuing authority",
    fIssueDate: "Issue date",
    fExpiryDate: "Expiry date",
    fNotes: "Notes",
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
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [renewing, setRenewing] = useState<ComplianceDocRow | null>(null);
  const [candidates, setCandidates] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (!adding) return;
    let alive = true;
    fetch("/api/agency/compliance")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setCandidates(d?.candidates ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [adding]);

  const done = useCallback(() => router.refresh(), [router]);

  const docTypeOptions = Object.entries(DOC_TYPE_LABEL).map(([value, label]) => ({
    value,
    label: label[loc] ?? value,
  }));

  const addFields: FieldDef[] = [
    {
      name: "candidateId",
      label: t.fCandidate,
      type: "select",
      required: true,
      options: candidates.map((c) => ({ value: String(c.id), label: c.name })),
    },
    { name: "docType", label: t.fDocType, type: "select", required: true, options: docTypeOptions },
    { name: "docNumber", label: t.fDocNo, half: true },
    { name: "issuingAuthority", label: t.fAuthority, half: true, placeholder: "NIA 移民署" },
    { name: "issueDate", label: t.fIssueDate, type: "date", half: true },
    { name: "expiryDate", label: t.fExpiryDate, type: "date", half: true },
    { name: "notes", label: t.fNotes },
  ];

  // Renewal only asks for what actually changes; the candidate and document type carry over
  // from the record being renewed, so they cannot be mistyped into a different person.
  const renewFields: FieldDef[] = [
    { name: "docNumber", label: t.fDocNo, half: true },
    { name: "issuingAuthority", label: t.fAuthority, half: true },
    { name: "issueDate", label: t.fIssueDate, type: "date", half: true },
    { name: "expiryDate", label: t.fExpiryDate, type: "date", required: true, half: true },
    { name: "notes", label: t.fNotes },
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
        <div className="flex shrink-0 items-center gap-2">
          {/* Every tracked document, not just the ones needing attention — an inspection
              asks to see the whole file. Plain anchor: this is a file download. */}
          <a
            href="/api/agency/export/compliance"
            download
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t.addDoc}
          </Button>
        </div>
      </div>

      <AgencyFormDialog
        open={adding}
        title={t.newDoc}
        description={t.newDocSub}
        fields={addFields}
        submitLabel={t.save}
        endpoint="/api/agency/compliance"
        onClose={() => setAdding(false)}
        onDone={done}
      />
      <AgencyFormDialog
        open={renewing !== null}
        title={`${t.renewTitle}${renewing ? ` — ${renewing.candidateName}` : ""}`}
        description={t.renewSub}
        fields={renewFields}
        submitLabel={t.renew}
        endpoint={renewing ? `/api/agency/compliance/${renewing.id}/renew` : ""}
        initial={
          renewing
            ? { docNumber: renewing.docNumber, issuingAuthority: renewing.issuingAuthority }
            : undefined
        }
        onClose={() => setRenewing(null)}
        onDone={done}
      />

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
                      <div className="flex items-center justify-end gap-2">
                        <Badge className="text-white" style={{ background: STATUS_STYLE[d.status].bg }}>
                          {STATUS_STYLE[d.status].label[loc]}
                        </Badge>
                        <ScanControl doc={d} />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => setRenewing(d)}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          {t.renew}
                        </Button>
                      </div>
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

/**
 * The scan behind a tracked document.
 *
 * Recording that an ARC exists and when it expires was never enough: an inspection asks to
 * see the document. Viewing streams through the app so the access is permission-checked
 * and audited — it is deliberately not a link to a file host.
 */
function ScanControl({ doc }: { doc: ComplianceDocRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (doc.documentId) {
    return (
      <a
        href={`/api/agency/documents/${doc.documentId}`}
        target="_blank"
        rel="noopener noreferrer"
        title="View the stored scan"
        className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <FileText className="h-3 w-3" />
        Scan
      </a>
    );
  }

  async function attach(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("kind", doc.docType);
    form.set("candidateId", String(doc.candidateId));
    form.set("complianceDocumentId", String(doc.id));
    try {
      const res = await fetch("/api/agency/documents", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Upload failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <label
      title={error ?? "Attach the scanned document"}
      className={`inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors ${
        error
          ? "border-destructive/40 text-destructive"
          : "border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Paperclip className="h-3 w-3" />
      {busy ? "Uploading…" : error ? "Failed" : "Attach"}
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void attach(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

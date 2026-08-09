"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Ban, CircleDollarSign, Clock, FileText, Loader2, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BillingData, BillablePlacement, InvoiceRow } from "@/lib/billing";
import type { Capability } from "@/lib/permissions";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  issued: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  void: "bg-muted text-muted-foreground line-through",
};

const money = (amount: number, currency = "TWD") =>
  `${currency} ${amount.toLocaleString()}`;

export function BillingView({
  data,
  capabilities,
}: {
  data: BillingData;
  capabilities: readonly Capability[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const canWrite = capabilities.includes("invoice:write");

  const call = useCallback(
    async (url: string, init: RequestInit) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(url, {
          headers: { "Content-Type": "application/json" },
          ...init,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Something went wrong.");
          return false;
        }
        router.refresh();
        return true;
      } catch {
        setError("Could not reach the server.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [router]
  );

  // An invoice covers one client, so selecting across clients is not a valid bill.
  const selectedRows = data.billable.filter((b) => selected.has(b.placementId));
  const selectedClient = selectedRows[0]?.clientId ?? null;
  const mixedClients = selectedRows.some((r) => r.clientId !== selectedClient);
  const selectedTotal = selectedRows.reduce((sum, r) => sum + r.feeAmount, 0);

  async function raiseInvoice() {
    if (!selectedClient || mixedClients) return;
    const ok = await call("/api/agency/invoices", {
      method: "POST",
      body: JSON.stringify({
        clientId: selectedClient,
        placementIds: selectedRows.map((r) => r.placementId),
      }),
    });
    if (ok) setSelected(new Set());
  }

  async function act(invoiceId: number, action: string) {
    if (action === "void") {
      const reason = window.prompt("Why is this invoice being voided?");
      if (!reason?.trim()) return;
      await call(`/api/agency/invoices/${invoiceId}`, {
        method: "POST",
        body: JSON.stringify({ action, voidReason: reason.trim() }),
      });
      return;
    }
    await call(`/api/agency/invoices/${invoiceId}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  }

  return (
    <section aria-label="Billing" className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Billing
        </h1>
        <p className="text-sm text-muted-foreground">
          What has been charged, what is owed, and what is still unbilled.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Clock} label="Outstanding" value={money(data.totals.outstanding)} />
        <Stat
          icon={AlertTriangle}
          label="Overdue"
          value={money(data.totals.overdue)}
          tone={data.totals.overdue > 0 ? "danger" : undefined}
        />
        <Stat icon={CircleDollarSign} label="Paid this year" value={money(data.totals.paidThisYear)} />
        <Stat icon={Receipt} label="Unbilled fees" value={String(data.billable.length)} />
      </div>

      {data.billable.length > 0 ? (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Ready to bill</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Placements with a fee that has not been invoiced.
              </p>
            </div>
            {canWrite ? (
              <Button
                size="sm"
                disabled={busy || selectedRows.length === 0 || mixedClients}
                title={
                  mixedClients
                    ? "An invoice covers one client — select placements for a single client"
                    : undefined
                }
                onClick={() => void raiseInvoice()}
              >
                {busy ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-1.5 h-4 w-4" />
                )}
                Raise invoice
                {selectedTotal > 0 ? ` · ${money(selectedTotal)}` : ""}
              </Button>
            ) : null}
          </div>

          {mixedClients ? (
            <p className="mt-2 text-xs text-destructive">
              Those placements belong to different clients — an invoice covers one client.
            </p>
          ) : null}

          <ul className="mt-3 divide-y divide-border">
            {data.billable.map((row: BillablePlacement) => (
              <li key={row.placementId} className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  aria-label={`Bill ${row.candidateName}`}
                  checked={selected.has(row.placementId)}
                  disabled={!canWrite}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(row.placementId);
                    else next.delete(row.placementId);
                    setSelected(next);
                  }}
                  className="h-4 w-4 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.candidateName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.clientName}
                    {row.startDate ? ` · started ${row.startDate}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-foreground">
                  {money(row.feeAmount)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {data.invoices.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No invoices raised yet.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {data.invoices.map((invoice: InvoiceRow) => (
            <div key={invoice.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-foreground">{invoice.number}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      STATUS_STYLE[invoice.status] ?? ""
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {invoice.clientName} · {invoice.lines.length}{" "}
                  {invoice.lines.length === 1 ? "line" : "lines"}
                  {invoice.dueDate ? ` · due ${invoice.dueDate}` : ""}
                </p>
                {invoice.fellOffAfterBilling.length > 0 ? (
                  // Billed, then they left. Whoever handles the money needs to know.
                  <p className="mt-0.5 text-[11px] text-destructive">
                    Fell off after billing: {invoice.fellOffAfterBilling.join(", ")} — a credit
                    may be due.
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {money(invoice.total, invoice.currency)}
                </p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  net {invoice.subtotal.toLocaleString()} + tax{" "}
                  {invoice.taxAmount.toLocaleString()}
                </p>
              </div>

              {canWrite ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  {invoice.status === "draft" ? (
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={busy}
                      onClick={() => void act(invoice.id, "issue")}
                    >
                      Issue
                    </Button>
                  ) : null}
                  {invoice.status === "issued" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={busy}
                      onClick={() => void act(invoice.id, "pay")}
                    >
                      Mark paid
                    </Button>
                  ) : null}
                  {invoice.status === "draft" || invoice.status === "issued" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      disabled={busy}
                      onClick={() => void act(invoice.id, "void")}
                    >
                      <Ban className="mr-1 h-3 w-3" />
                      Void
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </Card>
      )}
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          tone === "danger" ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </Card>
  );
}

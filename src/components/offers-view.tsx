"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Ban, Check, FileSignature, Loader2, Send, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OfferRow, OffersData } from "@/lib/offers-data";
import type { Capability } from "@/lib/permissions";
import type { OfferStatus } from "@/lib/offers";

const STATUS_STYLE: Record<OfferStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  approved: { label: "Approved", className: "bg-primary/10 text-primary" },
  sent: { label: "Sent", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  accepted: { label: "Accepted", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  declined: { label: "Declined", className: "bg-destructive/10 text-destructive" },
  withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground line-through" },
};

const money = (amount: number, currency: string, period: string) =>
  `${currency} ${amount.toLocaleString()}/${period === "month" ? "mo" : period === "year" ? "yr" : "hr"}`;

export function OffersView({
  data,
  capabilities,
}: {
  data: OffersData;
  capabilities: readonly Capability[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState<number | null>(null);

  const canApprove = capabilities.includes("offer:approve");

  const call = useCallback(
    async (url: string, init: RequestInit) => {
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
      }
    },
    [router]
  );

  async function act(offerId: number, action: string, declineReason?: string) {
    setBusy(offerId);
    await call(`/api/agency/offers/${offerId}`, {
      method: "POST",
      body: JSON.stringify({ action, declineReason }),
    });
    setBusy(null);
  }

  async function decline(offer: OfferRow) {
    // A decline without a reason is refused by the API, and the reason is the most useful
    // thing in the record — so ask for it rather than sending a request that will fail.
    const reason = window.prompt(`Why did ${offer.candidateName} decline?`);
    if (!reason?.trim()) return;
    await act(offer.id, "decline", reason.trim());
  }

  return (
    <section aria-label="Offers" className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Offers
        </h1>
        <p className="text-sm text-muted-foreground">
          What was offered, who authorised it, and what came back.
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

      {data.awaitingOffer.length > 0 ? (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Awaiting an offer</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            In an offer stage with nothing written yet.
          </p>
          <ul className="mt-3 divide-y divide-border">
            {data.awaitingOffer.map((row) => (
              <li
                key={row.applicationId}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.candidateName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{row.position}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={() => setDrafting(row.applicationId)}
                >
                  <FileSignature className="mr-1 h-3 w-3" />
                  Draft offer
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {drafting !== null ? (
        <DraftOfferForm
          applicationId={drafting}
          onCancel={() => setDrafting(null)}
          onSubmit={async (payload) => {
            const ok = await call("/api/agency/offers", {
              method: "POST",
              body: JSON.stringify({ applicationId: drafting, ...payload }),
            });
            if (ok) setDrafting(null);
          }}
        />
      ) : null}

      {data.offers.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No offers yet.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {data.offers.map((offer) => {
            const style = STATUS_STYLE[offer.status];
            const pending = busy === offer.id;
            return (
              <div key={offer.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-foreground">
                      {offer.candidateName}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style.className}`}
                    >
                      {style.label}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {offer.position} · {money(offer.salary, offer.currency, offer.salaryPeriod)}
                    {offer.startDate ? ` · starts ${offer.startDate}` : ""}
                    {offer.expiresAt ? ` · expires ${offer.expiresAt}` : ""}
                  </p>
                  {offer.approvedBy ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Authorised by {offer.approvedBy}
                    </p>
                  ) : null}
                  {offer.declineReason ? (
                    <p className="mt-0.5 text-[11px] text-destructive">
                      Declined: {offer.declineReason}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}

                  {offer.status === "draft" ? (
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      // Drafting and authorising are separate on purpose; a recruiter sees
                      // this disabled rather than discovering the rule from a 403.
                      disabled={pending || !canApprove}
                      title={canApprove ? "Authorise these terms" : "Your role cannot authorise offer terms"}
                      onClick={() => void act(offer.id, "approve")}
                    >
                      <BadgeCheck className="mr-1 h-3 w-3" />
                      Approve
                    </Button>
                  ) : null}

                  {offer.status === "approved" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={pending}
                      onClick={() => void act(offer.id, "send")}
                    >
                      <Send className="mr-1 h-3 w-3" />
                      Mark sent
                    </Button>
                  ) : null}

                  {offer.status === "approved" || offer.status === "sent" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        disabled={pending}
                        onClick={() => void act(offer.id, "accept")}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Accepted
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-destructive/30 px-2 text-xs text-destructive hover:bg-destructive/10"
                        disabled={pending}
                        onClick={() => void decline(offer)}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Declined
                      </Button>
                    </>
                  ) : null}

                  {canApprove &&
                  (offer.status === "draft" ||
                    offer.status === "approved" ||
                    offer.status === "sent") ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      disabled={pending}
                      onClick={() => void act(offer.id, "withdraw")}
                    >
                      <Ban className="mr-1 h-3 w-3" />
                      Withdraw
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </section>
  );
}

function DraftOfferForm({
  applicationId,
  onCancel,
  onSubmit,
}: {
  applicationId: number;
  onCancel: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [salary, setSalary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-foreground">New offer</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <Field label="Monthly salary (TWD)">
          <input
            type="number"
            inputMode="numeric"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </Field>
        <Field label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </Field>
        <Field label="Offer expires">
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </Field>
        <div className="flex items-end gap-2">
          <Button
            disabled={saving || !Number(salary)}
            onClick={async () => {
              setSaving(true);
              await onSubmit({
                salary: Number(salary),
                startDate: startDate || null,
                expiresAt: expiresAt || null,
              });
              setSaving(false);
            }}
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Save draft
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Saved as a draft against application #{applicationId}. Terms can be edited until
        someone approves them.
      </p>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

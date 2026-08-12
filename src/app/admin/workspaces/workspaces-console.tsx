"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Platform-owner tenant console.
 *
 * Standalone rather than a section of the 4,000-line admin dashboard, because this is a
 * different axis: that screen runs an event, this one decides which customers exist and
 * what they have paid for.
 */

type Plan = {
  id: string;
  name: string;
  defaultSeats: number;
  trialDays: number | null;
  features: readonly string[];
};

type Workspace = {
  id: number;
  name: string;
  slug: string;
  kind: string;
  status: string;
  plan: string;
  seatLimit: number;
  trialEndsAt: string | null;
  billingEmail: string | null;
  memberCount: number;
};

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  suspended: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  cancelled: "bg-muted text-muted-foreground",
};

export function WorkspacesConsole({
  initialWorkspaces,
  plans,
}: {
  initialWorkspaces: Workspace[];
  plans: Plan[];
}) {
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState(plans[0]?.id ?? "trial");
  const [seats, setSeats] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

  async function refresh() {
    const res = await fetch("/api/platform/orgs");
    if (res.ok) setWorkspaces((await res.json()).orgs);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/orgs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          plan,
          ...(seats ? { seatLimit: Number(seats) } : {}),
          ...(billingEmail ? { billingEmail } : {}),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create that workspace.");
        return;
      }
      setName("");
      setSlug("");
      setSeats("");
      setBillingEmail("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: number, changes: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/platform/orgs/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(changes),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not update that workspace.");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Workspaces</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every customer tenant, what they are on, and how many seats they use. Onboarding is
          sales-led — nobody creates their own workspace.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : null}

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Provision a workspace</h2>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Yang Luck 揚運國際"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Slug (becomes the subdomain)
            </label>
            <Input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="yangluck"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.defaultSeats} seats
                  {p.trialDays ? `, ${p.trialDays}-day trial` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Contracted seats (optional)
            </label>
            <Input
              type="number"
              min={1}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              placeholder="defaults to the plan"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              Billing email (optional)
            </label>
            <Input
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="accounts@customer.com.tw"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Working…" : "Create workspace"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {workspaces.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No workspaces yet.
          </Card>
        ) : null}

        {workspaces.map((ws) => (
          <Card key={ws.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{ws.name}</h3>
                  <Badge className={STATUS_TONE[ws.status] ?? ""}>{ws.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ws.slug} · {ws.kind} · {ws.memberCount}/{ws.seatLimit} seats
                  {ws.billingEmail ? ` · ${ws.billingEmail}` : ""}
                  {ws.trialEndsAt
                    ? ` · trial ends ${new Date(ws.trialEndsAt).toISOString().slice(0, 10)}`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={ws.plan}
                  onChange={(e) => patch(ws.id, { plan: e.target.value })}
                  disabled={busy}
                  className="h-8 rounded-md border bg-transparent px-2 text-xs"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <Input
                  type="number"
                  min={1}
                  defaultValue={ws.seatLimit}
                  disabled={busy}
                  className="h-8 w-20 text-xs"
                  onBlur={(e) => {
                    const next = Number(e.target.value);
                    if (next !== ws.seatLimit && next >= 1) {
                      patch(ws.id, { seatLimit: next });
                    }
                  }}
                />

                {ws.status === "active" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => patch(ws.id, { status: "suspended" })}
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || ws.status === "cancelled"}
                    onClick={() => patch(ws.id, { status: "active" })}
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Suspending stops access immediately and touches no data — recovery is one column, never
        a restore. Workspaces are never deleted; closing one is &quot;cancelled&quot;, so
        placements, invoices and compliance evidence survive for audit.
      </p>
    </div>
  );
}

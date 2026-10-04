"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiKeysPanel, type ApiKeySummaryDto } from "./api-keys-panel";
import { ConnectionsPanel, type ConnectionDto } from "./connections-panel";

/**
 * The workspace's people.
 *
 * Seats are the commercial unit, so the budget is stated plainly at the top rather than
 * only surfacing as an error at the moment an invitation is refused.
 */

const ROLES = [
  { id: "admin", label: "Administrator" },
  { id: "account_manager", label: "Account manager" },
  { id: "recruiter", label: "Recruiter" },
  { id: "hiring_manager", label: "Hiring manager" },
  { id: "interviewer", label: "Interviewer" },
  { id: "coordinator", label: "Coordinator" },
  { id: "viewer", label: "Viewer" },
] as const;

const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.id, r.label]));

type Member = {
  userId: number;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

type Invite = { id: number; email: string; role: string; expiresAt: string };

export type TeamData = {
  apiKeys: ApiKeySummaryDto[];
  /** OAuth grants — applications approved through a Connect button. */
  connections: ConnectionDto[];
  /** So the list can say "approved by you" rather than repeating the viewer's own name. */
  viewerUserId: number;
  /** Scopes the viewer may delegate — their own capabilities. */
  grantableScopes: string[];
  apiAccessEnabled: boolean;
  members: Member[];
  invites: Invite[];
  seats: { limit: number; used: number };
};

export function TeamView({ initial }: { initial: TeamData }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("recruiter");

  const seatsLeft = Math.max(0, data.seats.limit - data.seats.used);

  async function refresh() {
    const res = await fetch("/api/org/members");
    if (res.ok) setData(await res.json());
  }

  async function send(
    input: RequestInfo,
    init: RequestInit,
    onOk?: (body: Record<string, unknown>) => void
  ) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(input, init);
      const body = await res.json();
      if (!res.ok) {
        setError(String(body.error ?? "Something went wrong."));
        return;
      }
      onOk?.(body);
      await refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function invite(e: React.FormEvent) {
    e.preventDefault();
    send(
      "/api/org/invites",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role }),
      },
      (body) => {
        setEmail("");
        const invited = body.invite as { emailSent?: boolean; url?: string } | undefined;
        // When the mail failed the API hands back the link instead of silently losing the
        // invitation — showing it is what makes that fallback worth having.
        setNotice(
          invited?.emailSent
            ? "Invitation sent."
            : `Invitation created, but the email could not be sent. Share this link: ${invited?.url ?? "(unavailable)"}`
        );
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.seats.used} of {data.seats.limit} seats used
            {seatsLeft === 0 ? " — no seats left" : ` · ${seatsLeft} available`}. Pending
            invitations hold a seat until they are accepted, revoked, or expire.
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-lg bg-primary/10 p-3 text-sm break-all">{notice}</p>
      ) : null}

      <Card className="p-5">
        <h3 className="text-sm font-semibold">Invite someone</h3>
        <form onSubmit={invite} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com.tw"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={busy || seatsLeft === 0}>
            {busy ? "Working…" : "Send invitation"}
          </Button>
        </form>
        {seatsLeft === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Every seat is taken. Remove a member or a pending invitation, or ask your account
            manager to raise the seat count.
          </p>
        ) : null}
      </Card>

      <Card className="divide-y p-0">
        {data.members.map((m) => (
          <div
            key={m.userId}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{m.name}</p>
              <p className="truncate text-xs text-muted-foreground">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={m.role}
                disabled={busy}
                onChange={(e) =>
                  send("/api/org/members", {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ userId: m.userId, role: e.target.value }),
                  })
                }
                className="h-8 rounded-md border bg-transparent px-2 text-xs"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  send("/api/org/members", {
                    method: "DELETE",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ userId: m.userId }),
                  })
                }
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </Card>

      {data.invites.length > 0 ? (
        <Card className="divide-y p-0">
          <p className="px-4 pt-4 text-sm font-semibold">Pending invitations</p>
          {data.invites.map((i) => (
            <div
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{i.email}</p>
                <p className="text-xs text-muted-foreground">
                  <Badge className="mr-2">{ROLE_LABEL[i.role] ?? i.role}</Badge>
                  expires {new Date(i.expiresAt).toISOString().slice(0, 10)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  send(`/api/org/invites/${i.id}`, { method: "DELETE" })
                }
              >
                Revoke
              </Button>
            </div>
          ))}
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Removing someone releases their seat and ends their access. Everything they created —
        jobs, candidates, placements — stays with the workspace.
      </p>

      <ApiKeysPanel
        initial={data.apiKeys}
        grantableScopes={data.grantableScopes}
        apiAccessEnabled={data.apiAccessEnabled}
      />

      <ConnectionsPanel initial={data.connections} viewerUserId={data.viewerUserId} />
    </div>
  );
}

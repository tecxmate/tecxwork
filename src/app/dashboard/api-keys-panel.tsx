"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";

/**
 * Minting and revoking machine credentials.
 *
 * Lives on the Team screen because a key is a way for something that is not a person to act
 * inside the workspace — an administrative decision of the same weight as adding a
 * colleague, and gated on the same `member:invite` capability.
 *
 * The scope checkboxes are built from the caller's OWN capabilities, so the UI cannot even
 * offer a delegation the server would refuse. The server re-checks anyway; this just stops
 * the form being a way to discover what you are not allowed to do.
 */

export type ApiKeySummaryDto = {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export function ApiKeysPanel({
  initial,
  grantableScopes,
  apiAccessEnabled,
}: {
  initial: ApiKeySummaryDto[];
  grantableScopes: string[];
  /** False when the plan has no `api_access`; the server refuses either way. */
  apiAccessEnabled: boolean;
}) {
  const [keys, setKeys] = useState(initial);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [minted, setMinted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/org/api-keys");
    if (res.ok) setKeys((await res.json()).keys);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMinted(null);
    try {
      const res = await fetch("/api/org/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, scopes }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create that key.");
        return;
      }
      setMinted(body.key.token);
      setName("");
      setScopes([]);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: number) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) setError((await res.json()).error ?? "Could not revoke that key.");
      else await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">API keys</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        For scripts and agents acting inside this workspace. A key carries your own
        permissions, narrowed to the scopes you pick — and narrows further if your role does.
      </p>

      {!apiAccessEnabled ? (
        <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          API access is not included in your current plan. Talk to your account manager to
          enable it.
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {minted ? (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm font-medium">Copy this now — it is shown once.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Only a hash is stored, so it cannot be shown again. If you lose it, revoke the key
            and make another.
          </p>
          <code className="mt-2 block break-all rounded bg-background px-2 py-1.5 font-mono text-xs">
            {minted}
          </code>
        </div>
      ) : null}

      {apiAccessEnabled ? (
        <form onSubmit={create} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Compliance sync"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Scopes</label>
            <div className="flex flex-wrap gap-2">
              {grantableScopes.map((scope) => {
                const on = scopes.includes(scope);
                return (
                  <button
                    key={scope}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setScopes(
                        on ? scopes.filter((s) => s !== scope) : [...scopes, scope]
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {scope}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Only what your own role permits is offered here.
            </p>
          </div>

          <Button type="submit" disabled={busy || scopes.length === 0 || !name}>
            {busy ? "Working…" : "Create key"}
          </Button>
        </form>
      ) : null}

      <div className="mt-5 border-t pt-4">
        {keys.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No keys yet"
            detail="Keys let a script or an agent read and update this workspace without a browser session."
          />
        ) : (
          <ul className="divide-y">
            {keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{k.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <code className="font-mono">{k.prefix}…</code>
                    {" · "}
                    {k.lastUsedAt
                      ? `last used ${new Date(k.lastUsedAt).toISOString().slice(0, 10)}`
                      : "never used"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {k.scopes.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs font-normal">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => revoke(k.id)}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

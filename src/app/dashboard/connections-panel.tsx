"use client";

import { useState } from "react";
import { Plug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

/**
 * Connected applications.
 *
 * The OAuth consent screen tells people they can revoke a connection from workspace
 * settings. This is that place, and it exists so the sentence is true.
 *
 * Scopes are shown the way the consent screen showed them — a sentence about what the
 * application can see, not a capability string. Someone deciding whether to disconnect
 * something is asking the same question they were asked when they connected it, and
 * answering it in different words would make the two screens hard to reconcile.
 */

const SCOPE_COPY: Record<string, string> = {
  "client:read": "Client companies and their placements",
  "compliance:read": "Permit and ARC expiry counts",
  "audit:read": "Workspace activity log",
  "member:invite": "Who is in the workspace, and seat usage",
};

export type ConnectionDto = {
  clientId: string;
  clientName: string;
  userId: number;
  userName: string;
  userEmail: string;
  scopes: string[];
  grantedAt: string;
  expiresAt: string;
  revocable: boolean;
};

export function ConnectionsPanel({
  initial,
  viewerUserId,
}: {
  initial: ConnectionDto[];
  viewerUserId: number;
}) {
  const [connections, setConnections] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function revoke(connection: ConnectionDto) {
    setBusy(connection.clientId);
    setError(null);
    try {
      const res = await fetch("/api/org/connections", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientId: connection.clientId,
          userId: connection.userId,
        }),
      });
      if (!res.ok) {
        setError((await res.json()).error ?? "Could not disconnect that application.");
        return;
      }
      const list = await fetch("/api/org/connections");
      if (list.ok) setConnections((await list.json()).connections);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Connected applications</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Applications people here have approved through a Connect button. Each one reads on
        behalf of the person who approved it and can never do more than that person&apos;s
        role allows.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        {connections.length === 0 ? (
          <EmptyState
            icon={Plug}
            title="Nothing connected"
            detail="When someone approves an application from a Connect button, it appears here — and can be disconnected here."
          />
        ) : (
          <ul className="divide-y">
            {connections.map((connection) => (
              <li
                key={`${connection.userId}:${connection.clientId}`}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{connection.clientName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {connection.userId === viewerUserId
                      ? "Approved by you"
                      : `Approved by ${connection.userName}`}
                    {" · "}
                    {new Date(connection.grantedAt).toISOString().slice(0, 10)}
                    {" · expires "}
                    {new Date(connection.expiresAt).toISOString().slice(0, 10)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {connection.scopes.map((scope) => (
                      <Badge key={scope} variant="outline" className="text-xs font-normal">
                        {SCOPE_COPY[scope] ?? scope}
                      </Badge>
                    ))}
                  </div>
                </div>
                {connection.revocable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy === connection.clientId}
                    onClick={() => revoke(connection)}
                  >
                    {busy === connection.clientId ? "Working…" : "Disconnect"}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

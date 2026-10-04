"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

/**
 * The audit trail.
 *
 * Written on every mutation since the ATS shipped and, until now, readable by nobody. The
 * table holds field NAMES and metadata rather than candidate values, so this screen can
 * show what changed without ever showing a candidate's details — which is what makes it
 * safe to give a viewer, whose job is oversight and who deliberately cannot open the
 * candidate database.
 */

export type AuditEventDto = {
  id: number;
  createdAt: string;
  actorName: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId: number | null;
  fieldNames: string[] | null;
  ip: string | null;
};

export type AuditData = {
  events: AuditEventDto[];
  total: number;
  page: number;
  pageSize: number;
  actions: string[];
  entityTypes: string[];
};

/** Verbs an inspection would recognise, rather than the column values. */
const ACTION_LABEL: Record<string, string> = {
  create: "Created",
  update: "Updated",
  remove: "Removed",
  revoke: "Revoked",
  view: "Viewed",
  export: "Exported",
  move_stage: "Moved stage",
  accept_invite: "Accepted invitation",
};

function label(action: string): string {
  return ACTION_LABEL[action] ?? action.replace(/_/g, " ");
}

export function AuditView({ initial }: { initial: AuditData }) {
  const [data, setData] = useState(initial);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(next: { action?: string; entityType?: string; page?: number }) {
    setBusy(true);
    try {
      const params = new URLSearchParams();
      const a = next.action ?? action;
      const e = next.entityType ?? entityType;
      if (a) params.set("action", a);
      if (e) params.set("entityType", e);
      if (next.page && next.page > 1) params.set("page", String(next.page));

      const res = await fetch(`/api/org/audit?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setBusy(false);
    }
  }

  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Audit trail</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every change recorded, oldest retained first shown last. Entries hold the fields
          that changed, never the values — a candidate&apos;s details are not readable here.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={action}
          disabled={busy}
          onChange={(e) => {
            setAction(e.target.value);
            load({ action: e.target.value, page: 1 });
          }}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="">All actions</option>
          {data.actions.map((a) => (
            <option key={a} value={a}>
              {label(a)}
            </option>
          ))}
        </select>

        <select
          value={entityType}
          disabled={busy}
          onChange={(e) => {
            setEntityType(e.target.value);
            load({ entityType: e.target.value, page: 1 });
          }}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="">All records</option>
          {data.entityTypes.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <span className="text-xs text-muted-foreground">
          {data.total} {data.total === 1 ? "entry" : "entries"}
        </span>
      </div>

      <Card className="overflow-hidden p-0">
        {data.events.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Nothing recorded yet"
            detail="Actions are written here as your team works — stage moves, offers, placements, exports and document access."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-semibold">When</th>
                  <th className="px-4 py-2.5 font-semibold">Who</th>
                  <th className="px-4 py-2.5 font-semibold">Did</th>
                  <th className="px-4 py-2.5 font-semibold">To</th>
                  <th className="px-4 py-2.5 font-semibold">Fields</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((e) => (
                  <tr key={e.id} className="border-b border-border/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums text-muted-foreground">
                      {new Date(e.createdAt).toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="px-4 py-2">
                      {e.actorName ?? (
                        // No user behind it: a cron or a system action. Worth naming rather
                        // than showing an empty cell, since these are the entries an
                        // inspection asks about.
                        <span className="text-muted-foreground">{e.actorType}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{label(e.action)}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {e.entityType.replace(/_/g, " ")}
                      {e.entityId != null ? ` #${e.entityId}` : ""}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(e.fieldNames ?? []).map((f) => (
                          <Badge key={f} variant="outline" className="text-xs font-normal">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {lastPage > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={busy || data.page <= 1}
            onClick={() => load({ page: data.page - 1 })}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {data.page} of {lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || data.page >= lastPage}
            onClick={() => load({ page: data.page + 1 })}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StageRow } from "@/lib/pipeline-config";

const STAGE_KINDS = [
  "sourced",
  "screened",
  "internal_submit",
  "client_submit",
  "interview",
  "offer",
  "placed",
  "onboarding",
  "started",
  "rejected",
] as const;

/**
 * Reordering is up/down buttons rather than drag-and-drop.
 *
 * A pipeline has a handful of stages and gets rearranged rarely, so the drag library and
 * its pointer/touch edge cases would cost far more than they return — and buttons work
 * with a keyboard and a screen reader, which a drag surface does not without real effort.
 */
export function PipelineSettingsView({ initialStages }: { initialStages: StageRow[] }) {
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<(typeof STAGE_KINDS)[number]>("interview");

  const call = useCallback(
    async (url: string, init: RequestInit): Promise<boolean> => {
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

  async function addStage() {
    if (!newName.trim()) return;
    const ok = await call("/api/agency/pipeline/stages", {
      method: "POST",
      body: JSON.stringify({ name: newName.trim(), stageKind: newKind }),
    });
    if (ok) setNewName("");
  }

  async function rename(id: number, name: string) {
    const trimmed = name.trim();
    const current = initialStages.find((s) => s.id === id)?.name;
    if (!trimmed || trimmed === current) return;
    await call(`/api/agency/pipeline/stages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: trimmed }),
    });
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;

    // Reorder locally first so the list does not visibly lag the click, then persist the
    // full order — the API rejects a partial one on purpose.
    const next = [...stages];
    [next[index], next[target]] = [next[target], next[index]];
    setStages(next);

    const ok = await call("/api/agency/pipeline/stages", {
      method: "PATCH",
      body: JSON.stringify({ order: next.map((s) => s.id) }),
    });
    if (!ok) setStages(stages); // put it back rather than leave a lie on screen
  }

  async function retire(id: number) {
    await call(`/api/agency/pipeline/stages/${id}`, { method: "DELETE" });
  }

  return (
    <section aria-label="Pipeline stages" className="max-w-3xl">
      <div className="mb-4">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Pipeline stages
        </h1>
        <p className="text-sm text-muted-foreground">
          The columns every candidate moves through. Changes apply to the whole
          organisation.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Card className="divide-y divide-border">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex flex-wrap items-center gap-3 p-3">
            <span className="w-6 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
              {index + 1}
            </span>

            <input
              defaultValue={stage.name}
              aria-label={`Stage ${index + 1} name`}
              onBlur={(e) => void rename(stage.id, e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-foreground hover:border-border focus:border-border focus:outline-none"
            />

            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {stage.stageKind.replace(/_/g, " ")}
            </span>

            <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {stage.occupancy} {stage.occupancy === 1 ? "candidate" : "candidates"}
            </span>

            <div className="flex shrink-0 items-center gap-1">
              <IconButton
                label={`Move ${stage.name} earlier`}
                disabled={busy || index === 0}
                onClick={() => void move(index, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={`Move ${stage.name} later`}
                disabled={busy || index === stages.length - 1}
                onClick={() => void move(index, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={`Remove ${stage.name}`}
                // Retiring a stage with people in it is refused by the API; disabling it
                // here explains why before they click rather than after.
                disabled={busy || stage.occupancy > 0 || stages.length <= 1}
                destructive
                onClick={() => void retire(stage.id)}
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        ))}

        {stages.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No stages yet. Add the first one below.
          </p>
        ) : null}
      </Card>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex-1 text-xs font-medium text-muted-foreground">
          New stage
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void addStage();
            }}
            placeholder="e.g. Client interview"
            className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Kind
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as (typeof STAGE_KINDS)[number])}
            className="mt-1 h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STAGE_KINDS.map((k) => (
              <option key={k} value={k}>
                {k.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={() => void addStage()} disabled={busy || !newName.trim()}>
          {busy ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-4 w-4" />
          )}
          Add stage
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Removing a stage hides it from the board but keeps it in reporting history, so past
        candidates still show the stages they actually moved through.
      </p>
    </section>
  );
}

function IconButton({
  label,
  disabled,
  destructive,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

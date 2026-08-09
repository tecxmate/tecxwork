"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Half-width on desktop, so short fields pair up instead of each taking a row. */
  half?: boolean;
};

/**
 * A small modal form used by every agency CRM write.
 *
 * One component rather than five bespoke forms: these all do the same thing (collect a few
 * typed fields, POST, surface the server's error, refresh) and the differences are entirely
 * in the field list. It keeps the server as the single source of validation truth — the
 * dialog shows whatever message the API returns rather than duplicating the rules.
 */
export function AgencyFormDialog({
  open,
  title,
  description,
  fields,
  submitLabel,
  endpoint,
  method = "POST",
  initial,
  onClose,
  onDone,
}: {
  open: boolean;
  title: string;
  description?: string;
  fields: FieldDef[];
  submitLabel: string;
  endpoint: string;
  method?: "POST" | "PATCH";
  initial?: Record<string, string | number | boolean | null>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const seed: Record<string, string | boolean> = {};
    for (const f of fields) {
      const v = initial?.[f.name];
      seed[f.name] =
        f.type === "checkbox" ? Boolean(v) : v === null || v === undefined ? "" : String(v);
    }
    setValues(seed);
    setError(null);
    // Focus the first field so the dialog is usable from the keyboard immediately.
    const id = setTimeout(() => firstRef.current?.focus(), 40);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        const raw = values[f.name];
        if (f.type === "checkbox") {
          payload[f.name] = Boolean(raw);
        } else if (raw === "" || raw === undefined) {
          // Omit empties so the server's `.optional()` handling applies rather than
          // receiving "" where it expects a number or a date.
          continue;
        } else {
          payload[f.name] = raw;
        }
      }
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : "Could not save. Please check the fields and try again."
        );
        return;
      }
      onDone();
      onClose();
    } catch {
      setError("Network problem — the change was not saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-background p-5 shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f, i) => {
            const common =
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
            return (
              <div key={f.name} className={f.half ? "sm:col-span-1" : "sm:col-span-2"}>
                {f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(values[f.name])}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.name]: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    {f.label}
                  </label>
                ) : (
                  <>
                    <label
                      htmlFor={`fld-${f.name}`}
                      className="mb-1 block text-xs font-medium text-foreground"
                    >
                      {f.label}
                      {f.required ? <span className="ml-0.5 text-destructive">*</span> : null}
                    </label>
                    {f.type === "select" ? (
                      <select
                        id={`fld-${f.name}`}
                        ref={i === 0 ? (el) => { firstRef.current = el; } : undefined}
                        required={f.required}
                        value={String(values[f.name] ?? "")}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [f.name]: e.target.value }))
                        }
                        className={common}
                      >
                        <option value="">—</option>
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`fld-${f.name}`}
                        ref={i === 0 ? (el) => { firstRef.current = el; } : undefined}
                        type={f.type ?? "text"}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={String(values[f.name] ?? "")}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [f.name]: e.target.value }))
                        }
                        className={common}
                      />
                    )}
                    {f.hint ? (
                      <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>
                    ) : null}
                  </>
                )}
              </div>
            );
          })}

          {error ? (
            <p
              role="alert"
              className="sm:col-span-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="sm:col-span-2 mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

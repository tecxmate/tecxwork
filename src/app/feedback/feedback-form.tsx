"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getFeedbackLogs } from "@/lib/feedback-log-buffer";
import type { UserRole } from "@/lib/auth";

const KINDS: Array<{ value: "bug" | "feedback" | "feature"; label: string; hint: string }> = [
  { value: "bug", label: "Bug", hint: "Something broke or behaved unexpectedly." },
  { value: "feedback", label: "Feedback", hint: "Confusing, slow, or rough — but not broken." },
  { value: "feature", label: "Feature request", hint: "Something we don't have yet." },
];

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "med", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export function FeedbackForm({
  email,
  role,
}: {
  email: string;
  role: UserRole;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [kind, setKind] = useState<"bug" | "feedback" | "feature">("bug");
  const [severity, setSeverity] = useState<"low" | "med" | "high">("med");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [referrer, setReferrer] = useState("");

  // Show the previous pathname so the user knows what gets attached.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromState = window.history.state?.feedbackReferrer;
    setReferrer(fromState || document.referrer || "/");
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Accept clipboard paste of an image anywhere in the form.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) {
            setFile(f);
            e.preventDefault();
            return;
          }
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    if (!subject.trim() || !body.trim()) {
      setError("Add a subject and a description.");
      return;
    }
    setSubmitting(true);

    try {
      let screenshotUrl: string | undefined;
      if (file) {
        if (file.size > 4 * 1024 * 1024) {
          setError("Screenshot must be 4 MB or smaller.");
          setSubmitting(false);
          return;
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", "feedback");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Upload failed");
        }
        const data = await res.json();
        screenshotUrl = data.url;
      }

      const viewport = `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`;
      const payload = {
        kind,
        severity,
        subject: subject.trim(),
        body: body.trim(),
        pathname: referrer,
        viewport,
        clientLogs: getFeedbackLogs(),
        screenshotUrl,
      };

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Submission failed");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            ✓
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Thanks — we got it.</h2>
            <p className="text-sm text-muted-foreground">
              Your report is in our queue. Expect a reply at <strong>{email}</strong> if we need more details.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDone(false);
                setSubject("");
                setBody("");
                setFile(null);
              }}
            >
              Send another
            </Button>
            <Button size="sm" onClick={() => router.push("/")}>
              Back home
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card>
        <CardContent className="space-y-5 py-5">
          {/* Kind */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Type
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                    kind === k.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-sm font-semibold">{k.label}</span>
                  <span className="text-xs text-muted-foreground">{k.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Severity (only meaningful for bug) */}
          {kind === "bug" && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Severity
              </span>
              <div className="flex gap-1.5">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`h-7 rounded-full border px-3 text-xs transition-colors ${
                      severity === s.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subject
            </span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="e.g. Booking confirmation never arrived"
              required
            />
          </label>

          {/* Body */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What happened?
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={5000}
              rows={6}
              required
              placeholder="What did you do? What did you expect? What did you see instead?"
              className="block w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground">
              {body.length} / 5000
            </p>
          </label>

          {/* Screenshot */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Screenshot (optional)
            </span>
            <div className="flex items-start gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                {file ? "Replace image" : "Attach image"}
              </Button>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              )}
              <span className="self-center text-[11px] text-muted-foreground">
                Or paste from clipboard. Max 4 MB.
              </span>
            </div>
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Screenshot preview"
                className="mt-2 max-h-64 w-auto rounded-lg border border-border object-contain"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 py-4 text-xs text-muted-foreground">
          <div className="font-semibold uppercase tracking-wider">Auto-attached</div>
          <ul className="space-y-1">
            <li>
              <span className="text-foreground">Account:</span> {email} ({role})
            </li>
            <li>
              <span className="text-foreground">Page:</span>{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                {referrer || "/"}
              </code>
            </li>
            <li>
              <span className="text-foreground">Recent client errors:</span>{" "}
              {getFeedbackLogs().length} captured
            </li>
            <li>Browser, viewport, app version</li>
          </ul>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send report"}
        </Button>
      </div>
    </form>
  );
}

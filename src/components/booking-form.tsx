"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Clock,
  AlertCircle,
} from "lucide-react";

type BookingState = "idle" | "submitting" | "success" | "error";

type SelectedSlot = {
  id: number;
  startTime: string;
  endTime: string;
};

export function BookingForm({
  recruiterId,
  company,
  contactEmail,
  slot,
  onBack,
}: {
  recruiterId: number;
  company: string;
  contactEmail: string;
  slot: SelectedSlot;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cvLink, setCvLink] = useState("");
  const [pipaConsent, setPipaConsent] = useState(false);
  const [state, setState] = useState<BookingState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const slotDate = new Date(slot.startTime);
  const formattedTime = format(slotDate, "EEEE, MMMM d 'at' HH:mm");
  const canSubmit = name.trim() && email.trim() && cvLink.trim() && pipaConsent;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          recruiterId,
          name: name.trim(),
          email: email.trim(),
          cvLink: cvLink.trim(),
          pipaConsent: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Booking failed");
      }

      setState("success");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (state === "success") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-semibold">Interview Booked!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your interview with {company} is confirmed for {formattedTime}.
            </p>
          </div>
          <Separator />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>A confirmation will be sent to {email}.</p>
            <p>
              Remember to share your CV with{" "}
              <span className="font-medium text-foreground">{contactEmail}</span> on Google Drive.
            </p>
          </div>
          <Button variant="outline" onClick={onBack} className="mt-2">
            Back to Directory
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formattedTime}</span>
        </div>
        <h3 className="font-heading text-lg font-semibold">Book with {company}</h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu.tw" autoComplete="email" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cv-link" className="text-sm font-medium">
              CV Link (Google Drive) <span className="text-destructive">*</span>
            </label>
            <Input id="cv-link" type="url" required value={cvLink} onChange={(e) => setCvLink(e.target.value)} placeholder="https://drive.google.com/file/d/..." />
            <p className="text-xs text-muted-foreground">
              Do NOT set your link to &quot;Anyone can view&quot;. Share only with{" "}
              <span className="font-medium text-foreground">{contactEmail}</span>.
            </p>
          </div>

          <Separator />

          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <input
              id="pipa-consent"
              type="checkbox"
              checked={pipaConsent}
              onChange={(e) => setPipaConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-primary"
              required
            />
            <label htmlFor="pipa-consent" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" />
              I consent to the collection of my CV link for this recruitment event in accordance with Taiwan&apos;s Personal Data Protection Act. I confirm I have only granted Drive access to the specified recruiter ({contactEmail}).
            </label>
          </div>

          {state === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Booking failed</p>
                <p className="text-xs">{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button type="submit" disabled={!canSubmit || state === "submitting"} className="flex-1">
              {state === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

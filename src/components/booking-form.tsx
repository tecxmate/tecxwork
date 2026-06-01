"use client";

import { useState, useEffect } from "react";
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
  User,
  Mail,
  FileText,
  Briefcase,
  BellRing,
} from "lucide-react";
import { useStudentI18n } from "@/components/student-locale-provider";
import { interpolate } from "@/lib/student-messages";
import { usePush } from "@/lib/use-push";

type BookingState = "idle" | "submitting" | "success" | "error";

type SelectedSlot = {
  startTime: string;
  endTime: string;
};

type Profile = {
  name: string;
  email: string;
  cvLink: string;
};

export function BookingForm({
  recruiterId,
  jobOpeningId,
  company,
  positions,
  slot,
  onBack,
  onDone,
}: {
  recruiterId: number;
  jobOpeningId?: number | null;
  company: string;
  positions: string[];
  slot: SelectedSlot;
  onBack: () => void;
  onDone?: () => void;
}) {
  const { messages } = useStudentI18n();
  const { pushEnabled, supported: pushSupported, enablePush } = usePush();
  const [enablingPush, setEnablingPush] = useState(false);
  const [justEnabledPush, setJustEnabledPush] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState("");

  async function handleEnablePush() {
    setEnablingPush(true);
    const ok = await enablePush();
    setEnablingPush(false);
    if (ok) setJustEnabledPush(true);
  }
  const [position, setPosition] = useState(positions[0] ?? "");
  const [cvLink, setCvLink] = useState("");
  const [pipaConsent, setPipaConsent] = useState(false);
  const [shareConfirm, setShareConfirm] = useState(false);
  const [state, setState] = useState<BookingState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/me/profile")
      .then(async (r) => {
        if (!r.ok) throw new Error(messages.bookingForm.couldNotLoadProfile);
        return r.json();
      })
      .then((data) => {
        setProfile(data.profile);
        setCvLink(data.profile.cvLink);
      })
      .catch((err) => {
        setProfileError(err.message || messages.bookingForm.failedToLoadProfile);
      });
  }, [messages.bookingForm.couldNotLoadProfile, messages.bookingForm.failedToLoadProfile]);

  const slotDate = new Date(slot.startTime);
  const formattedTime = format(slotDate, "EEEE, MMMM d 'at' HH:mm");
  const canSubmit = !!profile && !!position && cvLink.trim() && pipaConsent && shareConfirm;

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
          recruiterId,
          jobOpeningId,
          startTime: slot.startTime,
          position,
          cvLink: cvLink.trim(),
          pipaConsent: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || messages.bookingForm.bookingFailed);
      }

      setState("success");
    } catch (err) {
      setState("error");
      setErrorMsg(
        err instanceof Error ? err.message : messages.register.somethingWentWrong
      );
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
            <h3 className="font-heading text-xl font-semibold">
              {messages.bookingForm.applicationSubmitted}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {interpolate(messages.bookingForm.submittedBody, {
                company,
                position,
                time: formattedTime,
                status: messages.bookingForm.pendingReview,
              })}
            </p>
          </div>
          <Separator />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{messages.bookingForm.recruiterReview}</p>
          </div>
          {pushSupported && pushEnabled === false && !justEnabledPush ? (
            <div className="flex flex-col items-center gap-2 rounded-lg bg-primary/5 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {messages.bookingForm.enableNotificationsBody}
              </p>
              <Button onClick={handleEnablePush} disabled={enablingPush} className="gap-2">
                {enablingPush ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BellRing className="h-4 w-4" />
                )}
                {messages.bookingForm.enableNotificationsCta}
              </Button>
            </div>
          ) : null}
          {justEnabledPush ? (
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              {messages.bookingForm.notificationsEnabledConfirm}
            </p>
          ) : null}
          <Button variant="outline" onClick={onDone ?? onBack} className="mt-2">
            {messages.bookingForm.viewOtherPositions}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (profileError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{profileError}</p>
          <Button variant="outline" onClick={onBack}>
            {messages.common.back}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            {messages.common.loading}
          </span>
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
        <h3 className="font-heading text-lg font-semibold">
          {interpolate(messages.bookingForm.bookWith, { company })}
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile summary */}
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{profile.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">{profile.email}</span>
            </div>
          </div>

          {/* Position selector */}
          <div className="space-y-1.5">
            <label htmlFor="position" className="text-sm font-medium">
              <Briefcase className="mr-1 inline h-3.5 w-3.5" />
              {messages.bookingForm.positionApplyingFor}{" "}
              <span className="text-destructive">*</span>
            </label>
            {positions.length > 1 ? (
              <select
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm font-medium">
                {position}
              </p>
            )}
            {positions.length > 1 && (
              <p className="text-xs text-muted-foreground">
                {messages.bookingForm.multiplePositionHint}
              </p>
            )}
          </div>

          {/* CV link */}
          <div className="space-y-1.5">
            <label htmlFor="cv-link" className="text-sm font-medium">
              <FileText className="mr-1 inline h-3.5 w-3.5" />
              {messages.bookingForm.cvLink} <span className="text-destructive">*</span>
            </label>
            <Input
              id="cv-link"
              type="url"
              required
              value={cvLink}
              onChange={(e) => setCvLink(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
            />
            <p className="text-xs text-muted-foreground">
              {messages.bookingForm.cvShareOnly}
            </p>
            <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs leading-relaxed text-muted-foreground">
              <input
                type="checkbox"
                checked={shareConfirm}
                onChange={(e) => setShareConfirm(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-primary"
                required
              />
              <span>{messages.bookingForm.cvShareConfirm}</span>
            </label>
          </div>

          <Separator />

          {/* PIPA */}
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <input
              id="pipa-consent"
              type="checkbox"
              checked={pipaConsent}
              onChange={(e) => setPipaConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-primary"
              required
            />
            <label
              htmlFor="pipa-consent"
              className="cursor-pointer text-xs leading-relaxed text-muted-foreground"
            >
              <ShieldCheck className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" />
              {interpolate(messages.bookingForm.consent, { company, position })}
            </label>
          </div>

          {state === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">{messages.bookingForm.bookingFailed}</p>
                <p className="text-xs">{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              {messages.common.back}
            </Button>
            <Button type="submit" disabled={!canSubmit || state === "submitting"} className="flex-1">
              {state === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {messages.bookingForm.booking}
                </>
              ) : (
                messages.bookingForm.requestBooking
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  LogIn,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SlotPicker } from "@/components/slot-picker";
import { BookingForm } from "@/components/booking-form";
import { SiteFooter } from "@/components/site-footer";
import { useStudentI18n } from "@/components/student-locale-provider";
import { StudentLanguageSwitcher } from "@/components/student-language-switcher";
import { EVENT_CONFIG } from "@/lib/data";
import { interpolate } from "@/lib/student-messages";
import { cn } from "@/lib/utils";

type Recruiter = {
  id: number;
  company: string;
  industry: string;
  description: string;
  contactEmail: string;
};

type SelectedSlot = {
  startTime: string;
  endTime: string;
};

type JobOpening = { id: number; title: string; jdLink: string | null; description: string };

type Step = "positions" | "pick-slot" | "booking-form";

type Props = {
  recruiter: Recruiter;
  jobs: JobOpening[];
  isAuthenticated: boolean;
};

export function RecruiterDetail({ recruiter, jobs: initialJobs, isAuthenticated }: Props) {
  const { messages } = useStudentI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>("positions");
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [jobs] = useState<JobOpening[]>(initialJobs);
  const [appliedPositions, setAppliedPositions] = useState<string[]>([]);

  // Fetch which positions the student already applied to (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`/api/bookings/mine?recruiterId=${recruiter.id}`)
      .then((r) => r.json())
      .then((d) => {
        const positions = (d.bookings ?? [])
          .filter((b: { status: string }) => b.status === "pending" || b.status === "accepted" || b.status === "waitlisted")
          .map((b: { position: string }) => b.position);
        setAppliedPositions(positions);
      })
      .catch(() => {});
  }, [recruiter.id, isAuthenticated]);

  const handleSelectPosition = (title: string) => {
    if (!isAuthenticated) {
      router.push("/get-started");
      return;
    }
    setSelectedPosition(title);
    setStep("pick-slot");
  };

  const handleSlotSelect = (slot: SelectedSlot) => {
    setSelectedSlot(slot);
    setStep("booking-form");
  };

  const handleBack = () => {
    if (step === "booking-form") {
      setSelectedSlot(null);
      setStep("pick-slot");
    } else if (step === "pick-slot") {
      setSelectedPosition(null);
      setStep("positions");
    } else {
      setStep("positions");
    }
  };

  const handleDone = () => {
    // After successful booking, refresh applied positions
    if (selectedPosition) {
      setAppliedPositions([...appliedPositions, selectedPosition]);
    }
    setSelectedSlot(null);
    setSelectedPosition(null);
    setStep("positions");
  };

  // Determine which positions to show
  const positionList: { title: string; jdLink: string | null }[] = jobs.map((j) => ({
    title: j.title,
    jdLink: j.jdLink,
  }));

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="mx-auto grid max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6">
          <div className="justify-self-start">
            {step === "positions" ? (
              <Link
                href={isAuthenticated ? "/browse" : "/"}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {messages.common.back}
              </Link>
            ) : (
              <button
                onClick={handleBack}
                className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {messages.common.back}
              </button>
            )}
          </div>
          <p className="max-w-[45vw] truncate text-sm font-medium sm:max-w-md">
            {recruiter.company}
          </p>
          <div className="justify-self-end">
            <StudentLanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl">
          {/* Mobile: collapsible company info */}
          <div className="mb-4 lg:hidden">
            <Card>
              <button
                onClick={() => setInfoExpanded(!infoExpanded)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-base font-semibold">
                      {recruiter.company}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {recruiter.industry} ·{" "}
                      {interpolate(messages.recruiterDetail.positionsCount, {
                        count: positionList.length,
                      })}
                    </p>
                  </div>
                </div>
                {infoExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {infoExpanded && (
                <CardContent className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">{recruiter.description}</p>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-start gap-1.5">
                      <Mail className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="break-all">{recruiter.contactEmail}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 shrink-0" />
                      {interpolate(messages.recruiterDetail.interviewMin, {
                        duration: EVENT_CONFIG.slotDuration,
                      })}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Desktop sidebar */}
            <div className="hidden lg:col-span-2 lg:block">
              <Card>
                <CardHeader className="gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-heading text-2xl font-bold">{recruiter.company}</h1>
                    <Badge variant="secondary" className="mt-1">{recruiter.industry}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{recruiter.description}</p>
                  <Separator />
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="break-all">{recruiter.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>
                        {interpolate(messages.recruiterDetail.interviewMin, {
                          duration: EVENT_CONFIG.slotDuration,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{EVENT_CONFIG.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content — step-based */}
            <div className="lg:col-span-3">
              {step === "positions" && (
                <Card>
                  <CardHeader>
                    <h2 className="font-heading text-lg font-semibold">
                      {messages.recruiterDetail.openPositions}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {messages.recruiterDetail.reviewAndApply}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {positionList.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        {messages.recruiterDetail.noPositions}
                      </p>
                    ) : (
                      positionList.map((pos) => {
                        const alreadyApplied = appliedPositions.includes(pos.title);
                        return (
                          <div
                            key={pos.title}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
                              alreadyApplied
                                ? "border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10"
                                : "hover:border-primary/30"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <p className="text-sm font-medium">{pos.title}</p>
                                {alreadyApplied && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {messages.recruiterDetail.applied}
                                  </span>
                                )}
                              </div>
                              {pos.jdLink ? (
                                <a
                                  href={pos.jdLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <FileText className="h-3 w-3" />
                                  {messages.recruiterDetail.viewJobDescription}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <p className="mt-1 text-xs text-muted-foreground/60">
                                  {messages.recruiterDetail.noJobDescription}
                                </p>
                              )}
                            </div>
                            {!alreadyApplied ? (
                              <Button
                                size="sm"
                                onClick={() => handleSelectPosition(pos.title)}
                                className="shrink-0"
                              >
                                {isAuthenticated ? (
                                  <>
                                    {messages.recruiterDetail.apply}
                                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <LogIn className="mr-1 h-3.5 w-3.5" />
                                    {messages.recruiterDetail.loginToApply}
                                  </>
                                )}
                              </Button>
                            ) : (
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {messages.recruiterDetail.onePerPosition}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              )}

              {step === "pick-slot" && selectedPosition && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedPosition}
                      </Badge>
                    </div>
                    <h2 className="font-heading text-lg font-semibold">
                      {messages.recruiterDetail.selectTimeSlot}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {interpolate(messages.recruiterDetail.pickTime, {
                        duration: EVENT_CONFIG.slotDuration,
                      })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <SlotPicker
                      recruiterId={recruiter.id}
                      onSlotSelect={handleSlotSelect}
                    />
                  </CardContent>
                </Card>
              )}

              {step === "booking-form" && selectedSlot && selectedPosition && (
                <BookingForm
                  recruiterId={recruiter.id}
                  company={recruiter.company}
                  contactEmail={recruiter.contactEmail}
                  positions={[selectedPosition]}
                  slot={selectedSlot}
                  onBack={handleBack}
                  onDone={handleDone}
                />
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

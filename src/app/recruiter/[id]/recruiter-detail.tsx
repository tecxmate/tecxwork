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
  CheckCircle2,
  ArrowRight,
  LogIn,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RecruiterJobPostingCard } from "@/components/recruiter-job-posting-card";
import { SlotPicker } from "@/components/slot-picker";
import { BookingForm } from "@/components/booking-form";
import { SiteFooter } from "@/components/site-footer";
import { useStudentI18n } from "@/components/student-locale-provider";
import { StudentLanguageSwitcher } from "@/components/student-language-switcher";
import { EVENT_CONFIG } from "@/lib/data";
import {
  employmentTypeLabel,
  formatApplicationDeadline,
  formatSalaryRange,
  seniorityLabel,
  type JobPostingLocale,
  visaSupportLabel,
  workplaceTypeLabel,
} from "@/lib/job-posting";
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

type JobOpening = {
  id: number;
  title: string;
  jdLink: string | null;
  location: string;
  employmentType: string;
  workplaceType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  seniority: string;
  languageRequirement: string;
  visaSupport: string;
  applicationDeadline: string | null;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
};

function splitTextItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim());
}

function DetailTextBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const items = splitTextItems(value);

  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      {items.length === 1 ? (
        <p className="mt-1 whitespace-pre-wrap text-sm">{items[0]}</p>
      ) : (
        <ul className="mt-1 space-y-1 pl-4 text-sm">
          {items.map((item, index) => (
            <li key={`${label}-${index}`} className="list-disc">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Step = "positions" | "pick-slot" | "booking-form";

type Props = {
  recruiter: Recruiter;
  jobs: JobOpening[];
  isAuthenticated: boolean;
};

export function RecruiterDetail({ recruiter, jobs: initialJobs, isAuthenticated }: Props) {
  const { messages, locale } = useStudentI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>("positions");
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [jobs] = useState<JobOpening[]>(initialJobs);
  const [appliedPositions, setAppliedPositions] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(
    initialJobs.length > 0 ? initialJobs[0].id : null
  );

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;
  const postingLocale = locale as JobPostingLocale;
  const selectedEmploymentLabel = employmentTypeLabel(
    selectedJob?.employmentType,
    postingLocale
  );
  const selectedWorkplaceLabel = workplaceTypeLabel(
    selectedJob?.workplaceType,
    postingLocale
  );
  const selectedSeniorityLabel = seniorityLabel(selectedJob?.seniority, postingLocale);
  const selectedVisaSupportLabel = visaSupportLabel(
    selectedJob?.visaSupport,
    postingLocale
  );
  const selectedSalaryLabel = selectedJob
    ? formatSalaryRange({
        salaryMin: selectedJob.salaryMin,
        salaryMax: selectedJob.salaryMax,
        salaryCurrency: selectedJob.salaryCurrency,
        salaryPeriod: selectedJob.salaryPeriod,
        locale: postingLocale,
      })
    : null;
  const selectedApplicationDeadline = formatApplicationDeadline(
    selectedJob?.applicationDeadline,
    postingLocale
  );

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
                        count: jobs.length,
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
            {/* Desktop sidebar: Company info + Job list */}
            <div className="hidden lg:col-span-2 lg:block">
              <div className="sticky top-20 space-y-4">
                <Card>
                  <CardHeader className="gap-3 pb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="font-heading text-xl font-bold">{recruiter.company}</h1>
                      <Badge variant="secondary" className="mt-1 text-xs">{recruiter.industry}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-3">{recruiter.description}</p>
                    <Separator />
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="break-all">{recruiter.contactEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {interpolate(messages.recruiterDetail.interviewMin, {
                            duration: EVENT_CONFIG.slotDuration,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{EVENT_CONFIG.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compact job list */}
                {jobs.length > 0 && step === "positions" && (
                  <Card>
                    <CardHeader className="pb-2">
                      <h2 className="text-sm font-semibold text-muted-foreground">
                        {messages.recruiterDetail.openPositions}
                      </h2>
                    </CardHeader>
                    <CardContent className="space-y-1 pt-0">
                      {jobs.map((job) => {
                        const isSelected = selectedJobId === job.id;
                        const alreadyApplied = appliedPositions.includes(job.title);
                        return (
                          <button
                            key={job.id}
                            onClick={() => setSelectedJobId(job.id)}
                            className={cn(
                              "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
                              isSelected
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted",
                              alreadyApplied && !isSelected && "text-green-700 dark:text-green-400"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className={cn(
                                "truncate text-sm font-medium",
                                isSelected && "text-primary"
                              )}>
                                {job.title}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {job.location || job.employmentType}
                              </p>
                            </div>
                            {alreadyApplied && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                            )}
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Main content — step-based */}
            <div className="lg:col-span-3">
              {step === "positions" && (
                <>
                  {/* Mobile: show all jobs as cards */}
                  <div className="space-y-2 lg:hidden">
                    {jobs.length === 0 ? (
                      <Card>
                        <CardContent className="py-6">
                          <p className="text-center text-sm text-muted-foreground">
                            {messages.recruiterDetail.noPositions}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      jobs.map((job) => {
                        const alreadyApplied = appliedPositions.includes(job.title);
                        return (
                          <RecruiterJobPostingCard
                            key={job.id}
                            job={job}
                            locale={postingLocale}
                            className={cn(
                              alreadyApplied
                                ? "border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10"
                                : ""
                            )}
                            labels={{
                              seniority: messages.recruiterDetail.card.seniority,
                              languageRequirement:
                                messages.recruiterDetail.card.languageRequirement,
                              visaSupport: messages.recruiterDetail.card.visaSupport,
                              applicationDeadline:
                                messages.recruiterDetail.card.applicationDeadline,
                              description: messages.recruiterDetail.card.description,
                              responsibilities:
                                messages.recruiterDetail.card.responsibilities,
                              requirements: messages.recruiterDetail.card.requirements,
                              benefits: messages.recruiterDetail.card.benefits,
                              viewJd: messages.recruiterDetail.viewJobDescription,
                              noJd: messages.recruiterDetail.noJobDescription,
                            }}
                            status={
                              alreadyApplied ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {messages.recruiterDetail.applied}
                                </span>
                              ) : undefined
                            }
                            action={
                              !alreadyApplied ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleSelectPosition(job.title)}
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
                              )
                            }
                          />
                        );
                      })
                    )}
                  </div>

                  {/* Desktop: detailed job view */}
                  <div className="hidden lg:block">
                    {selectedJob ? (
                      <Card>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h2 className="font-heading text-xl font-bold">
                                {selectedJob.title}
                              </h2>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {recruiter.company}
                              </p>
                            </div>
                            {appliedPositions.includes(selectedJob.title) ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {messages.recruiterDetail.applied}
                              </span>
                            ) : (
                              <Button
                                onClick={() => handleSelectPosition(selectedJob.title)}
                              >
                                {isAuthenticated ? (
                                  <>
                                    {messages.recruiterDetail.apply}
                                    <ArrowRight className="ml-1.5 h-4 w-4" />
                                  </>
                                ) : (
                                  <>
                                    <LogIn className="mr-1.5 h-4 w-4" />
                                    {messages.recruiterDetail.loginToApply}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {selectedJob.location && (
                              <Badge variant="outline" className="gap-1">
                                <MapPin className="h-3 w-3" />
                                {selectedJob.location}
                              </Badge>
                            )}
                            {selectedEmploymentLabel && (
                              <Badge variant="outline" className="gap-1">
                                <Building2 className="h-3 w-3" />
                                {selectedEmploymentLabel}
                              </Badge>
                            )}
                            {selectedWorkplaceLabel && (
                              <Badge variant="outline">{selectedWorkplaceLabel}</Badge>
                            )}
                            {selectedSeniorityLabel && (
                              <Badge variant="outline">{selectedSeniorityLabel}</Badge>
                            )}
                            {selectedSalaryLabel && (
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                {selectedSalaryLabel}
                              </Badge>
                            )}
                          </div>

                          <Separator />

                          {selectedJob.languageRequirement && (
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {messages.recruiterDetail.card.languageRequirement}
                              </h3>
                              <p className="mt-1 text-sm">{selectedJob.languageRequirement}</p>
                            </div>
                          )}

                          <DetailTextBlock
                            label={messages.recruiterDetail.card.description}
                            value={selectedJob.description}
                          />

                          <DetailTextBlock
                            label={messages.recruiterDetail.card.responsibilities}
                            value={selectedJob.responsibilities}
                          />

                          <DetailTextBlock
                            label={messages.recruiterDetail.card.requirements}
                            value={selectedJob.requirements}
                          />

                          <DetailTextBlock
                            label={messages.recruiterDetail.card.benefits}
                            value={selectedJob.benefits}
                          />

                          {selectedVisaSupportLabel && (
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {messages.recruiterDetail.card.visaSupport}
                              </h3>
                              <p className="mt-1 text-sm">{selectedVisaSupportLabel}</p>
                            </div>
                          )}

                          {selectedApplicationDeadline && (
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {messages.recruiterDetail.card.applicationDeadline}
                              </h3>
                              <p className="mt-1 text-sm">{selectedApplicationDeadline}</p>
                            </div>
                          )}

                          {selectedJob.jdLink && (
                            <a
                              href={selectedJob.jdLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                            >
                              {messages.recruiterDetail.viewJobDescription}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="py-12">
                          <p className="text-center text-sm text-muted-foreground">
                            {messages.recruiterDetail.noPositions}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
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

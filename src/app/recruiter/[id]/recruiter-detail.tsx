"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Globe,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  LogIn,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AppTopBarActions } from "@/components/app-topbar-actions";
import { RecruiterJobPostingCard } from "@/components/recruiter-job-posting-card";
import { SlotPicker } from "@/components/slot-picker";
import { BookingForm } from "@/components/booking-form";
import { SiteFooter } from "@/components/site-footer";
import { useStudentI18n } from "@/components/student-locale-provider";
import { StudentLanguageSwitcher } from "@/components/student-language-switcher";
import {
  employmentTypeLabel,
  formatApplicationDeadline,
  formatSalaryRange,
  parseLanguageRequirementTokens,
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
  logoUrl: string | null;
  websiteUrl: string | null;
  galleryUrls: string[];
};

type SelectedSlot = {
  startTime: string;
  endTime: string;
};

type JobOpening = {
  id: number;
  title: string;
  jobCategory: string;
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

type DetailContentBlock =
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string };

function parseDetailContent(value: string): DetailContentBlock[] {
  const lines = value.split(/\r?\n/);
  const hasMarkers = lines.some((l) => /^\s*[-*•]\s/.test(l));
  const blocks: DetailContentBlock[] = [];
  let currentList: string[] | null = null;
  const flushList = () => {
    if (currentList && currentList.length) blocks.push({ type: "list", items: currentList });
    currentList = null;
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const m = line.match(/^[-*•]\s+(.*)$/);
    if (m) {
      currentList ??= [];
      currentList.push(m[1].trim());
    } else if (!hasMarkers) {
      currentList ??= [];
      currentList.push(line);
    } else {
      flushList();
      blocks.push({ type: "paragraph", text: line });
    }
  }
  flushList();
  return blocks;
}

function DetailTextBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const blocks = parseDetailContent(value);
  if (blocks.length === 0) return null;

  const total = blocks.reduce((s, b) => s + (b.type === "list" ? b.items.length : 1), 0);
  if (total === 1 && blocks[0].type === "paragraph") {
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <p className="mt-1 whitespace-pre-wrap text-sm">{blocks[0].text}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <div className="mt-1 space-y-2 text-sm">
        {blocks.map((block, idx) =>
          block.type === "list" ? (
            <ul
              key={`${label}-list-${idx}`}
              className="space-y-1 pl-6 marker:text-muted-foreground"
            >
              {block.items.map((item, i) => (
                <li key={`${label}-${idx}-${i}`} className="list-disc">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p key={`${label}-p-${idx}`} className="whitespace-pre-wrap">
              {block.text}
            </p>
          )
        )}
      </div>
    </div>
  );
}

type Step = "positions" | "pick-slot" | "booking-form";

type Props = {
  recruiter: Recruiter;
  jobs: JobOpening[];
  isAuthenticated: boolean;
  eventLocation: string;
  slotDuration: number;
};

export function RecruiterDetail({
  recruiter,
  jobs: initialJobs,
  isAuthenticated,
  eventLocation,
  slotDuration,
}: Props) {
  const { messages, locale } = useStudentI18n();
  const router = useRouter();
  const [step, setStep] = useState<Step>("positions");
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [jobs] = useState<JobOpening[]>(initialJobs);
  const [appliedPositions, setAppliedPositions] = useState<
    { position: string; requestedTime: string; status: string }[]
  >([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(
    initialJobs.length > 0 ? initialJobs[0].id : null
  );
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);
  const galleryTouchStartXRef = useRef<number | null>(null);

  const galleryUrls = recruiter.galleryUrls?.slice(0, 4) ?? [];
  const selectedGalleryUrl =
    selectedGalleryIndex === null ? null : galleryUrls[selectedGalleryIndex] ?? null;
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
        const bookingsList = (d.bookings ?? [])
          .filter((b: { status: string }) => b.status === "pending" || b.status === "accepted" || b.status === "waitlisted")
          .map((b: { position: string; requestedTime: string; status: string }) => ({
            position: b.position,
            requestedTime: b.requestedTime,
            status: b.status,
          }));
        setAppliedPositions(bookingsList);
      })
      .catch(() => {});
  }, [recruiter.id, isAuthenticated]);

  useEffect(() => {
    if (selectedGalleryIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedGalleryIndex(null);
      }
      if (event.key === "ArrowLeft") {
        setSelectedGalleryIndex((current) =>
          current === null ? current : Math.max(0, current - 1)
        );
      }
      if (event.key === "ArrowRight") {
        setSelectedGalleryIndex((current) =>
          current === null ? current : Math.min(galleryUrls.length - 1, current + 1)
        );
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [galleryUrls.length, selectedGalleryIndex]);

  const goToPreviousGalleryPhoto = () => {
    setSelectedGalleryIndex((current) =>
      current === null ? current : Math.max(0, current - 1)
    );
  };

  const goToNextGalleryPhoto = () => {
    setSelectedGalleryIndex((current) =>
      current === null ? current : Math.min(galleryUrls.length - 1, current + 1)
    );
  };

  const handleGalleryTouchEnd = (clientX: number) => {
    const startX = galleryTouchStartXRef.current;
    galleryTouchStartXRef.current = null;
    if (startX === null || galleryUrls.length <= 1) return;

    const deltaX = clientX - startX;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX > 0) {
      goToPreviousGalleryPhoto();
    } else {
      goToNextGalleryPhoto();
    }
  };

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
    if (selectedPosition && selectedSlot) {
      setAppliedPositions([
        ...appliedPositions,
        { position: selectedPosition, requestedTime: selectedSlot.startTime, status: "pending" },
      ]);
    }
    setSelectedSlot(null);
    setSelectedPosition(null);
    setStep("positions");
  };

  const getBookingForPosition = (positionTitle: string) =>
    appliedPositions.find((b) => b.position === positionTitle);
  const isPositionApplied = (positionTitle: string) =>
    appliedPositions.some((b) => b.position === positionTitle);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="h-[env(safe-area-inset-top)] bg-primary md:hidden" />
        <div className="mx-auto grid max-w-4xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
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
          <p className="min-w-0 truncate text-center text-sm font-medium">
            {recruiter.company}
          </p>
          <div className="justify-self-end">
            <AppTopBarActions
              mobileOverflow
              desktopChildren={<StudentLanguageSwitcher />}
              mobileChildren={
                <div className="px-2 py-2">
                  <StudentLanguageSwitcher />
                </div>
              }
            />
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
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                    {recruiter.logoUrl ? (
                      <Image
                        src={recruiter.logoUrl}
                        alt={recruiter.company}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
                    )}
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
                    {recruiter.websiteUrl && (
                      <a
                        href={recruiter.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">{recruiter.websiteUrl.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      </a>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 shrink-0" />
                      {interpolate(messages.recruiterDetail.interviewMin, {
                        duration: slotDuration,
                      })}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Company Gallery - Horizontal Carousel */}
          {galleryUrls.length > 0 && (
            <div className="mb-6 lg:hidden">
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {galleryUrls.map((url, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => setSelectedGalleryIndex(index)}
                    className="relative aspect-[4/3] w-[70vw] shrink-0 cursor-zoom-in overflow-hidden rounded-xl bg-secondary text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`View ${recruiter.company} photo ${index + 1}`}
                  >
                    <Image
                      src={url}
                      alt={`${recruiter.company} photo ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="70vw"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Desktop sidebar: Company info + Job list */}
            <div className="hidden lg:col-span-2 lg:block">
              <div className="sticky top-20 space-y-4">
                <Card>
                  <CardHeader className="gap-3 pb-3">
                    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                      {recruiter.logoUrl ? (
                        <Image
                          src={recruiter.logoUrl}
                          alt={recruiter.company}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-primary" />
                      )}
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
                      {recruiter.websiteUrl && (
                        <a
                          href={recruiter.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Globe className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{recruiter.websiteUrl.replace(/^https?:\/\//, "")}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {interpolate(messages.recruiterDetail.interviewMin, {
                            duration: slotDuration,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{eventLocation}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Desktop Gallery - Horizontal Carousel */}
                {galleryUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {galleryUrls.map((url, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setSelectedGalleryIndex(index)}
                        className="relative aspect-[4/3] w-40 shrink-0 cursor-zoom-in overflow-hidden rounded-lg bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`View ${recruiter.company} photo ${index + 1}`}
                      >
                        <Image
                          src={url}
                          alt={`${recruiter.company} photo ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="160px"
                        />
                      </button>
                    ))}
                  </div>
                )}

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
                        const alreadyApplied = isPositionApplied(job.title);
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
                        const alreadyApplied = isPositionApplied(job.title);
                        const booking = getBookingForPosition(job.title);
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
                              alreadyApplied && booking ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {messages.recruiterDetail.applied}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {interpolate(messages.recruiterDetail.interviewAt, {
                                      time: format(new Date(booking.requestedTime), "MMM d, HH:mm"),
                                    })}
                                  </span>
                                </div>
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
                            {isPositionApplied(selectedJob.title) ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {messages.recruiterDetail.applied}
                                </span>
                                {getBookingForPosition(selectedJob.title) && (
                                  <span className="text-xs text-muted-foreground">
                                    {interpolate(messages.recruiterDetail.interviewAt, {
                                      time: format(
                                        new Date(getBookingForPosition(selectedJob.title)!.requestedTime),
                                        "MMM d, HH:mm"
                                      ),
                                    })}
                                  </span>
                                )}
                              </div>
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
                              <div className="mt-1 flex flex-wrap gap-2">
                                {parseLanguageRequirementTokens(
                                  selectedJob.languageRequirement,
                                  postingLocale
                                ).map((item) => (
                                  <Badge key={item.key} variant="secondary">
                                    {item.label}
                                  </Badge>
                                ))}
                              </div>
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
                        duration: slotDuration,
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
      {selectedGalleryUrl && selectedGalleryIndex !== null && (
        <div
          className="fixed inset-0 z-50 grid grid-cols-[minmax(1.75rem,3rem)_minmax(0,1fr)_minmax(1.75rem,3rem)] items-center bg-black/90 px-1 py-3 sm:grid-cols-[minmax(3rem,5rem)_minmax(0,1fr)_minmax(3rem,5rem)] sm:px-2 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${recruiter.company} photo ${selectedGalleryIndex + 1}`}
          onClick={() => setSelectedGalleryIndex(null)}
          onTouchStart={(event) => {
            galleryTouchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches[0];
            if (touch) handleGalleryTouchEnd(touch.clientX);
          }}
          onTouchCancel={() => {
            galleryTouchStartXRef.current = null;
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedGalleryIndex(null);
            }}
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
            className="absolute right-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-background/80 text-foreground shadow-[0_12px_32px_-8px_rgba(0,0,0,0.65),0_4px_12px_-4px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5"
            aria-label="Close photo"
          >
            <X className="h-5 w-5" />
          </button>

          {galleryUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPreviousGalleryPhoto();
                }}
                disabled={selectedGalleryIndex === 0}
                className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-w-resize focus-visible:outline-none disabled:cursor-default"
                aria-label="Previous photo"
              />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToNextGalleryPhoto();
                }}
                disabled={selectedGalleryIndex === galleryUrls.length - 1}
                className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-e-resize focus-visible:outline-none disabled:cursor-default"
                aria-label="Next photo"
              />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPreviousGalleryPhoto();
                }}
                disabled={selectedGalleryIndex === 0}
                className="relative z-30 col-start-1 flex h-16 w-full items-center justify-center text-white/90 drop-shadow-[0_3px_8px_rgba(0,0,0,0.85)] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:text-white/25"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToNextGalleryPhoto();
                }}
                disabled={selectedGalleryIndex === galleryUrls.length - 1}
                className="relative z-30 col-start-3 flex h-16 w-full items-center justify-center text-white/90 drop-shadow-[0_3px_8px_rgba(0,0,0,0.85)] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:text-white/25"
                aria-label="Next photo"
              >
                <ChevronRight className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2.5} />
              </button>
            </>
          )}

          <div
            className="pointer-events-none relative col-start-2 row-start-1 h-full max-h-[calc(100dvh-2rem)] w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selectedGalleryUrl}
              alt={`${recruiter.company} photo ${selectedGalleryIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
      <SiteFooter />
    </div>
  );
}

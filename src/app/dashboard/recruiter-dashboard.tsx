"use client";

import { type ReactNode, useEffect, useState } from "react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Mail,
  FileText,
  ExternalLink,
  Calendar,
  Loader2,
  CheckCircle2,
  X,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RecruiterLanguageSwitcher } from "@/components/recruiter-language-switcher";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { SiteFooter } from "@/components/site-footer";
import { AppTopBar } from "@/components/app-topbar";
import type { PipelineBoard } from "@/lib/pipeline-types";

// ... existing Booking/Recruiter types ...

type Booking = {
  id: number;
  direction: string;
  applicantId: number | null;
  position: string | null;
  applicantName: string;
  applicantEmail: string;
  cvLink: string;
  status: string;
  createdAt: Date | null;
  requestedTime: Date | null;
  proposedTime: Date | null;
  proposedByEmail: string | null;
  slotId: number | null;
  applicantSlotId: number | null;
  slotStart: Date | null;
  slotEnd: Date | null;
  interviewerNumber: number | null;
  applicantSlotStart: Date | null;
  applicantSlotEnd: Date | null;
};

type Recruiter = {
  id: number;
  company: string;
  industry: string;
  description: string;
  contactEmail: string;
  interviewerCount: number;
  logoUrl: string | null;
  websiteUrl: string | null;
  galleryUrls: string[];
};

type Section = "interviews" | "applicants" | "pipeline" | "jobs" | "company";
const APPLICANTS_NOTICE_DISMISSED_KEY =
  "recruiter_applicants_compliance_notice_dismissed_v1";

const RecruiterCompanyTab = dynamic(
  () =>
    import("./recruiter-dashboard-company").then(
      (module) => module.RecruiterCompanyTab
    ),
  { loading: () => <DashboardTabLoader /> }
);

// dnd-kit-heavy — load only when the Pipeline tab is opened.
const DashboardPipeline = dynamic(
  () => import("../pipeline/pipeline-board").then((m) => m.DashboardPipeline),
  { loading: () => <DashboardTabLoader /> }
);

export function RecruiterDashboard({
  recruiter,
  bookings,
  section,
  jobModerationEnabled,
  salaryCurrencyOptions,
  pipelineBoard = null,
}: {
  recruiter: Recruiter;
  bookings: Booking[];
  section: Section;
  showApplicants: boolean;
  jobModerationEnabled: boolean;
  salaryCurrencyOptions: string[];
  pipelineBoard?: PipelineBoard | null;
}) {
  const router = useRouter();
  const { messages } = useRecruiterI18n();
  const [showApplicantsComplianceNotice, setShowApplicantsComplianceNotice] =
    useState(() => {
      if (typeof window === "undefined") {
        return true;
      }

      try {
        return (
          window.localStorage.getItem(APPLICANTS_NOTICE_DISMISSED_KEY) !== "1"
        );
      } catch {
        return true;
      }
    });
  const currentPath =
    section === "interviews"
      ? "/dashboard/interviews"
      : section === "applicants"
        ? "/dashboard/applicants"
        : section === "pipeline"
          ? "/dashboard/pipeline"
          : section === "jobs"
            ? "/dashboard/jobs"
            : "/dashboard/company";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  useEffect(() => {
    const recruiterRoutes = [
      "/dashboard/interviews",
      "/dashboard/applicants",
      "/dashboard/pipeline",
      "/dashboard/jobs",
      "/dashboard/company",
    ];

    for (const href of recruiterRoutes) {
      router.prefetch(href);
    }
  }, [router]);

  function dismissApplicantsComplianceNotice() {
    setShowApplicantsComplianceNotice(false);
    try {
      window.localStorage.setItem(APPLICANTS_NOTICE_DISMISSED_KEY, "1");
    } catch {
      // Ignore storage write failures.
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar
        href="/"
        navRole="recruiter"
        currentPath={currentPath}
        mobileActions={<RecruiterLanguageSwitcher />}
        showActionsOnMobile
        accountLabels={{
          roleLabel: messages.common.recruiter,
          logout: messages.common.logout,
        }}
        notificationLabels={messages.notifications}
        desktopActions={
          <>
            <RecruiterLanguageSwitcher className="sm:w-32" />
            <button
              onClick={handleLogout}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-premium hover:bg-muted/55 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              {messages.common.logout}
            </button>
          </>
        }
      />

      <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div
          className={cn(
            "mx-auto",
            section === "pipeline" ? "max-w-[1400px]" : "max-w-6xl"
          )}
        >
          {section === "interviews" ? (
            <InterviewScheduleTab bookings={bookings} />
          ) : section === "applicants" ? (
            <BookingsTab bookings={bookings} />
          ) : section === "pipeline" ? (
            pipelineBoard && pipelineBoard.jobs.length > 0 ? (
              <DashboardPipeline board={pipelineBoard} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No candidates in the pipeline yet.
              </p>
            )
          ) : section === "jobs" ? (
            <RecruiterCompanyTab
              recruiter={recruiter}
              section="jobs"
              jobModerationEnabled={jobModerationEnabled}
              salaryCurrencyOptions={salaryCurrencyOptions}
            />
          ) : (
            <RecruiterCompanyTab
              recruiter={recruiter}
              section="company"
              jobModerationEnabled={jobModerationEnabled}
              salaryCurrencyOptions={salaryCurrencyOptions}
            />
          )}
        </div>
      </main>
      {section === "applicants" && showApplicantsComplianceNotice ? (
        <div className="px-4 pb-4 sm:px-6 md:px-8">
          <div className="mx-auto max-w-6xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <div className="flex items-start justify-between gap-3">
              <p className="pr-2">
                Review applicant data only for recruitment purposes. Before
                hiring, confirm the student&apos;s legal work eligibility in
                Taiwan, respect any applicable work-permit and hour-limit rules,
                and avoid discriminatory screening criteria.
              </p>
              <button
                type="button"
                onClick={dismissApplicantsComplianceNotice}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-amber-300/70 text-amber-700 transition-colors hover:bg-amber-100/70 dark:border-amber-800/60 dark:text-amber-300 dark:hover:bg-amber-900/40"
                aria-label="Dismiss compliance notice"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <SiteFooter />
    </div>
  );
}

function getInterviewStart(booking: Booking) {
  return booking.slotStart ?? booking.applicantSlotStart ?? booking.requestedTime;
}

function getInterviewEnd(booking: Booking) {
  return booking.slotEnd ?? booking.applicantSlotEnd;
}

function BookingSummaryCard({
  booking,
  borderClassName,
  timeLabel,
  rightSlot,
  cvLabel,
}: {
  booking: Booking;
  borderClassName?: string;
  timeLabel?: string;
  rightSlot?: ReactNode;
  cvLabel: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between",
        borderClassName
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
        <a
          href={booking.cvLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <FileText className="h-4 w-4" />
          {cvLabel}
        </a>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-3">
            {booking.applicantId ? (
              <Link
                href={`/applicant/${booking.applicantId}`}
                className="truncate text-sm font-semibold transition-colors hover:text-primary hover:underline"
              >
                {booking.applicantName}
              </Link>
            ) : (
              <p className="truncate text-sm font-semibold">
                {booking.applicantName}
              </p>
            )}
          </div>
          <div className="grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-[minmax(9rem,0.9fr)_minmax(14rem,1.2fr)_minmax(9rem,0.8fr)]">
            <span className="min-w-0 truncate font-medium text-foreground/80">
              {booking.position || "—"}
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{booking.applicantEmail}</span>
            </span>
            {timeLabel ? (
              <span className="flex min-w-0 items-center gap-1 whitespace-nowrap">
                <Calendar className="h-3 w-3 shrink-0" />
                {timeLabel}
              </span>
            ) : (
              <span aria-hidden="true">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        {rightSlot}
      </div>
    </div>
  );
}

function InterviewScheduleTab({ bookings }: { bookings: Booking[] }) {
  const { messages } = useRecruiterI18n();
  const [sortBy, setSortBy] = useState<
    "time" | "interviewer" | "name" | "email" | "position"
  >("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const accepted = bookings
    .filter((booking) => booking.status === "accepted")
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === "time") {
        comparison =
          (getInterviewStart(a)?.getTime() ?? 0) -
          (getInterviewStart(b)?.getTime() ?? 0);
      } else if (sortBy === "interviewer") {
        comparison =
          (a.interviewerNumber ?? Number.MAX_SAFE_INTEGER) -
          (b.interviewerNumber ?? Number.MAX_SAFE_INTEGER);
      } else if (sortBy === "name") {
        comparison = a.applicantName.localeCompare(b.applicantName);
      } else if (sortBy === "email") {
        comparison = a.applicantEmail.localeCompare(b.applicantEmail);
      } else if (sortBy === "position") {
        comparison = (a.position ?? "").localeCompare(b.position ?? "");
      }

      if (comparison === 0 && sortBy !== "time") {
        comparison =
          (getInterviewStart(a)?.getTime() ?? 0) -
          (getInterviewStart(b)?.getTime() ?? 0);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold">
          {messages.dashboard.bookings.acceptedSchedule}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {messages.dashboard.bookings.acceptedScheduleDescription}
        </p>
      </div>

      {accepted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {messages.dashboard.bookings.noAcceptedInterviews}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-end border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Sort by:
              </span>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split("-");
                  setSortBy(
                    by as "time" | "interviewer" | "name" | "email" | "position"
                  );
                  setSortOrder(order as "asc" | "desc");
                }}
              >
                <option value="time-asc">Booking Time (Earliest)</option>
                <option value="time-desc">Booking Time (Latest)</option>
                <option value="interviewer-asc">Interviewer (Low to High)</option>
                <option value="interviewer-desc">Interviewer (High to Low)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="email-asc">Email (A-Z)</option>
                <option value="email-desc">Email (Z-A)</option>
                <option value="position-asc">Position (A-Z)</option>
                <option value="position-desc">Position (Z-A)</option>
              </select>
            </div>
          </div>
          <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {accepted.length}
            </span>
            {messages.dashboard.bookings.accepted}
          </h3>
          <div className="space-y-2">
            {accepted.map((booking) => {
              const start = getInterviewStart(booking);
              const end = getInterviewEnd(booking);
              const timeLabel = start
                ? `${format(start, "MMM d, HH:mm")}${end ? ` - ${format(end, "HH:mm")}` : ""}`
                : undefined;

              return (
                <BookingSummaryCard
                  key={booking.id}
                  booking={booking}
                  borderClassName="border-emerald-500/60 dark:border-emerald-500/50"
                  timeLabel={timeLabel}
                  cvLabel={messages.dashboard.bookings.cv}
                  rightSlot={
                    booking.interviewerNumber ? (
                      <Badge variant="secondary" className="h-8 px-3 text-xs font-normal">
                        Interviewer {booking.interviewerNumber}
                      </Badge>
                    ) : null
                  }
                />
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
}

function DashboardTabLoader() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
      </CardContent>
    </Card>
  );
}

function BookingsTab({ bookings: initialBookings }: { bookings: Booking[] }) {
  const { messages } = useRecruiterI18n();
  const [items, setItems] = useState(initialBookings);
  const [acting, setActing] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string; type: "reject" | "cancel" } | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [proposeModal, setProposeModal] = useState<{
    id: number;
    name: string;
    requestedTime: Date | null;
  } | null>(null);
  const [proposeTimeInput, setProposeTimeInput] = useState("");
  const [proposeNote, setProposeNote] = useState("");
  const [proposeError, setProposeError] = useState<string | null>(null);
  const [proposeBusy, setProposeBusy] = useState<{ start: Date; end: Date }[]>([]);
  const [proposeForce, setProposeForce] = useState(false);
  const router = useRouter();

  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  async function handleReview(id: number, action: "accept" | "reject" | "waitlist", note?: string) {
    setActing(id);
    const res = await fetch("/api/bookings/review", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id, action, note }),
    });
    if (res.ok) {
      const newStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "waitlisted";
      setItems(items.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
      router.refresh();
    }
    setActing(null);
  }

  async function handleCancel(id: number, note?: string) {
    setActing(id);
    const res = await fetch(`/api/bookings/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (res.ok) {
      setItems(items.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
      router.refresh();
    }
    setActing(null);
  }

  function openRejectModal(id: number, name: string, type: "reject" | "cancel") {
    setRejectModal({ id, name, type });
    setRejectNote("");
  }

  function openProposeModal(id: number, name: string, requestedTime: Date | null) {
    setProposeModal({ id, name, requestedTime });
    // Pre-fill with the requested time so the recruiter only needs to tweak it.
    const seed = requestedTime ? new Date(requestedTime) : new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${seed.getFullYear()}-${pad(seed.getMonth() + 1)}-${pad(seed.getDate())}T${pad(seed.getHours())}:${pad(seed.getMinutes())}`;
    setProposeTimeInput(local);
    setProposeNote("");
    setProposeError(null);
    setProposeBusy([]);
    setProposeForce(false);
    void fetch(`/api/bookings/${id}/applicant-busy`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.ranges) return;
        setProposeBusy(
          data.ranges.map((r: { start: string; end: string }) => ({
            start: new Date(r.start),
            end: new Date(r.end),
          }))
        );
      })
      .catch(() => {});
  }

  async function handleRetractProposal(id: number) {
    setActing(id);
    const res = await fetch(`/api/bookings/${id}/propose-time`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems(
        items.map((b) =>
          b.id === id
            ? { ...b, status: "pending", proposedTime: null, proposedByEmail: null }
            : b
        )
      );
      router.refresh();
    }
    setActing(null);
  }

  async function confirmPropose() {
    if (!proposeModal) return;
    if (!proposeTimeInput) {
      setProposeError("Please pick a time.");
      return;
    }
    const proposed = new Date(proposeTimeInput);
    if (isNaN(proposed.getTime())) {
      setProposeError("Invalid time.");
      return;
    }
    setActing(proposeModal.id);
    setProposeError(null);
    const res = await fetch(`/api/bookings/${proposeModal.id}/propose-time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposedTime: proposed.toISOString(),
        note: proposeNote.trim() || undefined,
        force: proposeForce || undefined,
      }),
    });
    if (res.ok) {
      setItems(
        items.map((b) =>
          b.id === proposeModal.id
            ? { ...b, status: "reschedule_proposed", proposedTime: proposed }
            : b
        )
      );
      setProposeModal(null);
      router.refresh();
    } else if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      if (data.error === "applicant_busy") {
        setProposeForce(true);
        setProposeError(
          data.message ??
            "Student is already booked with another company at this time. Click again to suggest anyway."
        );
      } else {
        setProposeForce(false);
        setProposeError(
          data.message ?? data.error ?? "Failed to propose new time."
        );
      }
    } else {
      const data = await res.json().catch(() => ({}));
      setProposeError(data.error ?? "Failed to propose new time.");
    }
    setActing(null);
  }

  async function confirmReject() {
    if (!rejectModal) return;
    if (rejectModal.type === "reject") {
      await handleReview(rejectModal.id, "reject", rejectNote);
    } else {
      await handleCancel(rejectModal.id, rejectNote);
    }
    setRejectModal(null);
    setRejectNote("");
  }

  const sortedItems = [...items].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "date") {
      const dateA = a.requestedTime ? new Date(a.requestedTime).getTime() : 0;
      const dateB = b.requestedTime ? new Date(b.requestedTime).getTime() : 0;
      comparison = dateA - dateB;
    } else if (sortBy === "name") {
      comparison = a.applicantName.localeCompare(b.applicantName);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const pending = sortedItems.filter((b) => b.status === "pending");
  const accepted = sortedItems.filter((b) => b.status === "accepted");
  const waitlisted = sortedItems.filter((b) => b.status === "waitlisted");
  const awaitingStudent = sortedItems.filter((b) => b.status === "reschedule_proposed");
  const other = sortedItems.filter((b) => b.status === "rejected" || b.status === "cancelled");

  // Design system status border colors
  const statusBorderColor: Record<string, string> = {
    pending: "border-orange-500/60 dark:border-orange-500/50",
    accepted: "border-emerald-500/60 dark:border-emerald-500/50",
    waitlisted: "border-primary/60 dark:border-primary/50",
    reschedule_proposed: "border-amber-500/60 dark:border-amber-500/50",
    rejected: "border-destructive/60 dark:border-destructive/50",
    cancelled: "border-border",
  };

  function renderBooking(b: Booking) {
    const isPending = b.status === "pending";
    const isWaitlisted = b.status === "waitlisted";
    const isAccepted = b.status === "accepted";
    const isProposed = b.status === "reschedule_proposed";
    const isActing = acting === b.id;
    const timeLabel = isProposed && b.proposedTime
      ? `${format(new Date(b.proposedTime), "MMM d, HH:mm")} (proposed)`
      : b.requestedTime
      ? format(new Date(b.requestedTime), "MMM d, HH:mm")
      : undefined;

    return (
      <BookingSummaryCard
        key={b.id}
        booking={b}
        borderClassName={statusBorderColor[b.status]}
        timeLabel={timeLabel}
        cvLabel={messages.dashboard.bookings.cv}
        rightSlot={
          <>
            {(isPending || isWaitlisted) ? (
            <>
              <Button size="sm" disabled={isActing} onClick={() => handleReview(b.id, "accept")} className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                {messages.dashboard.bookings.accept}
              </Button>
              {isPending && (
                <Button size="sm" variant="outline" disabled={isActing} onClick={() => handleReview(b.id, "waitlist")} className="h-8">
                  {messages.dashboard.bookings.waitlist}
                </Button>
              )}
              <Button size="sm" variant="outline" disabled={isActing} onClick={() => openProposeModal(b.id, b.applicantName, b.requestedTime)} className="h-8">
                {messages.dashboard.bookings.suggestTime}
              </Button>
              <Button size="sm" variant="outline" disabled={isActing} onClick={() => openRejectModal(b.id, b.applicantName, "reject")} className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10">
                {messages.dashboard.bookings.reject}
              </Button>
            </>
            ) : null}
            {isAccepted ? (
            <Button size="sm" variant="outline" disabled={isActing} onClick={() => openRejectModal(b.id, b.applicantName, "cancel")} className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10">
              {messages.dashboard.bookings.cancelInterview}
            </Button>
            ) : null}
            {isProposed ? (
              <>
                <Button size="sm" variant="outline" disabled={isActing} onClick={() => openProposeModal(b.id, b.applicantName, b.proposedTime ?? b.requestedTime)} className="h-8">
                  {messages.dashboard.bookings.changeProposedTime}
                </Button>
                <Button size="sm" variant="outline" disabled={isActing} onClick={() => handleRetractProposal(b.id)} className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10">
                  {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {messages.dashboard.bookings.retractProposal}
                </Button>
              </>
            ) : null}
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold">
          {messages.dashboard.bookings.applicationStages}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {messages.dashboard.bookings.applicationStagesDescription}
        </p>
      </div>

      {/* Controls Header */}
      {items.length > 0 && (
        <div className="flex justify-end border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split("-");
                setSortBy(by as "date" | "name");
                setSortOrder(order as "asc" | "desc");
              }}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      )}

      {/* Pending — most urgent */}
      {pending.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-[10px] font-bold text-orange-600 dark:text-orange-400">
              {pending.length}
            </span>
            {messages.dashboard.bookings.pendingReview}
          </h3>
          <div className="space-y-2">{pending.map(renderBooking)}</div>
        </div>
      )}

      {/* Awaiting student response on proposed new time */}
      {awaitingStudent.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              {awaitingStudent.length}
            </span>
            {messages.dashboard.bookings.awaitingStudent}
          </h3>
          <div className="space-y-2">{awaitingStudent.map(renderBooking)}</div>
        </div>
      )}

      {/* Accepted */}
      {accepted.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {accepted.length}
            </span>
            {messages.dashboard.bookings.accepted}
          </h3>
          <div className="space-y-2">{accepted.map(renderBooking)}</div>
        </div>
      )}

      {/* Waitlisted */}
      {waitlisted.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
              {waitlisted.length}
            </span>
            {messages.dashboard.bookings.waitlisted}
          </h3>
          <div className="space-y-2">{waitlisted.map(renderBooking)}</div>
        </div>
      )}

      {/* Rejected/Cancelled */}
      {other.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
              {other.length}
            </span>
            {messages.dashboard.bookings.past}
          </h3>
          <div className="space-y-2">{other.map(renderBooking)}</div>
        </div>
      )}

      {items.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{messages.dashboard.bookings.noApplications}</p>
          </CardContent>
        </Card>
      )}

      {/* Suggest-time modal */}
      {proposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold">
                {messages.dashboard.bookings.proposeTitle}
              </h3>
              <button
                onClick={() => setProposeModal(null)}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {messages.dashboard.bookings.proposeDescription.replace("{name}", proposeModal.name)}
            </p>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {messages.dashboard.bookings.proposeTimeLabel}
            </label>
            {(() => {
              const proposedDate = proposeTimeInput ? new Date(proposeTimeInput) : null;
              const proposedEnd = proposedDate
                ? new Date(proposedDate.getTime() + 30 * 60 * 1000)
                : null;
              const conflict =
                proposedDate && proposedEnd
                  ? proposeBusy.find(
                      (r) =>
                        proposedDate.getTime() < r.end.getTime() &&
                        proposedEnd.getTime() > r.start.getTime()
                    ) ?? null
                  : null;
              return (
                <>
                  <input
                    type="datetime-local"
                    value={proposeTimeInput}
                    onChange={(e) => {
                      setProposeTimeInput(e.target.value);
                      setProposeForce(false);
                      setProposeError(null);
                    }}
                    className={cn(
                      "mb-2 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2",
                      conflict
                        ? "border-destructive focus:ring-destructive"
                        : "border-input focus:ring-primary"
                    )}
                  />
                  {proposeBusy.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-1 text-xs text-muted-foreground">
                        Student is busy with other companies:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {proposeBusy.map((r, i) => {
                          const isHit =
                            conflict &&
                            r.start.getTime() === conflict.start.getTime() &&
                            r.end.getTime() === conflict.end.getTime();
                          return (
                            <span
                              key={i}
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[11px]",
                                isHit
                                  ? "border-destructive bg-destructive/10 text-destructive"
                                  : "border-muted-foreground/30 bg-muted text-muted-foreground"
                              )}
                            >
                              {format(r.start, "EEE HH:mm")}–{format(r.end, "HH:mm")}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            <textarea
              value={proposeNote}
              onChange={(e) => setProposeNote(e.target.value)}
              placeholder={messages.dashboard.bookings.notePlaceholder ?? "Optional: Add a message for the student..."}
              rows={3}
              className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {proposeError && (
              <p className="mb-3 text-xs text-destructive">{proposeError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setProposeModal(null)}>
                {messages.common?.cancel ?? "Cancel"}
              </Button>
              <Button
                disabled={acting === proposeModal.id}
                onClick={confirmPropose}
              >
                {acting === proposeModal.id ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                {proposeForce
                  ? "Suggest anyway"
                  : messages.dashboard.bookings.proposeConfirm}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection/Cancellation Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold">
                {rejectModal.type === "reject"
                  ? messages.dashboard.bookings.rejectTitle ?? "Decline Application"
                  : messages.dashboard.bookings.cancelTitle ?? "Cancel Interview"}
              </h3>
              <button
                onClick={() => setRejectModal(null)}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {rejectModal.type === "reject"
                ? messages.dashboard.bookings.rejectDescription ?? `You are declining the application from ${rejectModal.name}. Add an optional note to let them know why.`
                : messages.dashboard.bookings.cancelDescription ?? `You are cancelling the interview with ${rejectModal.name}. Add an optional note to let them know why.`}
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={messages.dashboard.bookings.notePlaceholder ?? "Optional: Add a message for the student..."}
              rows={3}
              className="mb-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectModal(null)}>
                {messages.common?.cancel ?? "Cancel"}
              </Button>
              <Button
                variant="destructive"
                disabled={acting === rejectModal.id}
                onClick={confirmReject}
              >
                {acting === rejectModal.id ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                {rejectModal.type === "reject"
                  ? messages.dashboard.bookings.confirmReject ?? "Decline"
                  : messages.dashboard.bookings.confirmCancel ?? "Cancel Interview"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

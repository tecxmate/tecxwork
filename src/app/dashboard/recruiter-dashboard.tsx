"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Building2,
  LogOut,
  Mail,
  FileText,
  ExternalLink,
  Search,
  Calendar,
  Loader2,
  Users,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Plus,
  Briefcase,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RecruiterLanguageSwitcher } from "@/components/recruiter-language-switcher";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { SlotPicker } from "@/components/slot-picker-applicant";
import { SiteFooter } from "@/components/site-footer";
import { isNavItemActive, navItemsByRole } from "@/lib/navigation";

type Booking = {
  id: number;
  direction: string;
  position: string | null;
  applicantName: string;
  applicantEmail: string;
  cvLink: string;
  status: string;
  createdAt: Date | null;
  requestedTime: Date | null;
  slotId: number | null;
};

type Recruiter = {
  id: number;
  company: string;
  industry: string;
  description: string;
  contactEmail: string;
  interviewerCount: number;
};

type Applicant = {
  id: number;
  name: string;
  email: string;
  major: string;
  skills: string[];
  cvLink: string;
  description: string;
};

type Tab = "bookings" | "applicants" | "company";

export function RecruiterDashboard({
  recruiter,
  bookings,
  initialTab,
}: {
  recruiter: Recruiter;
  bookings: Booking[];
  initialTab: Tab;
}) {
  const router = useRouter();
  const { messages } = useRecruiterI18n();
  const tab = initialTab;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:h-screen md:w-72 md:flex-col md:border-r md:bg-card/95 md:px-5 md:py-6 md:backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(140,82,255,0.22)]">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-lg font-semibold leading-tight">
              {recruiter.company}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {recruiter.contactEmail}
            </p>
          </div>
        </div>

        <RecruiterSidebarNav />

        <div className="mt-auto space-y-3 border-t pt-5">
          <RecruiterLanguageSwitcher />
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-xl border border-border bg-background text-sm font-medium text-muted-foreground transition-premium hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
          >
            {messages.common.viewSite}
          </Link>
          <Button variant="outline" className="h-11 w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {messages.common.logout}
          </Button>
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col md:min-h-screen md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:hidden dark:bg-card/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="max-w-[160px] truncate font-heading text-lg font-bold">
                {recruiter.company}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <RecruiterLanguageSwitcher />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                {messages.common.logout}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl md:max-w-none">
            <div className="mb-6 hidden items-center justify-between gap-4 md:flex">
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight">
                  {recruiter.company}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {recruiter.industry}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {recruiter.contactEmail}
              </div>
            </div>

            {tab === "bookings" ? (
              <BookingsTab bookings={bookings} />
            ) : tab === "applicants" ? (
              <ApplicantsTab recruiterId={recruiter.id} />
            ) : (
              <CompanyTab recruiter={recruiter} />
            )}
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

function RecruiterSidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return (
    <nav className="mt-8 space-y-2">
      {navItemsByRole.recruiter.map((item) => {
        const active = isNavItemActive(pathname, search, item);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-premium",
              active
                ? "bg-primary/10 text-primary shadow-[0_14px_34px_rgba(140,82,255,0.12)]"
                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4.5 w-4.5", active && "scale-105")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function BookingsTab({ bookings: initialBookings }: { bookings: Booking[] }) {
  const { messages } = useRecruiterI18n();
  const [items, setItems] = useState(initialBookings);
  const [acting, setActing] = useState<number | null>(null);
  const router = useRouter();

  async function handleReview(id: number, action: "accept" | "reject" | "waitlist") {
    setActing(id);
    const res = await fetch("/api/bookings/review", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id, action }),
    });
    if (res.ok) {
      const newStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "waitlisted";
      setItems(items.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
      router.refresh();
    }
    setActing(null);
  }

  async function handleCancel(id: number) {
    if (!confirm(messages.dashboard.bookings.cancelConfirm)) return;
    setActing(id);
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems(items.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
      router.refresh();
    }
    setActing(null);
  }

  const pending = items.filter((b) => b.status === "pending");
  const accepted = items.filter((b) => b.status === "accepted");
  const waitlisted = items.filter((b) => b.status === "waitlisted");
  const other = items.filter((b) => b.status === "rejected" || b.status === "cancelled");

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    waitlisted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  function renderBooking(b: Booking) {
    const isPending = b.status === "pending";
    const isWaitlisted = b.status === "waitlisted";
    const isAccepted = b.status === "accepted";
    const isActing = acting === b.id;

    return (
      <Card key={b.id} className={isPending ? "border-yellow-300/50" : ""}>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{b.applicantName}</p>
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColor[b.status] ?? "")}>
                    {messages.dashboard.status[b.status as keyof typeof messages.dashboard.status] ?? b.status}
                  </span>
                  {b.position && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {b.position}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {b.applicantEmail}
                  </span>
                  {b.requestedTime && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(b.requestedTime), "MMM d, HH:mm")}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={b.cvLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <FileText className="h-3 w-3" />
                {messages.dashboard.bookings.cv}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Actions */}
            {(isPending || isWaitlisted) && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={isActing}
                  onClick={() => handleReview(b.id, "accept")}
                  className="h-8 bg-green-600 text-white hover:bg-green-700"
                >
                  {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />}
                  {messages.dashboard.bookings.accept}
                </Button>
                {isPending && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActing}
                    onClick={() => handleReview(b.id, "waitlist")}
                    className="h-8"
                  >
                    {messages.dashboard.bookings.waitlist}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isActing}
                  onClick={() => handleReview(b.id, "reject")}
                  className="h-8 text-destructive hover:bg-destructive/10"
                >
                  {messages.dashboard.bookings.reject}
                </Button>
              </div>
            )}
            {isAccepted && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleCancel(b.id)}
                  className="cursor-pointer text-xs text-muted-foreground hover:text-destructive hover:underline"
                >
                  {messages.dashboard.bookings.cancelInterview}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending — most urgent */}
      {pending.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-[10px] font-bold text-yellow-700">
              {pending.length}
            </span>
            {messages.dashboard.bookings.pendingReview}
          </h3>
          <div className="space-y-2">{pending.map(renderBooking)}</div>
        </div>
      )}

      {/* Accepted */}
      {accepted.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-green-700 dark:text-green-400">
            {messages.dashboard.bookings.accepted} ({accepted.length})
          </h3>
          <div className="space-y-2">{accepted.map(renderBooking)}</div>
        </div>
      )}

      {/* Waitlisted */}
      {waitlisted.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
            {messages.dashboard.bookings.waitlisted} ({waitlisted.length})
          </h3>
          <div className="space-y-2">{waitlisted.map(renderBooking)}</div>
        </div>
      )}

      {/* Rejected/Cancelled */}
      {other.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            {messages.dashboard.bookings.past} ({other.length})
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
    </div>
  );
}

function ApplicantsTab({ recruiterId }: { recruiterId: number }) {
  const { messages } = useRecruiterI18n();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  );

  useEffect(() => {
    fetch("/api/applicants")
      .then((r) => r.json())
      .then((data) => setApplicants(data.applicants ?? []))
      .catch(() => setApplicants([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = applicants.filter((a) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.major.toLowerCase().includes(q) ||
      a.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  if (selectedApplicant) {
    return (
      <ApplicantBookingView
        applicant={selectedApplicant}
        recruiterId={recruiterId}
        onBack={() => setSelectedApplicant(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
        Review applicant data only for recruitment purposes. Before hiring, confirm the
        student&apos;s legal work eligibility in Taiwan, respect any applicable work-permit
        and hour-limit rules, and avoid discriminatory screening criteria.
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={messages.dashboard.applicants.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            {messages.dashboard.applicants.loading}
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {messages.dashboard.applicants.empty}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((a) => (
            <Card
              key={a.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelectedApplicant(a)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{a.name}</p>
                    {a.major && (
                      <p className="text-xs text-muted-foreground">
                        {a.major}
                      </p>
                    )}
                  </div>
                  <a
                    href={a.cvLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="h-3 w-3" />
                      {messages.dashboard.applicants.cv}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
                {a.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.skills.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                {a.description && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {a.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantBookingView({
  applicant,
  recruiterId,
  onBack,
}: {
  applicant: Applicant;
  recruiterId: number;
  onBack: () => void;
}) {
  const { messages } = useRecruiterI18n();
  const [bookingState, setBookingState] = useState<
    "picking" | "confirming" | "success" | "error"
  >("picking");
  const [selectedSlot, setSelectedSlot] = useState<{
    id: number;
    startTime: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleConfirm() {
    if (!selectedSlot) return;
    setBookingState("confirming");

    try {
      const res = await fetch("/api/bookings/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantSlotId: selectedSlot.id,
          recruiterId,
          applicantId: applicant.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || messages.signup.errors.somethingWentWrong);

      setBookingState("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setBookingState("error");
    }
  }

  if (bookingState === "success") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-heading text-xl font-semibold">
            {messages.dashboard.applicants.booked}
          </h3>
          <p className="text-sm text-muted-foreground">
            {messages.dashboard.applicants.interviewWith} {applicant.name} at{" "}
            {selectedSlot &&
              format(new Date(selectedSlot.startTime), "MMM d, HH:mm")}
            .
          </p>
          <Button variant="outline" onClick={onBack}>
            {messages.dashboard.applicants.backToApplicants}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={onBack}>
        {messages.dashboard.applicants.backToApplicants}
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Applicant info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-heading text-lg font-semibold">
              {applicant.name}
            </h2>
            {applicant.major && (
              <p className="text-sm text-muted-foreground">
                {applicant.major}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {applicant.description && (
              <p className="text-sm text-muted-foreground">
                {applicant.description}
              </p>
            )}
            {applicant.skills.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-1.5">
                  {applicant.skills.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {applicant.email}
            </div>
            <a
              href={applicant.cvLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              {messages.dashboard.applicants.viewCv}
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        {/* Slot picker */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <h3 className="font-heading text-lg font-semibold">
              {messages.dashboard.applicants.selectSlot}
            </h3>
            <p className="text-sm text-muted-foreground">
              {messages.dashboard.applicants.pickFromAvailability} {applicant.name}
              {messages.dashboard.applicants.availabilitySuffix}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <SlotPicker
              applicantId={applicant.id}
              onSlotSelect={(slot) => setSelectedSlot(slot)}
            />

            {selectedSlot && bookingState === "picking" && (
              <Button onClick={handleConfirm} className="w-full">
                {messages.dashboard.applicants.confirmBookingAt}{" "}
                {format(new Date(selectedSlot.startTime), "HH:mm")}
              </Button>
            )}

            {bookingState === "confirming" && (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {messages.dashboard.applicants.booking}
              </Button>
            )}

            {bookingState === "error" && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {errorMsg}
                <button
                  onClick={() => setBookingState("picking")}
                  className="mt-1 block text-xs underline"
                >
                  {messages.common.tryAgain}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type JobOpening = {
  id: number;
  title: string;
  jdLink: string | null;
  description: string;
  moderationStatus: string;
  moderationNotes: string;
};

function CompanyTab({ recruiter }: { recruiter: Recruiter }) {
  const { messages } = useRecruiterI18n();
  const router = useRouter();

  // Company info
  const [description, setDescription] = useState(recruiter.description);
  const [interviewerCount, setInterviewerCount] = useState(recruiter.interviewerCount);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Job openings
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newJdLink, setNewJdLink] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editJdLink, setEditJdLink] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [jobError, setJobError] = useState("");

  useEffect(() => {
    fetch("/api/me/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .finally(() => setLoadingJobs(false));
  }, []);

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/me/recruiter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), interviewerCount }),
      });
      if (!res.ok) throw new Error(messages.dashboard.company.saveFailed);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : messages.dashboard.company.errorFallback);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddJob(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setJobError("");
    const res = await fetch("/api/me/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        jdLink: newJdLink.trim() || null,
        description: newDescription.trim(),
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setJobs([...jobs, d.job]);
      setNewTitle("");
      setNewJdLink("");
      setNewDescription("");
    } else {
      const d = await res.json().catch(() => ({}));
      setJobError(d.error || "Failed to create job");
    }
  }

  async function handleUpdateJob(id: number) {
    setJobError("");
    const res = await fetch(`/api/me/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        jdLink: editJdLink.trim() || null,
        description: editDescription.trim(),
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setJobs(jobs.map((j) => (j.id === id ? d.job : j)));
      setEditingId(null);
    } else {
      const d = await res.json().catch(() => ({}));
      setJobError(d.error || "Failed to update job");
    }
  }

  async function handleDeleteJob(id: number) {
    if (!confirm(messages.dashboard.company.removePositionConfirm)) return;
    await fetch(`/api/me/jobs/${id}`, { method: "DELETE" });
    setJobs(jobs.filter((j) => j.id !== id));
  }

  async function handleSubmitJob(id: number) {
    setJobError("");
    const res = await fetch(`/api/me/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit" }),
    });
    if (res.ok) {
      const d = await res.json();
      setJobs(jobs.map((j) => (j.id === id ? d.job : j)));
    } else {
      const d = await res.json().catch(() => ({}));
      setJobError(d.error || "Failed to submit job");
    }
  }

  const statusLabel: Record<string, string> = {
    draft: messages.dashboard.company.moderationStatus.draft,
    pending_review: messages.dashboard.company.moderationStatus.pendingReview,
    approved: messages.dashboard.company.moderationStatus.approved,
    rejected: messages.dashboard.company.moderationStatus.rejected,
  };

  const statusClassName: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    pending_review: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* Company info */}
      <Card>
        <CardHeader>
          <h2 className="font-heading text-lg font-semibold">{recruiter.company}</h2>
          <p className="text-xs text-muted-foreground">{recruiter.industry} · {recruiter.contactEmail}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="desc" className="text-sm font-medium">{messages.dashboard.company.companyDescription}</label>
              <textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={messages.dashboard.company.whatDoesCompanyDo}
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ic" className="text-sm font-medium">{messages.dashboard.company.interviewerCount}</label>
              <Input
                id="ic"
                type="number"
                min={1}
                max={10}
                value={interviewerCount}
                onChange={(e) => setInterviewerCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">
                {messages.dashboard.company.interviewerHintPrefix}
                {interviewerCount}
                {messages.dashboard.company.interviewerHintMiddle}
                {interviewerCount > 1 ? messages.dashboard.company.interviewerHintPlural : ""}
                {messages.dashboard.company.interviewerHintSuffix}
                {interviewerCount}
                {messages.dashboard.company.interviewerHintTail}
              </p>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {saved && <p className="text-xs text-green-600">{messages.dashboard.company.saved}</p>}
            <Button type="submit" disabled={saving} size="sm">
              {saving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{messages.dashboard.company.saving}</> : messages.dashboard.company.saveCompanyInfo}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Job Openings CRUD */}
      <Card>
        <CardHeader>
          <h2 className="font-heading text-lg font-semibold">{messages.dashboard.company.jobOpenings}</h2>
          <p className="text-xs text-muted-foreground">
            {messages.dashboard.company.jobOpeningsHint}
          </p>
          <p className="text-xs text-muted-foreground">
            {messages.dashboard.company.moderationHint}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new job */}
          <form onSubmit={handleAddJob} className="space-y-2 rounded-lg border bg-muted/20 p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={messages.dashboard.company.positionTitle}
                required
              />
              <Input
                value={newJdLink}
                onChange={(e) => setNewJdLink(e.target.value)}
                placeholder={messages.dashboard.company.jdLinkOptional}
                type="url"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={messages.dashboard.company.descriptionPlaceholder}
                rows={3}
                className="sm:col-span-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <Button type="submit" size="sm" disabled={!newTitle.trim()}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                {messages.dashboard.company.add}
              </Button>
            </div>
          </form>
          {jobError && <p className="text-xs text-destructive">{jobError}</p>}

          {/* Job list */}
          {loadingJobs ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {messages.dashboard.company.noPositions}
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) =>
                editingId === job.id ? (
                  <div key={job.id} className="rounded-lg border border-primary/30 p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder={messages.dashboard.company.title}
                      />
                      <Input
                        value={editJdLink}
                        onChange={(e) => setEditJdLink(e.target.value)}
                        placeholder={messages.dashboard.company.jdLinkShort}
                        type="url"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder={messages.dashboard.company.descriptionPlaceholder}
                        rows={3}
                        className="sm:col-span-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateJob(job.id)}>
                        {messages.common.save}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        {messages.common.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{job.title}</p>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            statusClassName[job.moderationStatus] ?? "bg-muted text-muted-foreground"
                          )}
                        >
                          {statusLabel[job.moderationStatus] ?? job.moderationStatus}
                        </span>
                      </div>
                      {job.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {job.description}
                        </p>
                      )}
                      {job.jdLink && (
                        <a
                          href={job.jdLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          {messages.dashboard.company.viewJd}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {!job.jdLink && (
                        <p className="text-xs text-muted-foreground">{messages.dashboard.company.noJdLink}</p>
                      )}
                      {job.moderationNotes && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                          {messages.dashboard.company.adminNotePrefix} {job.moderationNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      {job.moderationStatus !== "pending_review" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubmitJob(job.id)}
                        >
                          {messages.dashboard.company.submitForReview}
                        </Button>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(job.id);
                          setEditTitle(job.title);
                          setEditJdLink(job.jdLink ?? "");
                          setEditDescription(job.description ?? "");
                        }}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                        aria-label={messages.dashboard.company.edit}
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={messages.dashboard.company.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  LogOut,
  Mail,
  FileText,
  ExternalLink,
  Calendar,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RecruiterLanguageSwitcher } from "@/components/recruiter-language-switcher";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { SiteFooter } from "@/components/site-footer";
import { isNavItemActive, navItemsByRole } from "@/lib/navigation";
import { AppTopBar } from "@/components/app-topbar";

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

const RecruiterApplicantsTab = dynamic(
  () =>
    import("./recruiter-dashboard-applicants").then(
      (module) => module.RecruiterApplicantsTab
    ),
  { loading: () => <DashboardTabLoader /> }
);

const RecruiterCompanyTab = dynamic(
  () =>
    import("./recruiter-dashboard-company").then(
      (module) => module.RecruiterCompanyTab
    ),
  { loading: () => <DashboardTabLoader /> }
);

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
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:h-screen md:w-72 md:flex-col md:border-r md:bg-card md:px-5 md:py-6">
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
            className="flex h-11 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground transition-premium hover:bg-muted/55 hover:text-foreground"
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
        <div className="md:hidden">
          <AppTopBar href="/dashboard" />
        </div>

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
              <RecruiterApplicantsTab recruiterId={recruiter.id} />
            ) : (
              <RecruiterCompanyTab recruiter={recruiter} />
            )}
          </div>
        </main>
        <SiteFooter />
      </div>
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

function RecruiterSidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return (
    <nav className="mt-8 space-y-1.5">
      {navItemsByRole.recruiter.map((item) => {
        const active = isNavItemActive(pathname, search, item);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-premium",
              active
                ? "border-primary/18 bg-primary/[0.06] text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/55 hover:text-foreground"
            )}
          >
            <Icon className="h-4.5 w-4.5" />
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

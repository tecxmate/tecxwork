"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Users,
  Calendar,
  BookOpen,
  Briefcase,
  ChevronDown,
  Clock,
  LogOut,
  GraduationCap,
  Settings,
  Plus,
  Trash2,
  AtSign,
  Lock,
  LockOpen,
  Download,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Mail,
  Send,
  FileText,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/site-footer";
import dynamic from "next/dynamic";

const QRCard = dynamic(() => import("@/components/qr-code").then((m) => m.QRCard), {
  ssr: false,
  loading: () => <div className="h-[120px] w-[120px] animate-pulse rounded-lg bg-muted" />,
});
import { MultiImageUpload } from "@/components/image-upload";
import { AppTopBar } from "@/components/app-topbar";
import { useStudentI18n } from "@/components/student-locale-provider";
import { interpolate } from "@/lib/student-messages";

type Recruiter = {
  id: number;
  name: string;
  company: string;
  industry: string;
  contactEmail: string;
  email: string;
  createdAt: Date | string;
};

type Applicant = {
  id: number;
  name: string;
  email: string;
  major: string;
  createdAt: Date | string;
};

type AdminBooking = {
  id: number;
  applicantId: number | null;
  position: string | null;
  applicantName: string;
  applicantEmail: string;
  cvLink: string;
  status: string;
  requestedTime: Date | string | null;
  createdAt: Date | string | null;
  company: string;
};

type Domain = {
  id: number;
  domain: string;
  company: string;
  industry: string;
};

type RecruiterApproval = {
  id: number;
  email: string;
  company: string;
  industry: string;
  status: string;
  createdAt: Date | string;
  approvedAt: Date | string;
};

type JobOpening = {
  id: number;
  recruiterId: number;
  company: string;
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
  moderationStatus: string;
  moderationNotes: string;
  submittedAt: Date | string | null;
  reviewedAt: Date | string | null;
  createdAt: Date | string;
};

type Stats = {
  totalRecruiters: number;
  totalBookings: number;
  activeBookings: number;
  totalSlots: number;
  availableSlots: number;
  totalApplicants: number;
};

const ONBOARDING_MODE_VALUES = ["minimal", "full"] as const;

const INDUSTRY_OPTIONS = [
  "Technology",
  "Finance",
  "Semiconductor",
  "Manufacturing",
  "Consulting",
  "Healthcare",
  "E-Commerce",
] as const;

type OnboardingMode = (typeof ONBOARDING_MODE_VALUES)[number];
type AdminSection = "overview" | "recruiters" | "applicants" | "jobs";

export function AdminDashboard({
  recruiters: initialRecruiters,
  applicants: initialApplicants,
  bookings: initialBookings,
  jobs: initialJobs,
  domains: initialDomains,
  recruiterApprovals: initialRecruiterApprovals,
  stats,
  currentMode,
  initialOnboardingMode,
  initialJobModerationEnabled,
  initialLocked,
  timeFrame: initialTimeFrame,
  initialHomepageImages,
  section,
}: {
  recruiters: Recruiter[];
  applicants: Applicant[];
  bookings: AdminBooking[];
  jobs: JobOpening[];
  domains: Domain[];
  recruiterApprovals: RecruiterApproval[];
  stats: Stats;
  currentMode: string;
  initialOnboardingMode: OnboardingMode;
  initialJobModerationEnabled: boolean;
  initialLocked: boolean;
  timeFrame: { startHour: number; startMinute: number; endHour: number; endMinute: number; slotDuration: number; bufferMinutes: number };
  initialHomepageImages: string[];
  section: AdminSection;
}) {
  const { messages } = useStudentI18n();
  const admin = messages.admin;
  const router = useRouter();
  const [mode, setMode] = useState(currentMode);
  const [onboardingMode, setOnboardingMode] = useState<OnboardingMode>(initialOnboardingMode);
  const [jobModerationEnabled, setJobModerationEnabled] = useState(
    initialJobModerationEnabled
  );
  const [locked, setLocked] = useState(initialLocked);
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [recruiterApprovals, setRecruiterApprovals] = useState<
    RecruiterApproval[]
  >(initialRecruiterApprovals);
  const [recruiters, setRecruiters] = useState<Recruiter[]>(initialRecruiters);
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);
  const [adminBookings, setAdminBookings] = useState<AdminBooking[]>(initialBookings);
  const [jobs, setJobs] = useState<JobOpening[]>(initialJobs);
  const [tf, setTf] = useState(initialTimeFrame);
  const [tfSaving, setTfSaving] = useState(false);
  const [tfSaved, setTfSaved] = useState(false);
  const [tfError, setTfError] = useState("");
  const [homepageImages, setHomepageImages] = useState<string[]>(initialHomepageImages ?? []);
  const [hpSaving, setHpSaving] = useState(false);
  const [hpSaved, setHpSaved] = useState(false);
  const [timeFrameOpen, setTimeFrameOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [emailStats, setEmailStats] = useState<{
    today: { sent: number; failed: number; limit: number; remaining: number; percentUsed: number };
    month: { sent: number; limit: number; remaining: number; percentUsed: number };
  } | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<{
    studentsSent: number;
    recruitersSent: number;
  } | null>(null);

  // Fetch email stats
  useEffect(() => {
    fetch("/api/admin/email-stats")
      .then((res) => res.json())
      .then((data) => setEmailStats(data))
      .catch(() => { });
  }, []);

  // Domain form
  const [newDomain, setNewDomain] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newIndustry, setNewIndustry] = useState("Technology");
  const [domainError, setDomainError] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  const modes = [
    {
      value: "applicant_books_recruiter",
      label: admin.eventMode.modes.applicantBooksRecruiters.label,
      desc: admin.eventMode.modes.applicantBooksRecruiters.desc,
    },
    {
      value: "recruiter_books_applicant",
      label: admin.eventMode.modes.recruitersBookApplicants.label,
      desc: admin.eventMode.modes.recruitersBookApplicants.desc,
    },
    {
      value: "both",
      label: admin.eventMode.modes.both.label,
      desc: admin.eventMode.modes.both.desc,
    },
  ] as const;

  const onboardingModes = [
    {
      value: "minimal" as const,
      label: admin.onboarding.modes.minimal.label,
      desc: admin.onboarding.modes.minimal.desc,
    },
    {
      value: "full" as const,
      label: admin.onboarding.modes.full.label,
      desc: admin.onboarding.modes.full.desc,
    },
  ];

  const bookedSlots = stats.totalSlots - stats.availableSlots;
  const statsCards = [
    { label: admin.stats.recruiters, value: stats.totalRecruiters, icon: Users },
    { label: admin.stats.students, value: stats.totalApplicants, icon: GraduationCap },
    { label: admin.stats.slots, value: `${bookedSlots}/${stats.totalSlots}`, icon: Calendar },
    { label: "Booking Requests", value: stats.totalBookings, icon: Briefcase },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function handleModeChange(newMode: string) {
    if (locked) return;
    setSaving(true);
    setMode(newMode);
    const res = await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode }),
    });
    if (!res.ok) {
      // revert
      setMode(currentMode);
    }
    setSaving(false);
    router.refresh();
  }

  async function handleToggleLock() {
    if (!locked) {
      if (!confirm(admin.eventMode.lockConfirm))
        return;
    }
    setSaving(true);
    await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lock: !locked }),
    });
    setLocked(!locked);
    setSaving(false);
    router.refresh();
  }

  async function handleOnboardingModeChange(nextMode: OnboardingMode) {
    setSaving(true);
    setOnboardingMode(nextMode);
    const res = await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingMode: nextMode }),
    });
    if (!res.ok) {
      setOnboardingMode(initialOnboardingMode);
    }
    setSaving(false);
    router.refresh();
  }

  async function handleJobModerationToggle(nextEnabled: boolean) {
    const previous = jobModerationEnabled;
    setSaving(true);
    setJobModerationEnabled(nextEnabled);
    const res = await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobModerationEnabled: nextEnabled }),
    });
    if (!res.ok) {
      setJobModerationEnabled(previous);
    }
    setSaving(false);
    router.refresh();
  }

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    setAddingDomain(true);
    setDomainError("");

    try {
      const res = await fetch("/api/admin/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: newDomain.trim(),
          company: newCompany.trim(),
          industry: newIndustry,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || admin.domains.failedToAdd);

      setDomains([...domains, data.domain]);
      setNewDomain("");
      setNewCompany("");
    } catch (err) {
      setDomainError(err instanceof Error ? err.message : admin.domains.errorFallback);
    } finally {
      setAddingDomain(false);
    }
  }

  async function handleDeleteDomain(id: number) {
    if (!confirm(admin.domains.removeConfirm)) return;
    await fetch(`/api/admin/domains?id=${id}`, { method: "DELETE" });
    setDomains(domains.filter((d) => d.id !== id));
  }

  async function handleDeleteRecruiter(r: Recruiter) {
    if (
      !confirm(
        interpolate(admin.recruiters.removeConfirm, {
          company: r.company,
          email: r.email,
        })
      )
    )
      return;
    const res = await fetch(`/api/admin/recruiters?id=${r.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRecruiters(recruiters.filter((x) => x.id !== r.id));
      router.refresh();
    }
  }

  async function handleDeleteRecruiterApproval(approval: RecruiterApproval) {
    if (!confirm(`Remove recruiter approval for ${approval.email}?`)) return;
    const res = await fetch(`/api/admin/recruiter-approvals?id=${approval.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRecruiterApprovals((current) =>
        current.filter((item) => item.id !== approval.id)
      );
      router.refresh();
    }
  }

  async function handleCancelBooking(b: AdminBooking) {
    if (
      !confirm(
        interpolate(admin.bookings.cancelConfirm, {
          name: b.applicantName,
          company: b.company,
        })
      )
    )
      return;
    const res = await fetch(`/api/bookings/${b.id}`, { method: "DELETE" });
    if (res.ok) {
      setAdminBookings(adminBookings.map((x) => (x.id === b.id ? { ...x, status: "cancelled" } : x)));
      router.refresh();
    }
  }

  async function handleDeleteApplicant(a: Applicant) {
    if (
      !confirm(
        interpolate(admin.applicants.removeConfirm, {
          name: a.name,
          email: a.email,
        })
      )
    )
      return;
    const res = await fetch(`/api/admin/applicants?id=${a.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setApplicants(applicants.filter((x) => x.id !== a.id));
      router.refresh();
    }
  }

  async function handleJobModeration(
    jobId: number,
    action: "approve" | "reject" | "reset",
    moderationNotes: string
  ) {
    const res = await fetch(`/api/admin/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, moderationNotes }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setJobs((currentJobs) =>
      currentJobs.map((job) =>
        job.id === jobId ? { ...job, ...data.job } : job
      )
    );
    router.refresh();
  }

  return (
    <div className="flex min-h-full w-full min-w-0 max-w-full flex-1 flex-col">
      <AppTopBar
        href="/"
        navRole="admin"
        currentPath={
          section === "overview"
            ? "/admin"
            : section === "recruiters"
              ? "/admin/recruiters"
              : section === "applicants"
                ? "/admin/applicants"
                : "/admin/jobs"
        }
        desktopActions={
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            {messages.common.logout}
          </Button>
        }
      />

      <main className="w-full min-w-0 max-w-full flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8">
          {section === "overview" ? (
            <>
              {/* Stats + Quick Actions Row */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  {statsCards.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                      <stat.icon className="h-4 w-4 text-primary" />
                      <span className="text-lg font-bold">{stat.value}</span>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                  ))}
                  {emailStats && (
                    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className={cn(
                        "text-lg font-bold tabular-nums",
                        emailStats.today.percentUsed >= 90 ? "text-red-500" : emailStats.today.percentUsed >= 70 ? "text-yellow-600" : ""
                      )}>{emailStats.today.sent}/{emailStats.today.limit}</span>
                      <span className="text-xs text-muted-foreground">Emails</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings: 2-Column Layout */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Left Column: Platform Settings */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Platform Settings</h3>
                      {saving && <span className="text-[10px] text-muted-foreground">{messages.common.saving}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Booking Mode */}
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm">Booking Mode</label>
                      <select
                        value={mode}
                        onChange={(e) => handleModeChange(e.target.value)}
                        disabled={locked || saving}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {modes.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Lock */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {locked ? <Lock className="h-3.5 w-3.5 text-orange-500" /> : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                        <label className="text-sm">Lock Booking Mode</label>
                      </div>
                      <Switch checked={locked} onCheckedChange={handleToggleLock} disabled={saving} />
                    </div>
                    {/* Onboarding */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                        <label className="text-sm">Require Full Student Profile</label>
                      </div>
                      <Switch
                        checked={onboardingMode === "full"}
                        onCheckedChange={(checked) => handleOnboardingModeChange(checked ? "full" : "minimal")}
                        disabled={saving}
                      />
                    </div>
                    {/* Job Moderation */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        <label className="text-sm">Job Posting Requires Approval</label>
                      </div>
                      <Switch
                        checked={jobModerationEnabled}
                        onCheckedChange={handleJobModerationToggle}
                        disabled={saving}
                      />
                    </div>
                  </CardContent>
                </Card>

              </div>

              <div className="rounded-lg border bg-card">
                <button
                  type="button"
                  onClick={() => setTimeFrameOpen(!timeFrameOpen)}
                  className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {admin.timeFrame.title}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", timeFrameOpen && "rotate-180")} />
                </button>
                {timeFrameOpen && (
                  <div className="border-t px-4 py-4">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setTfSaving(true);
                        setTfSaved(false);
                        setTfError("");
                        const res = await fetch("/api/admin/timeframe", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(tf),
                        });
                        if (!res.ok) {
                          const d = await res.json().catch(() => ({}));
                          setTfError(d.error || admin.timeFrame.saveFailed);
                        } else {
                          setTfSaved(true);
                          setTimeout(() => setTfSaved(false), 3000);
                        }
                        setTfSaving(false);
                        router.refresh();
                      }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground">Start</label>
                          <input
                            type="time"
                            value={`${String(tf.startHour).padStart(2, "0")}:${String(tf.startMinute ?? 0).padStart(2, "0")}`}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(":").map(Number);
                              setTf({ ...tf, startHour: h, startMinute: m });
                            }}
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground">End</label>
                          <input
                            type="time"
                            value={`${String(tf.endHour).padStart(2, "0")}:${String(tf.endMinute).padStart(2, "0")}`}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(":").map(Number);
                              setTf({ ...tf, endHour: h, endMinute: m });
                            }}
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground">Slot</label>
                          <select
                            value={tf.slotDuration}
                            onChange={(e) => setTf({ ...tf, slotDuration: parseInt(e.target.value) })}
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value={10}>10 min</option>
                            <option value={15}>15 min</option>
                            <option value={20}>20 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground">Buffer</label>
                          <select
                            value={tf.bufferMinutes ?? 0}
                            onChange={(e) => setTf({ ...tf, bufferMinutes: parseInt(e.target.value) })}
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value={0}>None</option>
                            <option value={5}>5 min</option>
                            <option value={10}>10 min</option>
                            <option value={15}>15 min</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {interpolate(admin.timeFrame.eventRuns, {
                          start: `${String(tf.startHour).padStart(2, "0")}:${String(tf.startMinute ?? 0).padStart(2, "0")}`,
                          end: `${String(tf.endHour).padStart(2, "0")}:${String(tf.endMinute).padStart(2, "0")}`,
                          duration: tf.slotDuration,
                        })}
                      </p>
                      {stats.activeBookings > 0 && (
                        <div className="flex items-center gap-2 rounded border border-yellow-300/50 bg-yellow-50 px-2 py-1.5 text-[10px] dark:border-yellow-800/50 dark:bg-yellow-900/10">
                          <Lock className="h-3 w-3 shrink-0 text-yellow-700 dark:text-yellow-400" />
                          <span className="text-yellow-800 dark:text-yellow-300">
                            {interpolate(admin.timeFrame.activeBookingsLocked, { count: stats.activeBookings })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {stats.activeBookings > 0 ? (
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={tfSaving}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={async () => {
                              const confirmMsg = interpolate(
                                admin.timeFrame.forceOverrideConfirm ?? "This will cancel {count} active booking(s). Continue?",
                                { count: stats.activeBookings }
                              );
                              if (!confirm(confirmMsg)) return;
                              setTfSaving(true);
                              setTfSaved(false);
                              setTfError("");
                              const res = await fetch("/api/admin/timeframe", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...tf, forceOverride: true }),
                              });
                              if (!res.ok) {
                                const d = await res.json().catch(() => ({}));
                                setTfError(d.error || admin.timeFrame.saveFailed);
                              } else {
                                setTfSaved(true);
                                setTimeout(() => setTfSaved(false), 3000);
                              }
                              setTfSaving(false);
                              router.refresh();
                            }}
                          >
                            {tfSaving ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                {messages.common.saving}
                              </>
                            ) : (
                              admin.timeFrame.forceOverride ?? "Override & Cancel Bookings"
                            )}
                          </Button>
                        ) : (
                          <Button type="submit" disabled={tfSaving} size="sm" className="h-7 text-xs">
                            {tfSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : admin.timeFrame.saveAndRegenerate}
                          </Button>
                        )}
                      {tfSaved && <span className="text-[10px] text-green-600">{admin.timeFrame.saved}</span>}
                      {tfError && <span className="text-[10px] text-destructive">{tfError}</span>}
                    </div>
                  </form>
                </div>
                )}
              </div>

              {/* Collapsible Tools Section */}
              <div className="rounded-lg border bg-card">
                <button
                  type="button"
                  onClick={() => setToolsOpen(!toolsOpen)}
                  className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30"
                >
                  <span>Tools & Media</span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", toolsOpen && "rotate-180")} />
                </button>
                {toolsOpen && (
                <div className="border-t px-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <label className="text-xs font-medium text-muted-foreground">Tools</label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={async () => {
                            setSendingReminders(true);
                            setReminderResult(null);
                            try {
                              const res = await fetch("/api/admin/send-reminders", { method: "POST" });
                              const data = await res.json();
                              if (data.ok) {
                                setReminderResult({ studentsSent: data.studentsSent, recruitersSent: data.recruitersSent });
                              }
                            } finally {
                              setSendingReminders(false);
                            }
                          }}
                          disabled={sendingReminders}
                          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sendingReminders ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          {admin.qr.sendReminders ?? "Send Reminders"}
                        </button>
                        <a
                          href="/api/admin/export"
                          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {admin.qr.exportCsv}
                        </a>
                      </div>
                      {reminderResult && (
                        <div className="rounded-lg border border-[#30D158]/30 bg-[#30D158]/10 px-3 py-2 text-sm">
                          ✓ Sent to {reminderResult.studentsSent} students, {reminderResult.recruitersSent} recruiters
                        </div>
                      )}
                    </div>
                    <div>
                      <QRCard
                        value={typeof window !== "undefined" ? window.location.origin : ""}
                        title={admin.qr.title}
                        subtitle={admin.qr.subtitle}
                        size={120}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Homepage Images</label>
                      <MultiImageUpload
                        values={homepageImages}
                        onChange={async (urls) => {
                          setHomepageImages(urls);
                          setHpSaving(true);
                          try {
                            await fetch("/api/admin/homepage-images", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ homepageImages: urls }),
                            });
                            setHpSaved(true);
                            setTimeout(() => setHpSaved(false), 2000);
                          } finally {
                            setHpSaving(false);
                          }
                        }}
                        type="homepage"
                        max={4}
                      />
                      {hpSaving && <p className="text-[10px] text-muted-foreground">Saving...</p>}
                      {hpSaved && <p className="text-[10px] text-green-600">Saved!</p>}
                    </div>
                  </div>
                </div>
                )}
              </div>

              <PeopleSection
                recruiters={recruiters}
                applicants={applicants}
                bookings={adminBookings}
                onDeleteRecruiter={handleDeleteRecruiter}
                onDeleteApplicant={handleDeleteApplicant}
                onCancelBooking={handleCancelBooking}
                initialTab="bookings"
                showTabs={false}
              />
            </>
          ) : section === "recruiters" ? (
            <RecruitersSection
              recruiters={recruiters}
              approvals={recruiterApprovals}
              onDeleteRecruiter={handleDeleteRecruiter}
              onDeleteApproval={handleDeleteRecruiterApproval}
              onApprovalCreated={(approval) =>
                setRecruiterApprovals((current) => [...current, approval])
              }
            />
          ) : section === "applicants" ? (
            <PeopleSection
              recruiters={recruiters}
              applicants={applicants}
              bookings={adminBookings}
              onDeleteRecruiter={handleDeleteRecruiter}
              onDeleteApplicant={handleDeleteApplicant}
              onCancelBooking={handleCancelBooking}
              initialTab="applicants"
              showTabs={false}
            />
          ) : (
            <JobModerationSection jobs={jobs} onModerate={handleJobModeration} />
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ------------------------------------------------------------------
// Job Moderation Section
// ------------------------------------------------------------------

function JobModerationSection({
  jobs,
  onModerate,
}: {
  jobs: JobOpening[];
  onModerate: (
    jobId: number,
    action: "approve" | "reject" | "reset",
    moderationNotes: string
  ) => void;
}) {
  const { messages, locale } = useStudentI18n();
  const admin = messages.admin;
  const localeTag =
    locale === "vi" ? "vi-VN" : locale === "zh-TW" ? "zh-TW" : "en-US";
  const [query, setQuery] = useState("");
  const [notesById, setNotesById] = useState<Record<number, string>>(
    Object.fromEntries(jobs.map((job) => [job.id, job.moderationNotes ?? ""]))
  );

  const filteredJobs = jobs
    .filter((job) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        job.company.toLowerCase().includes(q) ||
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.responsibilities.toLowerCase().includes(q) ||
        job.requirements.toLowerCase().includes(q) ||
        job.seniority.toLowerCase().includes(q) ||
        job.languageRequirement.toLowerCase().includes(q) ||
        job.visaSupport.toLowerCase().includes(q) ||
        (job.applicationDeadline ?? "").toLowerCase().includes(q) ||
        job.moderationStatus.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const score = (job: JobOpening) => {
        if (job.moderationStatus === "pending_review") return 0;
        if (job.moderationStatus === "rejected") return 1;
        if (job.moderationStatus === "draft") return 2;
        return 3;
      };

      return score(a) - score(b);
    });

  const pendingJobs = filteredJobs.filter(
    (job) => job.moderationStatus === "pending_review"
  );
  const approvedJobs = filteredJobs.filter(
    (job) => job.moderationStatus === "approved"
  );
  const draftJobs = filteredJobs.filter(
    (job) => job.moderationStatus === "draft"
  );
  const rejectedJobs = filteredJobs.filter(
    (job) => job.moderationStatus === "rejected"
  );

  // Design system status border colors for job moderation
  const statusBorderColor: Record<string, string> = {
    draft: "border-border",
    pending_review: "border-orange-500/60 dark:border-orange-500/50",
    approved: "border-emerald-500/60 dark:border-emerald-500/50",
    rejected: "border-destructive/60 dark:border-destructive/50",
  };

  const statusLabels: Record<string, string> = {
    draft: admin.moderation.status.draft,
    pending_review: admin.moderation.status.pendingReview,
    approved: admin.moderation.status.approved,
    rejected: admin.moderation.status.rejected,
  };

  const statusCountStyles: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    pending_review:
      "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    rejected: "bg-destructive/15 text-destructive",
  };

  function renderStageSection(status: string, stageJobs: JobOpening[]) {
    if (stageJobs.length === 0) return null;

    return (
      <div>
        <h3
          className={cn(
            "mb-2 flex items-center gap-2 text-sm font-semibold",
            status === "draft" ? "text-muted-foreground" : ""
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
              statusCountStyles[status]
            )}
          >
            {stageJobs.length}
          </span>
          {statusLabels[status] ?? status.replace("_", " ")}
        </h3>
        <div className="space-y-2">{stageJobs.map(renderJobItem)}</div>
      </div>
    );
  }

  function renderJobItem(job: JobOpening) {
    const isPending = job.moderationStatus === "pending_review";
    const notes = notesById[job.id] ?? job.moderationNotes ?? "";

    return (
      <div
        key={job.id}
        className={cn(
          "flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30",
          statusBorderColor[job.moderationStatus] ?? ""
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
            {job.jdLink ? (
              <a
                href={job.jdLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                title={admin.moderation.viewJd}
              >
                <FileText className="h-4 w-4" />
                JD
              </a>
            ) : (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground"
                title={admin.moderation.noJd}
              >
                <FileText className="h-4 w-4 opacity-40" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="truncate text-sm font-semibold">{job.title}</p>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0">
                  {job.company}
                </Badge>
                <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {statusLabels[job.moderationStatus] ??
                    job.moderationStatus.replace("_", " ")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" /> {job.employmentType}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {interpolate(admin.moderation.createdOn, {
                    date: new Date(job.createdAt).toLocaleDateString(localeTag),
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            <Button
              size="sm"
              onClick={() => onModerate(job.id, "approve", notes)}
              className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              {admin.moderation.approve}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onModerate(job.id, "reject", notes)}
              className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              {admin.moderation.reject}
            </Button>
            {!isPending && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onModerate(job.id, "reset", notes)}
                className="h-8 text-muted-foreground"
              >
                {admin.moderation.resetToDraft}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 pt-2 border-t border-border/40 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {admin.moderation.adminNotes}
            </label>
            <textarea
              value={notes}
              onChange={(e) =>
                setNotesById((current) => ({
                  ...current,
                  [job.id]: e.target.value,
                }))
              }
              rows={2}
              placeholder={admin.moderation.notesPlaceholder}
              className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm transition-colors focus:bg-background"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Details
            </label>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground bg-muted/20 rounded-lg p-2.5">
              <div>
                <span className="font-medium text-foreground/70">Level:</span> {job.seniority}
              </div>
              <div>
                <span className="font-medium text-foreground/70">Salary:</span> {job.salaryMin ? `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency}` : "N/A"}
              </div>
              <div className="col-span-2">
                <span className="font-medium text-foreground/70">Requirements:</span> <span className="line-clamp-1 inline">{job.requirements}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-heading text-lg font-semibold">
          {admin.moderation.title}
        </h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {admin.moderation.description}
      </p>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={admin.moderation.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-6">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              {admin.moderation.empty}
            </CardContent>
          </Card>
        ) : (
          <>
            {renderStageSection("pending_review", pendingJobs)}
            {renderStageSection("approved", approvedJobs)}
            {renderStageSection("draft", draftJobs)}
            {renderStageSection("rejected", rejectedJobs)}
          </>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// People Section — Sortable lean list of recruiters + applicants
// ------------------------------------------------------------------

type RecruiterSortKey = "name" | "company" | "email" | "industry" | "createdAt";
type ApplicantSortKey = "name" | "email" | "major" | "createdAt";
type SortDir = "asc" | "desc";

function PeopleSection({
  recruiters,
  applicants,
  bookings,
  onDeleteRecruiter,
  onDeleteApplicant,
  onCancelBooking,
  initialTab,
  showTabs,
}: {
  recruiters: Recruiter[];
  applicants: Applicant[];
  bookings: AdminBooking[];
  onDeleteRecruiter: (r: Recruiter) => void;
  onDeleteApplicant: (a: Applicant) => void;
  onCancelBooking: (b: AdminBooking) => void;
  initialTab: "recruiters" | "applicants" | "bookings";
  showTabs: boolean;
}) {
  const { messages, locale } = useStudentI18n();
  const admin = messages.admin;
  const localeTag =
    locale === "vi" ? "vi-VN" : locale === "zh-TW" ? "zh-TW" : "en-US";
  const [tab, setTab] = useState<"recruiters" | "applicants" | "bookings">(
    initialTab
  );
  const [query, setQuery] = useState("");

  const [recSort, setRecSort] = useState<{
    key: RecruiterSortKey;
    dir: SortDir;
  }>({ key: "company", dir: "asc" });

  const [appSort, setAppSort] = useState<{
    key: ApplicantSortKey;
    dir: SortDir;
  }>({ key: "name", dir: "asc" });

  function toggleRecSort(key: RecruiterSortKey) {
    setRecSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  function toggleAppSort(key: ApplicantSortKey) {
    setAppSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  const filteredRecruiters = recruiters
    .filter((r) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.industry.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dir = recSort.dir === "asc" ? 1 : -1;
      const av = String(a[recSort.key] ?? "").toLowerCase();
      const bv = String(b[recSort.key] ?? "").toLowerCase();
      return av < bv ? -dir : av > bv ? dir : 0;
    });

  const filteredApplicants = applicants
    .filter((a) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.major.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dir = appSort.dir === "asc" ? 1 : -1;
      const av = String(a[appSort.key] ?? "").toLowerCase();
      const bv = String(b[appSort.key] ?? "").toLowerCase();
      return av < bv ? -dir : av > bv ? dir : 0;
    });

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-heading text-lg font-semibold">{admin.people.title}</h2>
      </div>

      {showTabs ? (
        <div className="mb-3 flex gap-0 border-b">
          <button
            onClick={() => setTab("recruiters")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === "recruiters"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {admin.people.tabs.recruiters}
            <Badge variant="secondary" className="ml-1 text-xs">
              {recruiters.length}
            </Badge>
          </button>
          <button
            onClick={() => setTab("applicants")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === "applicants"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {admin.people.tabs.students}
            <Badge variant="secondary" className="ml-1 text-xs">
              {applicants.length}
            </Badge>
          </button>
          <button
            onClick={() => setTab("bookings")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === "bookings"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {admin.people.tabs.bookings}
            <Badge variant="secondary" className="ml-1 text-xs">
              {
                bookings.filter(
                  (b) => b.status !== "cancelled" && b.status !== "rejected"
                ).length
              }
            </Badge>
          </button>
        </div>
      ) : null}

      {/* Search */}
      <div className="relative mb-3 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={
            tab === "recruiters"
              ? admin.people.searchRecruitersPlaceholder
              : tab === "applicants"
                ? admin.people.searchApplicantsPlaceholder
                : admin.people.searchBookingsPlaceholder
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {tab === "recruiters" ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <SortHeader
                  label={admin.people.columns.name}
                  active={recSort.key === "name"}
                  dir={recSort.dir}
                  onClick={() => toggleRecSort("name")}
                />
                <SortHeader
                  label={admin.people.columns.company}
                  active={recSort.key === "company"}
                  dir={recSort.dir}
                  onClick={() => toggleRecSort("company")}
                />
                <SortHeader
                  label={admin.people.columns.email}
                  active={recSort.key === "email"}
                  dir={recSort.dir}
                  onClick={() => toggleRecSort("email")}
                />
                <SortHeader
                  label={admin.people.columns.industry}
                  active={recSort.key === "industry"}
                  dir={recSort.dir}
                  onClick={() => toggleRecSort("industry")}
                  className="hidden sm:table-cell"
                />
                <SortHeader
                  label={admin.people.columns.joined}
                  active={recSort.key === "createdAt"}
                  dir={recSort.dir}
                  onClick={() => toggleRecSort("createdAt")}
                  className="hidden md:table-cell"
                />
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRecruiters.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {admin.people.noRecruiters}
                  </td>
                </tr>
              ) : (
                filteredRecruiters.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-3 py-2.5 font-medium">{r.name}</td>
                    <td className="px-3 py-2.5">{r.company}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <a
                        href={`mailto:${r.email}`}
                        className="hover:text-primary hover:underline"
                      >
                        {r.email}
                      </a>
                    </td>
                    <td className="hidden px-3 py-2.5 sm:table-cell">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {r.industry}
                      </Badge>
                    </td>
                    <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">
                      {new Date(r.createdAt).toLocaleDateString(localeTag, {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => onDeleteRecruiter(r)}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={interpolate(admin.people.removeRecruiterAria, {
                          company: r.company,
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : tab === "applicants" ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <SortHeader label={admin.people.columns.name} active={appSort.key === "name"} dir={appSort.dir} onClick={() => toggleAppSort("name")} />
                <SortHeader label={admin.people.columns.email} active={appSort.key === "email"} dir={appSort.dir} onClick={() => toggleAppSort("email")} />
                <SortHeader label={admin.people.columns.major} active={appSort.key === "major"} dir={appSort.dir} onClick={() => toggleAppSort("major")} className="hidden sm:table-cell" />
                <SortHeader label={admin.people.columns.joined} active={appSort.key === "createdAt"} dir={appSort.dir} onClick={() => toggleAppSort("createdAt")} className="hidden md:table-cell" />
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">{admin.people.noStudents}</td></tr>
              ) : (
                filteredApplicants.map((a) => (
                  <tr key={a.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-medium">
                      <Link
                        href={`/applicant/${a.id}`}
                        className="transition-colors hover:text-primary hover:underline"
                      >
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground"><a href={`mailto:${a.email}`} className="hover:text-primary hover:underline">{a.email}</a></td>
                    <td className="hidden px-3 py-2.5 text-muted-foreground sm:table-cell">{a.major || admin.people.emptyValue}</td>
                    <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">{new Date(a.createdAt).toLocaleDateString(localeTag, { month: "short", day: "numeric" })}</td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => onDeleteApplicant(a)}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={interpolate(admin.people.removeApplicantAria, {
                          name: a.name,
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <BookingsTable bookings={bookings} query={query} onCancel={onCancelBooking} />
      )}
    </div>
  );
}

function BookingsTable({
  bookings,
  query,
  onCancel,
}: {
  bookings: AdminBooking[];
  query: string;
  onCancel: (b: AdminBooking) => void;
}) {
  const { messages, locale } = useStudentI18n();
  const admin = messages.admin;
  const localeTag =
    locale === "vi" ? "vi-VN" : locale === "zh-TW" ? "zh-TW" : "en-US";
  // Design system status colors
  const statusColor: Record<string, string> = {
    pending: "bg-[#FF9500]/15 text-[#FF9500]", // WARNING orange
    accepted: "bg-[#30D158]/15 text-[#30D158]", // SUCCESS green
    waitlisted: "bg-[#8C52FF]/15 text-[#8C52FF]", // INFO purple
    rejected: "bg-[#D70015]/15 text-[#D70015]", // DESTRUCTIVE red
    cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  const statusLabel: Record<string, string> = {
    pending: admin.bookings.status.pending,
    accepted: admin.bookings.status.accepted,
    waitlisted: admin.bookings.status.waitlisted,
    rejected: admin.bookings.status.rejected,
    cancelled: admin.bookings.status.cancelled,
  };

  const filtered = bookings.filter((b) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      b.applicantName.toLowerCase().includes(q) ||
      b.applicantEmail.toLowerCase().includes(q) ||
      b.company.toLowerCase().includes(q) ||
      (b.position ?? "").toLowerCase().includes(q) ||
      b.status.includes(q)
    );
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/30 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">{admin.people.columns.student}</th>
            <th className="px-3 py-2 text-left font-medium">{admin.people.columns.company}</th>
            <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">{admin.people.columns.position}</th>
            <th className="hidden px-3 py-2 text-left font-medium md:table-cell">{admin.people.columns.time}</th>
            <th className="px-3 py-2 text-left font-medium">{admin.people.columns.status}</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                {admin.people.noBookings}
              </td>
            </tr>
          ) : (
            filtered.map((b) => {
              const isActive = b.status === "pending" || b.status === "accepted" || b.status === "waitlisted";
              return (
                <tr key={b.id} className="border-b last:border-b-0 hover:bg-muted/20">
                  <td className="px-3 py-2.5">
                    {b.applicantId ? (
                      <Link
                        href={`/applicant/${b.applicantId}`}
                        className="font-medium transition-colors hover:text-primary hover:underline"
                      >
                        {b.applicantName}
                      </Link>
                    ) : (
                      <p className="font-medium">{b.applicantName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{b.applicantEmail}</p>
                  </td>
                  <td className="px-3 py-2.5">{b.company}</td>
                  <td className="hidden px-3 py-2.5 text-muted-foreground sm:table-cell">
                    {b.position || admin.people.emptyValue}
                  </td>
                  <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">
                    {b.requestedTime
                      ? new Date(b.requestedTime).toLocaleString(localeTag, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "Asia/Taipei",
                      })
                      : admin.people.emptyValue}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        statusColor[b.status] ?? ""
                      )}
                    >
                      {statusLabel[b.status] ?? b.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {isActive && (
                      <button
                        onClick={() => onCancel(b)}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={admin.people.cancelBookingAria}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={cn("px-3 py-2 text-left font-medium", className)}>
      <button
        onClick={onClick}
        className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-foreground"
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

// ------------------------------------------------------------------
// Recruiters Section — Simple list of recruiters by email
// ------------------------------------------------------------------

function RecruitersSection({
  recruiters,
  approvals,
  onDeleteRecruiter,
  onDeleteApproval,
  onApprovalCreated,
}: {
  recruiters: Recruiter[];
  approvals: RecruiterApproval[];
  onDeleteRecruiter: (r: Recruiter) => void;
  onDeleteApproval: (approval: RecruiterApproval) => void;
  onApprovalCreated: (approval: RecruiterApproval) => void;
}) {
  const router = useRouter();
  const { messages, locale } = useStudentI18n();
  const admin = messages.admin;
  const localeTag = locale === "vi" ? "vi-VN" : locale === "zh-TW" ? "zh-TW" : "en-US";
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: "name" | "email" | "createdAt"; dir: SortDir }>({
    key: "name",
    dir: "asc",
  });

  // Add recruiter form
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newIndustry, setNewIndustry] = useState("Technology");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  async function handleAddRecruiter(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError("");

    try {
      const res = await fetch("/api/admin/recruiters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          company: newCompany.trim(),
          industry: newIndustry,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add recruiter");
      }

      const data = await res.json();
      onApprovalCreated(data.approval);
      setNewEmail("");
      setNewCompany("");
      setNewIndustry("Technology");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add recruiter");
    } finally {
      setAdding(false);
    }
  }

  function toggleSort(key: "name" | "email" | "createdAt") {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  const filteredRecruiters = recruiters
    .filter((r) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const av = String(a[sort.key] ?? "").toLowerCase();
      const bv = String(b[sort.key] ?? "").toLowerCase();
      return av < bv ? -dir : av > bv ? dir : 0;
    });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-heading text-lg font-semibold">
            {admin.people.tabs.recruiters}
          </h2>
          <Badge variant="secondary" className="ml-1">
            {recruiters.length}
          </Badge>
        </div>
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Approve Recruiter
        </Button>
      </div>

      {/* Add Recruiter Form */}
      {showForm && (
        <Card>
          <CardContent className="py-4">
            <form onSubmit={handleAddRecruiter} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="john@company.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Company</label>
                  <Input
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="Acme Inc"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Industry</label>
                  <select
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {INDUSTRY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {addError && (
                <p className="text-sm text-destructive">{addError}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={adding} size="sm">
                  {adding ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve recruiter email"
                  )}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Approved recruiter emails can complete their own signup. Active
        recruiters can access the dashboard with their registered email.
      </p>

      {approvals.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Approved email</th>
                <th className="px-3 py-2 text-left font-medium">Company</th>
                <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">
                  Industry
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval) => (
                <tr
                  key={approval.id}
                  className="border-b last:border-b-0 hover:bg-muted/20"
                >
                  <td className="px-3 py-2.5">
                    <a
                      href={`mailto:${approval.email}`}
                      className="text-muted-foreground hover:text-primary hover:underline"
                    >
                      {approval.email}
                    </a>
                  </td>
                  <td className="px-3 py-2.5">{approval.company}</td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {approval.industry}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onDeleteApproval(approval)}
                      className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove approval for ${approval.email}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={admin.people.searchRecruitersPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Recruiters Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <SortHeader
                label={admin.people.columns.name}
                active={sort.key === "name"}
                dir={sort.dir}
                onClick={() => toggleSort("name")}
              />
              <SortHeader
                label={admin.people.columns.email}
                active={sort.key === "email"}
                dir={sort.dir}
                onClick={() => toggleSort("email")}
              />
              <SortHeader
                label={admin.people.columns.joined}
                active={sort.key === "createdAt"}
                dir={sort.dir}
                onClick={() => toggleSort("createdAt")}
                className="hidden sm:table-cell"
              />
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRecruiters.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  {admin.people.noRecruiters}
                </td>
              </tr>
            ) : (
              filteredRecruiters.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/20">
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.company}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <a href={`mailto:${r.email}`} className="text-muted-foreground hover:text-primary hover:underline">
                      {r.email}
                    </a>
                  </td>
                  <td className="hidden px-3 py-2.5 text-xs text-muted-foreground sm:table-cell">
                    {new Date(r.createdAt).toLocaleDateString(localeTag, {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onDeleteRecruiter(r)}
                      className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={interpolate(admin.people.removeRecruiterAria, { company: r.company })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

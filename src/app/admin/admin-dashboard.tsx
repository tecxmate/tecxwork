"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Users,
  Calendar,
  BookOpen,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/site-footer";
import { QRCard } from "@/components/qr-code";
import { MultiImageUpload } from "@/components/image-upload";
import { AppTopBar } from "@/components/app-topbar";
import { RecruiterJobPostingCard } from "@/components/recruiter-job-posting-card";
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
  stats: Stats;
  currentMode: string;
  initialOnboardingMode: OnboardingMode;
  initialJobModerationEnabled: boolean;
  initialLocked: boolean;
  timeFrame: { startHour: number; endHour: number; endMinute: number; slotDuration: number };
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

  const statsCards = [
    { label: admin.stats.recruiters, value: stats.totalRecruiters, icon: Users },
    { label: admin.stats.students, value: stats.totalApplicants, icon: GraduationCap },
    { label: admin.stats.slots, value: stats.totalSlots, icon: Calendar },
    { label: admin.stats.available, value: stats.availableSlots, icon: Clock },
    { label: admin.stats.bookings, value: stats.totalBookings, icon: BookOpen },
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
    setJobs(jobs.map((job) => (job.id === jobId ? data.job : job)));
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar
        href="/admin"
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
          <>
            <Link
              href="/"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              {messages.common.viewSite}
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              {messages.common.logout}
            </Button>
          </>
        }
      />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {section === "overview" ? (
            <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {statsCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 py-3 sm:gap-4 sm:py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary sm:h-10 sm:w-10">
                    <stat.icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold sm:text-2xl">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tools: QR + Export */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <QRCard
              value={typeof window !== "undefined" ? window.location.origin : ""}
              title={admin.qr.title}
              subtitle={admin.qr.subtitle}
              size={140}
            />
            <div className="flex sm:self-end">
              <a
                href="/api/admin/export"
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <Download className="h-4 w-4" />
                {admin.qr.exportCsv}
              </a>
            </div>
          </div>

          <Separator />

          {/* Settings Section */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-heading text-lg font-semibold">
                  {admin.eventMode.title}
                </h2>
                {saving && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {messages.common.saving}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Mode */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium">Booking Mode</label>
                  <p className="text-xs text-muted-foreground">
                    {modes.find((m) => m.value === mode)?.desc}
                  </p>
                </div>
                <select
                  value={mode}
                  onChange={(e) => handleModeChange(e.target.value)}
                  disabled={locked || saving}
                  className="h-9 min-w-[180px] rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {modes.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <Separator />

              {/* Lock Mode */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium">
                    {locked ? admin.eventMode.locked : admin.eventMode.unlocked}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {admin.eventMode.modeLockedHint}
                  </p>
                </div>
                <Switch
                  checked={locked}
                  onCheckedChange={handleToggleLock}
                  disabled={saving}
                />
              </div>

              <Separator />

              {/* Onboarding Mode */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">{admin.onboarding.title}</label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {onboardingMode === "full"
                      ? admin.onboarding.modes.full.desc
                      : admin.onboarding.modes.minimal.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs", onboardingMode === "minimal" ? "text-foreground" : "text-muted-foreground")}>
                    {admin.onboarding.modes.minimal.label}
                  </span>
                  <Switch
                    checked={onboardingMode === "full"}
                    onCheckedChange={(checked) => handleOnboardingModeChange(checked ? "full" : "minimal")}
                    disabled={saving}
                  />
                  <span className={cn("text-xs", onboardingMode === "full" ? "text-foreground" : "text-muted-foreground")}>
                    {admin.onboarding.modes.full.label}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Job Moderation */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">{admin.jobPublishing.title}</label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {jobModerationEnabled
                      ? admin.jobPublishing.adminReviewRequiredDesc
                      : admin.jobPublishing.instantPublishDesc}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs", !jobModerationEnabled ? "text-foreground" : "text-muted-foreground")}>
                    {admin.jobPublishing.instantPublish}
                  </span>
                  <Switch
                    checked={jobModerationEnabled}
                    onCheckedChange={handleJobModerationToggle}
                    disabled={saving}
                  />
                  <span className={cn("text-xs", jobModerationEnabled ? "text-foreground" : "text-muted-foreground")}>
                    {admin.jobPublishing.adminReviewRequired}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Homepage Images */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Homepage Images</label>
                  <p className="text-xs text-muted-foreground">
                    Upload up to 4 images for the homepage carousel/gallery
                  </p>
                </div>
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
                {hpSaving && <p className="text-xs text-muted-foreground">Saving...</p>}
                {hpSaved && <p className="text-xs text-green-600">Saved!</p>}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Time Frame */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold">
                {admin.timeFrame.title}
              </h2>
            </div>
            <Card>
              <CardContent className="py-4">
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
                  className="space-y-4"
                >
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        {admin.timeFrame.startHour}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        value={tf.startHour}
                        onChange={(e) => setTf({ ...tf, startHour: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        {admin.timeFrame.endHour}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        value={tf.endHour}
                        onChange={(e) => setTf({ ...tf, endHour: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        {admin.timeFrame.endMinute}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={tf.endMinute}
                        onChange={(e) => setTf({ ...tf, endMinute: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        {admin.timeFrame.slotDuration}
                      </label>
                      <Input
                        type="number"
                        min={5}
                        max={120}
                        value={tf.slotDuration}
                        onChange={(e) => setTf({ ...tf, slotDuration: parseInt(e.target.value) || 15 })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {interpolate(admin.timeFrame.eventRuns, {
                      start: `${String(tf.startHour).padStart(2, "0")}:00`,
                      end: `${String(tf.endHour).padStart(2, "0")}:${String(tf.endMinute).padStart(2, "0")}`,
                      duration: tf.slotDuration,
                    })}
                  </p>

                  {stats.activeBookings > 0 && (
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-300/50 bg-yellow-50 p-3 text-xs dark:border-yellow-800/50 dark:bg-yellow-900/10">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-700 dark:text-yellow-400" />
                      <p className="text-yellow-800 dark:text-yellow-300">
                        <span className="font-semibold">{admin.eventMode.locked}</span>{" "}
                        {interpolate(admin.timeFrame.activeBookingsLocked, {
                          count: stats.activeBookings,
                        })}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={tfSaving || stats.activeBookings > 0} size="sm">
                      {tfSaving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{messages.common.saving}</> : admin.timeFrame.saveAndRegenerate}
                    </Button>
                    {tfSaved && (
                      <span className="text-xs text-green-600">{admin.timeFrame.saved}</span>
                    )}
                    {tfError && (
                      <span className="text-xs text-destructive">{tfError}</span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <Separator />

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
              onDeleteRecruiter={handleDeleteRecruiter}
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

  const statusStyles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    pending_review: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  const statusLabels: Record<string, string> = {
    draft: admin.moderation.status.draft,
    pending_review: admin.moderation.status.pendingReview,
    approved: admin.moderation.status.approved,
    rejected: admin.moderation.status.rejected,
  };

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

      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              {admin.moderation.empty}
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="space-y-4 py-4">
                <RecruiterJobPostingCard
                  job={job}
                  compact
                  locale={locale}
                  labels={{
                    seniority: admin.moderation.card.seniority,
                    languageRequirement: admin.moderation.card.languageRequirement,
                    visaSupport: admin.moderation.card.visaSupport,
                    applicationDeadline: admin.moderation.card.applicationDeadline,
                    description: admin.moderation.card.description,
                    responsibilities: admin.moderation.card.responsibilities,
                    requirements: admin.moderation.card.requirements,
                    benefits: admin.moderation.card.benefits,
                    viewJd: admin.moderation.viewJd,
                    noJd: admin.moderation.noJd,
                  }}
                  status={
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                        statusStyles[job.moderationStatus] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {statusLabels[job.moderationStatus] ??
                        job.moderationStatus.replace("_", " ")}
                    </span>
                  }
                />

                <p className="text-xs text-muted-foreground">
                  {interpolate(admin.moderation.createdOn, {
                    date: new Date(job.createdAt).toLocaleDateString(localeTag),
                  })}
                  {job.submittedAt
                    ? ` · ${interpolate(admin.moderation.submittedOn, {
                        date: new Date(job.submittedAt).toLocaleDateString(localeTag),
                      })}`
                    : ""}
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {admin.moderation.adminNotes}
                  </label>
                  <textarea
                    value={notesById[job.id] ?? job.moderationNotes ?? ""}
                    onChange={(e) =>
                      setNotesById((current) => ({
                        ...current,
                        [job.id]: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder={admin.moderation.notesPlaceholder}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      onModerate(job.id, "approve", notesById[job.id] ?? "")
                    }
                  >
                    {admin.moderation.approve}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onModerate(job.id, "reject", notesById[job.id] ?? "")
                    }
                  >
                    {admin.moderation.reject}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      onModerate(job.id, "reset", notesById[job.id] ?? "")
                    }
                  >
                    {admin.moderation.resetToDraft}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
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
                    <td className="px-3 py-2.5 font-medium">{a.name}</td>
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
  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    waitlisted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
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
                    <p className="font-medium">{b.applicantName}</p>
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
  onDeleteRecruiter,
}: {
  recruiters: Recruiter[];
  onDeleteRecruiter: (r: Recruiter) => void;
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
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          company: newCompany.trim(),
          password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add recruiter");
      }

      setNewName("");
      setNewEmail("");
      setNewCompany("");
      setNewPassword("");
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
          Add Recruiter
        </Button>
      </div>

      {/* Add Recruiter Form */}
      {showForm && (
        <Card>
          <CardContent className="py-4">
            <form onSubmit={handleAddRecruiter} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
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
                  <label className="text-xs font-medium text-muted-foreground">Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              {addError && (
                <p className="text-sm text-destructive">{addError}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={adding} size="sm">
                  {adding ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Adding...</> : "Add Recruiter"}
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
        Only these recruiters can access the system with their registered email.
      </p>

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

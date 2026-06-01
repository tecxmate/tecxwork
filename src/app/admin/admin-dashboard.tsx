"use client";

import { Fragment, useState, useEffect, useMemo, useCallback, useRef, type ComponentType } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Users,
  Calendar,
  BarChart3,
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
  Building2,
  Pencil,
  Star,
  X,
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
const OverviewCharts = dynamic(() => import("@/components/overview-charts"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-3 lg:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[230px] animate-pulse rounded-lg border bg-muted/40" />
      ))}
    </div>
  ),
});
import type { AdminAnalytics } from "@/app/admin/admin-data";
import { ImageUpload } from "@/components/image-upload";
import { AppTopBar } from "@/components/app-topbar";
import { useStudentI18n } from "@/components/student-locale-provider";
import { interpolate } from "@/lib/student-messages";
import {
  DEFAULT_SALARY_CURRENCY_CODES,
  getAllSalaryCurrencyOptions,
  jobCategoryLabel,
  normalizeSalaryCurrencyOptions,
} from "@/lib/job-posting";

type Recruiter = {
  id: number;
  name: string;
  company: string;
  industry: string;
  contactEmail: string;
  email: string;
  createdAt: Date | string;
  description?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  galleryUrls?: string[] | null;
  pinnedRank?: number | null;
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
  recruiterId: number;
  slotId: number | null;
  position: string | null;
  applicantName: string;
  applicantEmail: string;
  cvLink: string;
  status: string;
  requestedTime: Date | string | null;
  proposedTime: Date | string | null;
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
  "Beauty",
  "Education",
  "Retail",
  "Hospitality",
  "Media",
  "Real Estate",
  "Construction",
  "Logistics",
  "Food & Beverage",
  "Energy",
  "Automotive",
  "Gaming",
  "Nonprofit",
] as const;

type OnboardingMode = (typeof ONBOARDING_MODE_VALUES)[number];
type AdminSection =
  | "settings"
  | "recruiters"
  | "applicants"
  | "jobs"
  | "interviews";

type FeedbackReportRow = {
  id: number;
  userEmail: string | null;
  userRole: string | null;
  kind: string;
  severity: string;
  status: string;
  subject: string;
  body: string;
  pathname: string | null;
  userAgent: string | null;
  viewport: string | null;
  appVersion: string | null;
  clientLogs: unknown;
  screenshotUrl: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

type SettingsPanelId =
  | "overview"
  | "general"
  | "branding"
  | "feedback"
  | "timeframe"
  | "tools";

const SETTINGS_PANELS: {
  id: SettingsPanelId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "general", label: "General", icon: Settings },
  { id: "branding", label: "Event Branding", icon: Calendar },
  { id: "feedback", label: "Feedback & bugs", icon: Mail },
  { id: "timeframe", label: "Interview Time Frame", icon: Clock },
  { id: "tools", label: "Tools & Media", icon: BookOpen },
];

function StatBar({
  label,
  value,
  max,
  caption,
  tone = "primary",
}: {
  label: string;
  value: number;
  max: number;
  caption?: string;
  tone?: "primary" | "green" | "amber" | "red";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const barColor =
    tone === "red"
      ? "bg-red-500"
      : tone === "amber"
        ? "bg-yellow-500"
        : tone === "green"
          ? "bg-[#30D158]"
          : "bg-primary";
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {caption ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}

// Round-trip a UTC ISO string through a <input type="datetime-local"> in
// Asia/Taipei. The input is timezone-naive, so we explicitly format and
// parse against UTC+8 instead of the browser's local zone.
function isoToTaipeiLocal(iso: string | null): string {
  if (!iso) return "";
  // sv-SE gives "YYYY-MM-DD HH:mm:ss" — drop seconds, swap space for "T".
  const parts = new Date(iso).toLocaleString("sv-SE", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return parts.replace(" ", "T");
}

function taipeiLocalToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(`${local}:00+08:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function valueToIso(value: Date | string | null): string | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function isActiveBookingStatus(status: string): boolean {
  return (
    status === "pending" ||
    status === "accepted" ||
    status === "waitlisted" ||
    status === "reschedule_proposed"
  );
}

type AdminBookingTimeAction = "propose" | "confirm" | "request";

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
  initialStudentCancellationEnabled,
  initialJobsPageHeroEnabled,
  initialSalaryCurrencyOptions,
  initialLocked,
  timeFrame: initialTimeFrame,
  initialHomepageImages,
  initialBrowsePageImages,
  initialJobsPageImages,
  initialBranding,
  analytics,
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
  initialStudentCancellationEnabled: boolean;
  initialJobsPageHeroEnabled: boolean;
  initialSalaryCurrencyOptions: string[];
  initialLocked: boolean;
  timeFrame: { startHour: number; startMinute: number; endHour: number; endMinute: number; slotDuration: number; bufferMinutes: number };
  initialHomepageImages: string[];
  initialBrowsePageImages: string[];
  initialJobsPageImages: string[];
  initialBranding: {
    eventName: string;
    emailEventName: string;
    tagline: string;
    organizer: string;
    organizerShort: string;
    hostedAt: string;
    hostedAtFull: string;
    displayDate: string;
    displayYear: string;
    location: string;
    eventDate: string | null;
    eventEndDate: string | null;
    heroOverlayEnabled: boolean;
  };
  analytics: AdminAnalytics;
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
  const [studentCancellationEnabled, setStudentCancellationEnabled] = useState(
    initialStudentCancellationEnabled
  );
  const [jobsPageHeroEnabled, setJobsPageHeroEnabled] = useState(
    initialJobsPageHeroEnabled
  );
  const [salaryCurrencyOptions, setSalaryCurrencyOptions] = useState(() =>
    normalizeSalaryCurrencyOptions(initialSalaryCurrencyOptions)
  );
  const [currencyToAdd, setCurrencyToAdd] = useState("");
  const [currencySaving, setCurrencySaving] = useState(false);
  const [currencySaved, setCurrencySaved] = useState(false);
  const [currencyError, setCurrencyError] = useState("");
  const [locked, setLocked] = useState(initialLocked);
  const [saving, setSaving] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<SaveStatus>("idle");
  const [settingsMessage, setSettingsMessage] = useState("");
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
  const [browsePageImages, setBrowsePageImages] = useState<string[]>(
    initialBrowsePageImages ?? []
  );
  const [jobsPageImages, setJobsPageImages] = useState<string[]>(
    initialJobsPageImages ?? []
  );
  const [hpSaving, setHpSaving] = useState(false);
  const [hpSaved, setHpSaved] = useState(false);
  const [activePanel, setActivePanel] = useState<SettingsPanelId>("overview");
  const [branding, setBrandingState] = useState(initialBranding);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [brandingError, setBrandingError] = useState("");
  const [brandingDirty, setBrandingDirty] = useState(false);
  const brandingRef = useRef(branding);
  brandingRef.current = branding;
  const brandingInFlight = useRef(false);
  const brandingVersion = useRef(0);
  // Editing any branding field marks the section dirty (orange in the
  // top-bar status); a debounced effect below autosaves shortly after.
  const setBranding = useCallback((next: typeof initialBranding) => {
    setBrandingState(next);
    setBrandingDirty(true);
    brandingVersion.current += 1;
  }, []);
  const saveBranding = useCallback(async () => {
    if (brandingInFlight.current) return;
    brandingInFlight.current = true;
    const savedVersion = brandingVersion.current;
    const b = brandingRef.current;
    setBrandingSaving(true);
    setBrandingSaved(false);
    setBrandingError("");
    const payload: Record<string, string | boolean | null> = {
      eventName: b.eventName,
      emailEventName: b.emailEventName,
      tagline: b.tagline,
      organizer: b.organizer,
      organizerShort: b.organizerShort,
      hostedAt: b.hostedAt,
      hostedAtFull: b.hostedAtFull,
      displayDate: b.displayDate,
      displayYear: b.displayYear,
      location: b.location,
      heroOverlayEnabled: b.heroOverlayEnabled,
    };
    if (b.eventDate) payload.eventDate = b.eventDate;
    if (b.eventEndDate) payload.eventEndDate = b.eventEndDate;
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setBrandingError(d.error || "Failed to save");
        return;
      }
      // Only clear dirty if no further edits landed while this save ran;
      // otherwise leave it set so the debounce picks up the newer values.
      if (brandingVersion.current === savedVersion) {
        setBrandingDirty(false);
      }
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 3000);
      router.refresh();
    } catch {
      setBrandingError("Failed to save");
    } finally {
      setBrandingSaving(false);
      brandingInFlight.current = false;
    }
  }, [router]);
  // Debounce: save ~1s after the last branding edit. Effect body only
  // schedules a timer (no synchronous setState) to stay lint-clean.
  useEffect(() => {
    if (!brandingDirty) return;
    const timer = window.setTimeout(() => {
      void saveBranding();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [brandingDirty, branding, saveBranding]);
  const [feedbackReports, setFeedbackReports] = useState<FeedbackReportRow[]>([]);
  const [feedbackLoaded, setFeedbackLoaded] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
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
  const allSalaryCurrencyOptions = getAllSalaryCurrencyOptions();
  const addableSalaryCurrencyOptions = allSalaryCurrencyOptions.filter(
    (option) => !salaryCurrencyOptions.includes(option.value)
  );
  const hasSettingsError =
    settingsStatus === "error" ||
    Boolean(currencyError) ||
    Boolean(brandingError) ||
    Boolean(tfError);
  const isSettingsSaving =
    settingsStatus === "saving" ||
    currencySaving ||
    brandingSaving ||
    tfSaving ||
    hpSaving;
  const hasRecentSave =
    settingsStatus === "saved" ||
    currencySaved ||
    brandingSaved ||
    tfSaved ||
    hpSaved;
  const hasUnsavedChanges = brandingDirty;
  const settingsStatusLabel = hasSettingsError
    ? "Some changes failed"
    : isSettingsSaving
      ? "Saving changes..."
      : hasUnsavedChanges
        ? "Unsaved changes"
        : hasRecentSave
          ? "Changes saved"
          : "All changes saved";
  const settingsStatusClassName = hasSettingsError
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : isSettingsSaving
      ? "border-primary/30 bg-primary/10 text-primary"
      : hasUnsavedChanges
        ? "border-[#FF9F0A]/30 bg-[#FF9F0A]/10 text-[#b26a00]"
        : "border-[#30D158]/30 bg-[#30D158]/10 text-[#1f8f3a]";
  const settingsStatusDetail = hasSettingsError
    ? settingsMessage || currencyError || brandingError || tfError || "Review the section with an error."
    : settingsStatus === "saved"
      ? settingsMessage
      : "";

  async function saveDecorativePageImages(
    placement: "browse" | "jobs",
    images: string[]
  ) {
    setHpSaving(true);
    try {
      const res = await fetch("/api/admin/page-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placement, images }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save page images");
      }
      setHpSaved(true);
      setTimeout(() => setHpSaved(false), 2000);
    } finally {
      setHpSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function handleModeChange(newMode: string) {
    if (locked) return;
    const previous = mode;
    setSaving(true);
    setSettingsStatus("saving");
    setSettingsMessage("Saving booking mode...");
    setMode(newMode);
    const res = await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMode(previous);
      setSettingsStatus("error");
      setSettingsMessage(data.error || "Booking mode could not be saved.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSettingsStatus("saved");
    setSettingsMessage("Booking mode saved.");
    setTimeout(() => setSettingsStatus("idle"), 2500);
    router.refresh();
  }

  async function handleToggleLock() {
    if (!locked) {
      if (!confirm(admin.eventMode.lockConfirm))
        return;
    }
    const previous = locked;
    const nextLocked = !locked;
    setSaving(true);
    setSettingsStatus("saving");
    setSettingsMessage("Saving booking lock...");
    setLocked(nextLocked);
    const res = await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lock: nextLocked }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLocked(previous);
      setSettingsStatus("error");
      setSettingsMessage(data.error || "Booking lock could not be saved.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSettingsStatus("saved");
    setSettingsMessage(nextLocked ? "Booking mode locked." : "Booking mode unlocked.");
    setTimeout(() => setSettingsStatus("idle"), 2500);
    router.refresh();
  }

  async function handleOnboardingModeChange(nextMode: OnboardingMode) {
    const previous = onboardingMode;
    setSaving(true);
    setSettingsStatus("saving");
    setSettingsMessage("Saving student profile requirement...");
    setOnboardingMode(nextMode);
    const res = await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingMode: nextMode }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setOnboardingMode(previous);
      setSettingsStatus("error");
      setSettingsMessage(data.error || "Student profile requirement could not be saved.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSettingsStatus("saved");
    setSettingsMessage("Student profile requirement saved.");
    setTimeout(() => setSettingsStatus("idle"), 2500);
    router.refresh();
  }

  async function handleJobModerationToggle(nextEnabled: boolean) {
    const previous = jobModerationEnabled;
    setSaving(true);
    setSettingsStatus("saving");
    setSettingsMessage("Saving job approval setting...");
    setJobModerationEnabled(nextEnabled);
    const res = await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobModerationEnabled: nextEnabled }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setJobModerationEnabled(previous);
      setSettingsStatus("error");
      setSettingsMessage(data.error || "Job approval setting could not be saved.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSettingsStatus("saved");
    setSettingsMessage("Job approval setting saved.");
    setTimeout(() => setSettingsStatus("idle"), 2500);
    router.refresh();
  }

  async function handleStudentCancellationToggle(nextEnabled: boolean) {
    const previous = studentCancellationEnabled;
    setSaving(true);
    setSettingsStatus("saving");
    setSettingsMessage("Saving student cancellation setting...");
    setStudentCancellationEnabled(nextEnabled);
    const res = await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentCancellationEnabled: nextEnabled }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStudentCancellationEnabled(previous);
      setSettingsStatus("error");
      setSettingsMessage(
        data.error || "Student cancellation setting could not be saved."
      );
      setSaving(false);
      return;
    }
    setSaving(false);
    setSettingsStatus("saved");
    setSettingsMessage("Student cancellation setting saved.");
    setTimeout(() => setSettingsStatus("idle"), 2500);
    router.refresh();
  }

  async function handleJobsPageHeroToggle(nextEnabled: boolean) {
    const previous = jobsPageHeroEnabled;
    setSaving(true);
    setSettingsStatus("saving");
    setSettingsMessage("Saving jobs page banner setting...");
    setJobsPageHeroEnabled(nextEnabled);
    const res = await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobsPageHeroEnabled: nextEnabled }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setJobsPageHeroEnabled(previous);
      setSettingsStatus("error");
      setSettingsMessage(
        data.error || "Jobs page banner setting could not be saved."
      );
      setSaving(false);
      return;
    }
    setSaving(false);
    setSettingsStatus("saved");
    setSettingsMessage("Jobs page banner setting saved.");
    setTimeout(() => setSettingsStatus("idle"), 2500);
    router.refresh();
  }

  async function saveSalaryCurrencyOptions(nextOptions: string[]) {
    const normalized = normalizeSalaryCurrencyOptions(nextOptions);
    const previous = salaryCurrencyOptions;

    setCurrencySaving(true);
    setCurrencySaved(false);
    setCurrencyError("");
    setSalaryCurrencyOptions(normalized);

    const res = await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salaryCurrencyOptions: normalized }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSalaryCurrencyOptions(previous);
      setCurrencyError(data.error || "Failed to save currency options");
    } else {
      setCurrencySaved(true);
      setTimeout(() => setCurrencySaved(false), 2500);
      router.refresh();
    }

    setCurrencySaving(false);
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

  function handleRecruiterUpdated(updated: Recruiter) {
    setRecruiters((current) =>
      current.map((x) => (x.id === updated.id ? { ...x, ...updated } : x))
    );
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

  async function handleCancelBooking(b: AdminBooking, note?: string) {
    if (
      !confirm(
        interpolate(admin.bookings.cancelConfirm, {
          name: b.applicantName,
          company: b.company,
        })
      )
    )
      return;
    const body = note?.trim() ? JSON.stringify({ note: note.trim() }) : undefined;
    const res = await fetch(`/api/bookings/${b.id}`, {
      method: "DELETE",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body,
    });
    if (res.ok) {
      setAdminBookings((current) =>
        current.map((x) => (x.id === b.id ? { ...x, status: "cancelled" } : x))
      );
      router.refresh();
    }
  }

  async function handleBulkCancelBookings(ids: number[], note?: string) {
    const cancelled = new Set<number>();
    const body = note?.trim() ? JSON.stringify({ note: note.trim() }) : undefined;
    for (const id of ids) {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body,
      });
      if (res.ok) cancelled.add(id);
    }
    setAdminBookings((current) =>
      current.map((x) =>
        cancelled.has(x.id) ? { ...x, status: "cancelled" } : x
      )
    );
    router.refresh();
    return cancelled.size;
  }

  async function handleBookingTimeOverride(
    b: AdminBooking,
    time: string,
    action: AdminBookingTimeAction,
    note?: string
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const res = await fetch(`/api/admin/bookings/${b.id}/time`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        time,
        action,
        note: note?.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: data.message || data.error || "Booking time could not be updated.",
      };
    }

    if (data.booking) {
      setAdminBookings((current) =>
        current.map((x) => (x.id === b.id ? { ...x, ...data.booking } : x))
      );
    }
    router.refresh();
    return { ok: true };
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
          section === "settings"
            ? "/admin/settings"
            : section === "recruiters"
              ? "/admin/recruiters"
              : section === "applicants"
                ? "/admin/applicants"
                : section === "interviews"
                  ? "/admin/interviews"
                  : "/admin/jobs"
        }
        desktopActions={
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            {messages.common.logout}
          </Button>
        }
        rightStatus={
          section === "settings" ? (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
                settingsStatusClassName
              )}
              role="status"
              aria-live="polite"
              title={settingsStatusDetail || settingsStatusLabel}
            >
              {isSettingsSaving ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : hasSettingsError || hasUnsavedChanges ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-current" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{settingsStatusLabel}</span>
            </div>
          ) : undefined
        }
      />

      <main className="w-full min-w-0 max-w-full flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full min-w-0 max-w-6xl space-y-8">
          {section === "settings" ? (
            <>
              <div className="lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:items-start lg:gap-6">
                {/* Left: settings section nav */}
                <nav className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-30 -mx-4 mb-4 flex gap-1 overflow-x-auto border-b bg-background/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:top-20 lg:z-auto lg:mx-0 lg:mb-0 lg:flex-col lg:overflow-visible lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
                  {SETTINGS_PANELS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActivePanel(p.id);
                        if (p.id === "feedback" && !feedbackLoaded) {
                          void (async () => {
                            try {
                              const res = await fetch("/api/admin/feedback");
                              if (!res.ok) throw new Error("Failed to load");
                              const data = await res.json();
                              setFeedbackReports(data.reports ?? []);
                              setFeedbackLoaded(true);
                            } catch (err) {
                              setFeedbackError(
                                err instanceof Error ? err.message : "Failed"
                              );
                            }
                          })();
                        }
                      }}
                      className={cn(
                        "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                        activePanel === p.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <p.icon className="h-4 w-4 shrink-0" />
                      <span className="whitespace-nowrap">{p.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Right: active panel content */}
                <div className="min-w-0 space-y-4">
                  {activePanel === "overview" && (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <StatBar
                          label="Slot utilization"
                          value={bookedSlots}
                          max={stats.totalSlots}
                          caption={`${bookedSlots} booked · ${stats.availableSlots} open`}
                        />
                        {emailStats && (
                          <StatBar
                            label="Email quota (today)"
                            value={emailStats.today.sent}
                            max={emailStats.today.limit}
                            tone={
                              emailStats.today.percentUsed >= 90
                                ? "red"
                                : emailStats.today.percentUsed >= 70
                                  ? "amber"
                                  : "green"
                            }
                            caption={`${Math.max(
                              0,
                              emailStats.today.limit - emailStats.today.sent
                            )} remaining today`}
                          />
                        )}
                        <StatBar
                          label="Active interviews"
                          value={stats.activeBookings}
                          max={stats.totalBookings}
                          caption={`${stats.activeBookings} active of ${stats.totalBookings} requests`}
                        />
                        <div className="rounded-lg border bg-card p-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Participant mix
                            </span>
                            <span className="text-sm font-semibold tabular-nums">
                              {stats.totalRecruiters > 0
                                ? (
                                    stats.totalApplicants /
                                    stats.totalRecruiters
                                  ).toFixed(1)
                                : "—"}
                              :1
                            </span>
                          </div>
                          <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${
                                  stats.totalRecruiters + stats.totalApplicants >
                                  0
                                    ? (stats.totalRecruiters /
                                        (stats.totalRecruiters +
                                          stats.totalApplicants)) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />
                            <div className="h-full flex-1 bg-primary/30" />
                          </div>
                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            {stats.totalRecruiters} recruiters ·{" "}
                            {stats.totalApplicants} students
                          </p>
                        </div>
                      </div>

                      <OverviewCharts analytics={analytics} />
                    </div>
                  )}

                  {activePanel === "general" && (
              <div className="grid gap-4">
                {/* Left Column: Platform Settings */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Platform Settings</h3>
                      {settingsStatus === "saving" ? (
                        <span className="text-[10px] text-muted-foreground">{messages.common.saving}</span>
                      ) : settingsStatus === "saved" ? (
                        <span className="text-[10px] text-green-600">Saved</span>
                      ) : settingsStatus === "error" ? (
                        <span className="text-[10px] text-destructive">{settingsMessage}</span>
                      ) : null}
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
                    {/* Student cancellation */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                          <label className="text-sm">Allow Student Cancellation</label>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          When enabled, students can cancel active applications/interviews from Profile.
                        </p>
                      </div>
                      <Switch
                        checked={studentCancellationEnabled}
                        onCheckedChange={handleStudentCancellationToggle}
                        disabled={saving}
                      />
                    </div>
                    {/* Salary currencies */}
                    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Recruiter salary currencies</p>
                          <p className="text-[11px] text-muted-foreground">
                            Controls which currency choices appear in recruiter job forms.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          disabled={currencySaving}
                          onClick={() =>
                            void saveSalaryCurrencyOptions([
                              ...DEFAULT_SALARY_CURRENCY_CODES,
                            ])
                          }
                        >
                          Reset
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {salaryCurrencyOptions.map((code) => (
                          <span
                            key={code}
                            className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs font-medium"
                          >
                            {code}
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                              disabled={currencySaving || salaryCurrencyOptions.length <= 1}
                              onClick={() =>
                                void saveSalaryCurrencyOptions(
                                  salaryCurrencyOptions.filter((item) => item !== code)
                                )
                              }
                              aria-label={`Remove ${code}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={currencyToAdd}
                          onChange={(e) => setCurrencyToAdd(e.target.value)}
                          disabled={currencySaving || addableSalaryCurrencyOptions.length === 0}
                          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Add currency...</option>
                          {addableSalaryCurrencyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          size="xs"
                          disabled={currencySaving || !currencyToAdd}
                          onClick={() => {
                            const nextCurrency = currencyToAdd;
                            setCurrencyToAdd("");
                            void saveSalaryCurrencyOptions([
                              ...salaryCurrencyOptions,
                              nextCurrency,
                            ]);
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      </div>
                      <div className="min-h-4">
                        {currencySaving ? (
                          <span className="text-[10px] text-muted-foreground">Saving...</span>
                        ) : currencySaved ? (
                          <span className="text-[10px] text-green-600">Saved</span>
                        ) : currencyError ? (
                          <span className="text-[10px] text-destructive">{currencyError}</span>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
                  )}

                  {activePanel === "branding" && (
              <div className="rounded-lg border bg-card">
                {(
                  <div className="px-4 py-4">
                    <div
                      onBlur={() => {
                        // Flush an immediate save when leaving a field with
                        // pending edits (protects against navigating away
                        // before the 1s debounce fires).
                        if (brandingDirty) void saveBranding();
                      }}
                      className="space-y-3"
                    >
                      <p className="text-xs text-muted-foreground">
                        These fields control the event name and surrounding branding shown in metadata, emails, and the homepage. Changes autosave — no redeploy required.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="font-medium">Official event name</span>
                          <Input
                            value={branding.eventName}
                            onChange={(e) => setBranding({ ...branding, eventName: e.target.value })}
                            placeholder="VSATW JOB FAIR 2026: V-GEN TRIDENT"
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="font-medium">Email event name</span>
                          <Input
                            value={branding.emailEventName}
                            onChange={(e) => setBranding({ ...branding, emailEventName: e.target.value })}
                            placeholder="VSATW JOB FAIR 2026: V-GEN TRIDENT"
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs sm:col-span-2">
                          <span className="font-medium">Tagline</span>
                          <Input
                            value={branding.tagline}
                            onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="font-medium">Organizer</span>
                          <Input
                            value={branding.organizer}
                            onChange={(e) => setBranding({ ...branding, organizer: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="font-medium">Organizer (short)</span>
                          <Input
                            value={branding.organizerShort}
                            onChange={(e) => setBranding({ ...branding, organizerShort: e.target.value })}
                            placeholder="VSATW"
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="font-medium">Host (short)</span>
                          <Input
                            value={branding.hostedAt}
                            onChange={(e) => setBranding({ ...branding, hostedAt: e.target.value })}
                            placeholder="MCUT (Ming Chi University of Technology)"
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="font-medium">Host (full)</span>
                          <Input
                            value={branding.hostedAtFull}
                            onChange={(e) => setBranding({ ...branding, hostedAtFull: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="font-medium">Display date</span>
                          <Input
                            value={branding.displayDate}
                            onChange={(e) => setBranding({ ...branding, displayDate: e.target.value })}
                            placeholder="June 6, 2026"
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="font-medium">Display year</span>
                          <Input
                            value={branding.displayYear}
                            onChange={(e) => setBranding({ ...branding, displayYear: e.target.value })}
                            placeholder="2026"
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs sm:col-span-2">
                          <span className="font-medium">Location</span>
                          <Input
                            value={branding.location}
                            onChange={(e) => setBranding({ ...branding, location: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="font-medium">Event start (Taipei time)</span>
                          <Input
                            type="datetime-local"
                            value={isoToTaipeiLocal(branding.eventDate)}
                            onChange={(e) => setBranding({ ...branding, eventDate: taipeiLocalToIso(e.target.value) })}
                            className="h-8 text-xs"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs">
                          <span className="font-medium">Event end (Taipei time)</span>
                          <Input
                            type="datetime-local"
                            value={isoToTaipeiLocal(branding.eventEndDate)}
                            onChange={(e) => setBranding({ ...branding, eventEndDate: taipeiLocalToIso(e.target.value) })}
                            className="h-8 text-xs"
                          />
                        </label>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
                        <div className="text-xs">
                          <p className="font-medium">Hero overlay (title, countdown, CTAs)</p>
                          <p className="text-muted-foreground">
                            Turn off to show only the homepage photos in the hero carousel.
                          </p>
                        </div>
                        <Switch
                          checked={branding.heroOverlayEnabled}
                          onCheckedChange={(v) => setBranding({ ...branding, heroOverlayEnabled: v })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
                  )}

                  {activePanel === "feedback" && (
              <div className="rounded-lg border bg-card">
                {(
                  <div className="px-4 py-4">
                    {feedbackError && (
                      <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {feedbackError}
                      </p>
                    )}
                    {!feedbackLoaded ? (
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    ) : feedbackReports.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No reports yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {feedbackReports.map((r) => (
                          <FeedbackRow
                            key={r.id}
                            report={r}
                            onStatusChange={async (status) => {
                              const res = await fetch(`/api/admin/feedback/${r.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status }),
                              });
                              if (!res.ok) return;
                              setFeedbackReports((prev) =>
                                prev.map((x) => (x.id === r.id ? { ...x, status } : x))
                              );
                            }}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
                  )}

                  {activePanel === "timeframe" && (
              <div className="rounded-lg border bg-card">
                {(
                  <div className="px-4 py-4">
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
                  )}

                  {activePanel === "tools" && (
              <div className="rounded-lg border bg-card">
                {(
                <div className="px-4 py-4">
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
                      <label className="text-xs font-medium text-muted-foreground">Homepage Hero Images</label>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        One photo per language. Visitors see the slot matching their site language.
                        Vertical / portrait (3:4). Recommended 1200×1600px. JPG, PNG, or WebP. Max 4MB.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {([
                          { locale: "en" as const, label: "English (EN)" },
                          { locale: "vi" as const, label: "Tiếng Việt (VI)" },
                          { locale: "zh-TW" as const, label: "繁體中文 (中文)" },
                        ]).map(({ locale, label }, slotIndex) => (
                          <div key={locale} className="space-y-1.5">
                            <p className="text-[11px] font-medium text-foreground">{label}</p>
                            <ImageUpload
                              type="homepage"
                              hint=""
                              value={homepageImages[slotIndex] || undefined}
                              onChange={async (url) => {
                                const next = [
                                  homepageImages[0] ?? "",
                                  homepageImages[1] ?? "",
                                  homepageImages[2] ?? "",
                                ];
                                next[slotIndex] = url ?? "";
                                setHomepageImages(next);
                                setHpSaving(true);
                                try {
                                  await fetch("/api/admin/homepage-images", {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ homepageImages: next }),
                                  });
                                  setHpSaved(true);
                                  setTimeout(() => setHpSaved(false), 2000);
                                } finally {
                                  setHpSaving(false);
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      {hpSaving && <p className="text-[10px] text-muted-foreground">Saving...</p>}
                      {hpSaved && <p className="text-[10px] text-green-600">Saved!</p>}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Browse & Jobs Decorative Images</label>
                        <p className="text-[11px] leading-snug text-muted-foreground">
                          Optional wide images shown above the student company and job lists. Use one image, or two for a small swipeable carousel.
                        </p>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2 rounded-lg border border-border/60 p-3">
                          <div>
                            <p className="text-xs font-medium text-foreground">Companies page</p>
                            <p className="text-[11px] text-muted-foreground">Shown above `/browse`.</p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {[0, 1].map((slotIndex) => (
                              <ImageUpload
                                key={`browse-${slotIndex}`}
                                type="page"
                                hint=""
                                value={browsePageImages[slotIndex] || undefined}
                                onChange={async (url) => {
                                  const next = [
                                    browsePageImages[0] ?? "",
                                    browsePageImages[1] ?? "",
                                  ];
                                  next[slotIndex] = url ?? "";
                                  setBrowsePageImages(next);
                                  await saveDecorativePageImages("browse", next);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2 rounded-lg border border-border/60 p-3">
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-medium text-foreground">Jobs page</p>
                                <p className="text-[11px] text-muted-foreground">Shown above `/jobs`.</p>
                              </div>
                              <Switch
                                checked={jobsPageHeroEnabled}
                                onCheckedChange={handleJobsPageHeroToggle}
                                disabled={saving}
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {[0, 1].map((slotIndex) => (
                              <ImageUpload
                                key={`jobs-${slotIndex}`}
                                type="page"
                                hint=""
                                value={jobsPageImages[slotIndex] || undefined}
                                onChange={async (url) => {
                                  const next = [
                                    jobsPageImages[0] ?? "",
                                    jobsPageImages[1] ?? "",
                                  ];
                                  next[slotIndex] = url ?? "";
                                  setJobsPageImages(next);
                                  await saveDecorativePageImages("jobs", next);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
                  )}
                </div>
              </div>
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
              onRecruiterUpdated={handleRecruiterUpdated}
            />
          ) : section === "applicants" ? (
            <PeopleSection
              recruiters={recruiters}
              applicants={applicants}
              bookings={adminBookings}
              onDeleteRecruiter={handleDeleteRecruiter}
              onDeleteApplicant={handleDeleteApplicant}
              onCancelBooking={handleCancelBooking}
              onTimeOverride={handleBookingTimeOverride}
              onApplicantCreated={(a) =>
                setApplicants((current) => [...current, a])
              }
              initialTab="applicants"
              showTabs={false}
            />
          ) : section === "interviews" ? (
            <InterviewsSection
              bookings={adminBookings}
              onCancel={handleCancelBooking}
              onBulkCancel={handleBulkCancelBookings}
              onTimeOverride={handleBookingTimeOverride}
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

  const filteredJobs = jobs
    .filter((job) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        job.company.toLowerCase().includes(q) ||
        job.title.toLowerCase().includes(q) ||
        (jobCategoryLabel(job.jobCategory, locale) ?? "").toLowerCase().includes(q) ||
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
    const isApproved = job.moderationStatus === "approved";
    const isRejected = job.moderationStatus === "rejected";
    const notes = job.moderationNotes ?? "";
    const category = jobCategoryLabel(job.jobCategory, locale);

    return (
      <Link
        key={job.id}
        href={`/admin/jobs/${job.id}`}
        className={cn(
          "flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between",
          statusBorderColor[job.moderationStatus] ?? ""
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{job.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex min-w-0 max-w-full items-center gap-1">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{job.company}</span>
            </span>
            <span className="flex min-w-0 max-w-full items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{job.location}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" /> {job.employmentType}
            </span>
            {category ? (
              <span className="flex shrink-0 items-center gap-1">
                <Briefcase className="h-3 w-3 shrink-0" />
                {category}
              </span>
            ) : null}
            <span className="flex shrink-0 items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {new Date(job.createdAt).toLocaleDateString(localeTag)}
            </span>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-2 sm:shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onModerate(job.id, "approve", notes);
            }}
            aria-pressed={isApproved}
            className={cn(
              "h-8",
              isApproved
                ? "border border-emerald-600 bg-background text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            )}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            {isApproved ? admin.moderation.approved : admin.moderation.approve}
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onModerate(job.id, "reject", notes);
            }}
            aria-pressed={isRejected}
            className={cn(
              "h-8",
              isRejected
                ? "border border-red-500 bg-background text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-500/10"
                : "bg-red-400 text-white hover:bg-red-500 dark:bg-red-400 dark:hover:bg-red-500"
            )}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            {isRejected ? admin.moderation.rejected : admin.moderation.reject}
          </Button>
        </div>
      </Link>
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
  onTimeOverride,
  onApplicantCreated,
  initialTab,
  showTabs,
}: {
  recruiters: Recruiter[];
  applicants: Applicant[];
  bookings: AdminBooking[];
  onDeleteRecruiter: (r: Recruiter) => void;
  onDeleteApplicant: (a: Applicant) => void;
  onCancelBooking: (b: AdminBooking) => void;
  onTimeOverride: (
    b: AdminBooking,
    time: string,
    action: AdminBookingTimeAction,
    note?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  onApplicantCreated?: (a: Applicant) => void;
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
        <div className="space-y-4">
        {onApplicantCreated ? (
          <AddApplicantPanel
            count={applicants.length}
            onCreated={onApplicantCreated}
          />
        ) : null}
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
        </div>
      ) : (
        <BookingsTable
          bookings={bookings}
          query={query}
          onCancel={onCancelBooking}
          onTimeOverride={onTimeOverride}
        />
      )}
    </div>
  );
}

function AddApplicantPanel({
  count,
  onCreated,
}: {
  count: number;
  onCreated: (a: Applicant) => void;
}) {
  const { messages } = useStudentI18n();
  const labels = messages.admin.addApplicant;
  const peopleLabels = messages.admin.people;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? labels.errorFallback);
      }
      onCreated(data.applicant);
      setEmail("");
      setName("");
      setPassword("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errorFallback);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-heading text-lg font-semibold">
            {peopleLabels.tabs.students}
          </h2>
          <Badge variant="secondary" className="ml-1">
            {count}
          </Badge>
        </div>
        <Button
          size="sm"
          variant={open ? "outline" : "default"}
          onClick={() => setOpen((v) => !v)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {labels.addButton}
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {labels.emailLabel}
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={labels.emailPlaceholder}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {labels.nameLabel}
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={labels.namePlaceholder}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {labels.passwordLabel}
                  </label>
                  <Input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={labels.passwordPlaceholder}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} size="sm">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      {labels.submitting}
                    </>
                  ) : (
                    labels.submit
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  {labels.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function BookingsTable({
  bookings,
  query,
  onCancel,
  onTimeOverride,
}: {
  bookings: AdminBooking[];
  query: string;
  onCancel: (b: AdminBooking) => void;
  onTimeOverride: (
    b: AdminBooking,
    time: string,
    action: AdminBookingTimeAction,
    note?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const { messages, locale } = useStudentI18n();
  const admin = messages.admin;
  const [editingId, setEditingId] = useState<number | null>(null);
  const [timeDraft, setTimeDraft] = useState("");
  const [actionDraft, setActionDraft] =
    useState<AdminBookingTimeAction>("propose");
  const [noteDraft, setNoteDraft] = useState("");
  const [timeSaving, setTimeSaving] = useState(false);
  const [timeError, setTimeError] = useState("");
  const [timeSavedId, setTimeSavedId] = useState<number | null>(null);
  const localeTag =
    locale === "vi" ? "vi-VN" : locale === "zh-TW" ? "zh-TW" : "en-US";
  // Design system status colors
  const statusColor: Record<string, string> = {
    pending: "bg-[#FF9500]/15 text-[#FF9500]", // WARNING orange
    accepted: "bg-[#30D158]/15 text-[#30D158]", // SUCCESS green
    waitlisted: "bg-[#8C52FF]/15 text-[#8C52FF]", // INFO purple
    reschedule_proposed: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    rejected: "bg-[#D70015]/15 text-[#D70015]", // DESTRUCTIVE red
    cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  const statusLabel: Record<string, string> = {
    pending: admin.bookings.status.pending,
    accepted: admin.bookings.status.accepted,
    waitlisted: admin.bookings.status.waitlisted,
    reschedule_proposed: "Reschedule proposed",
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

  function openTimeEditor(b: AdminBooking) {
    const currentIso = valueToIso(b.proposedTime) ?? valueToIso(b.requestedTime);
    setEditingId((current) => (current === b.id ? null : b.id));
    setTimeDraft(isoToTaipeiLocal(currentIso));
    setActionDraft(
      b.status === "accepted"
        ? "confirm"
        : b.status === "reschedule_proposed"
          ? "propose"
          : "request"
    );
    setNoteDraft("");
    setTimeError("");
    setTimeSavedId(null);
  }

  async function saveTimeOverride(b: AdminBooking) {
    const iso = taipeiLocalToIso(timeDraft);
    if (!iso) {
      setTimeError("Enter a valid Taiwan time.");
      return;
    }
    setTimeSaving(true);
    setTimeError("");
    const result = await onTimeOverride(b, iso, actionDraft, noteDraft);
    setTimeSaving(false);
    if (!result.ok) {
      setTimeError(result.error);
      return;
    }
    setTimeSavedId(b.id);
    setEditingId(null);
    setTimeout(() => setTimeSavedId(null), 2500);
  }

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
              const isActive = isActiveBookingStatus(b.status);
              const effectiveTime = valueToIso(b.proposedTime) ?? valueToIso(b.requestedTime);
              const isEditing = editingId === b.id;
              return (
                <Fragment key={b.id}>
                  <tr className="border-b last:border-b-0 hover:bg-muted/20">
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
                    <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell" suppressHydrationWarning>
                      {effectiveTime
                        ? new Date(effectiveTime).toLocaleString(localeTag, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "Asia/Taipei",
                        })
                        : admin.people.emptyValue}
                      {b.proposedTime ? (
                        <span className="ml-1 text-amber-600 dark:text-amber-400">
                          proposed
                        </span>
                      ) : null}
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
                      {timeSavedId === b.id ? (
                        <p className="mt-1 text-[11px] text-[#1f8f3a]">Saved</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        {isActive && (
                          <button
                            onClick={() => openTimeEditor(b)}
                            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            aria-label="Edit booking time"
                            title="Edit booking time"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={() => onCancel(b)}
                            className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={admin.people.cancelBookingAria}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isEditing ? (
                    <tr className="border-b bg-muted/20">
                      <td colSpan={6} className="px-3 py-3">
                        <div className="grid gap-2 md:grid-cols-[minmax(210px,1fr)_180px_minmax(180px,1fr)_auto]">
                          <Input
                            type="datetime-local"
                            value={timeDraft}
                            onChange={(e) => setTimeDraft(e.target.value)}
                          />
                          <select
                            value={actionDraft}
                            onChange={(e) =>
                              setActionDraft(e.target.value as AdminBookingTimeAction)
                            }
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="propose">Save proposal</option>
                            <option value="confirm">Confirm slot</option>
                            <option value="request">Edit request</option>
                          </select>
                          <Input
                            type="text"
                            placeholder="Internal note (optional)"
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => void saveTimeOverride(b)}
                              disabled={timeSaving}
                            >
                              {timeSaving ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              disabled={timeSaving}
                            >
                              <X className="mr-1.5 h-3.5 w-3.5" />
                              Close
                            </Button>
                          </div>
                        </div>
                        {timeError ? (
                          <p className="mt-2 text-xs text-destructive">{timeError}</p>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Proposal and confirm actions require an available recruiter slot at the exact Taiwan time.
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
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
  onRecruiterUpdated,
}: {
  recruiters: Recruiter[];
  approvals: RecruiterApproval[];
  onDeleteRecruiter: (r: Recruiter) => void;
  onDeleteApproval: (approval: RecruiterApproval) => void;
  onApprovalCreated: (approval: RecruiterApproval) => void;
  onRecruiterUpdated: (r: Recruiter) => void;
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

  // Edit recruiter modal
  const [editing, setEditing] = useState<Recruiter | null>(null);
  const [editForm, setEditForm] = useState({
    company: "",
    industry: "",
    contactEmail: "",
    description: "",
    websiteUrl: "",
    logoUrl: "" as string | null,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  function openEdit(r: Recruiter) {
    setEditing(r);
    setEditForm({
      company: r.company ?? "",
      industry: r.industry ?? "",
      contactEmail: r.contactEmail ?? "",
      description: r.description ?? "",
      websiteUrl: r.websiteUrl ?? "",
      logoUrl: r.logoUrl ?? null,
    });
    setEditError("");
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    setEditError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "logo");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setEditForm((f) => ({ ...f, logoUrl: data.url }));
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/recruiters?id=${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: editForm.company.trim(),
          industry: editForm.industry.trim(),
          contactEmail: editForm.contactEmail.trim(),
          description: editForm.description.trim(),
          websiteUrl: editForm.websiteUrl.trim() || null,
          logoUrl: editForm.logoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onRecruiterUpdated({ ...editing, ...data.recruiter });
      setEditing(null);
      router.refresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingEdit(false);
    }
  }

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

  // --- Featured / pinned companies (lead the public /browse directory) ---
  const [savingPins, setSavingPins] = useState(false);
  const [pinError, setPinError] = useState("");
  const [addPinId, setAddPinId] = useState("");

  const pinnedRecruiters = useMemo(
    () =>
      recruiters
        .filter((r) => r.pinnedRank != null)
        .sort((a, b) => (a.pinnedRank ?? 0) - (b.pinnedRank ?? 0)),
    [recruiters]
  );
  const unpinnedRecruiters = useMemo(
    () =>
      recruiters
        .filter((r) => r.pinnedRank == null)
        .sort((a, b) => a.company.localeCompare(b.company)),
    [recruiters]
  );

  async function savePinOrder(ids: number[]) {
    setSavingPins(true);
    setPinError("");
    try {
      const res = await fetch("/api/admin/recruiters/pin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save pin order");
      // Reflect new ranks in parent state without a full refetch.
      for (const r of recruiters) {
        const idx = ids.indexOf(r.id);
        const nextRank = idx === -1 ? null : idx;
        if ((r.pinnedRank ?? null) !== nextRank) {
          onRecruiterUpdated({ ...r, pinnedRank: nextRank });
        }
      }
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Failed to save pin order");
    } finally {
      setSavingPins(false);
    }
  }

  function movePin(index: number, dir: -1 | 1) {
    const ids = pinnedRecruiters.map((r) => r.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void savePinOrder(ids);
  }

  function unpin(id: number) {
    void savePinOrder(pinnedRecruiters.map((r) => r.id).filter((x) => x !== id));
  }

  function pinSelected() {
    const id = parseInt(addPinId, 10);
    if (Number.isNaN(id)) return;
    setAddPinId("");
    void savePinOrder([...pinnedRecruiters.map((r) => r.id), id]);
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

      {/* Featured / pinned companies */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <h3 className="font-heading text-sm font-semibold">
              Featured companies
            </h3>
            {savingPins && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Pinned companies lead the public Browse directory in this order.
            Unpinned companies follow, sorted by number of jobs posted.
          </p>

          {pinnedRecruiters.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pinned companies yet.</p>
          ) : (
            <ol className="space-y-1.5">
              {pinnedRecruiters.map((r, index) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border bg-muted/20 px-2.5 py-1.5"
                >
                  <span className="w-5 text-center text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {r.company}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => movePin(index, -1)}
                      disabled={savingPins || index === 0}
                      className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Move ${r.company} up`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => movePin(index, 1)}
                      disabled={savingPins || index === pinnedRecruiters.length - 1}
                      className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Move ${r.company} down`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => unpin(r.id)}
                      disabled={savingPins}
                      className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Unpin ${r.company}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="flex items-center gap-2 pt-1">
            <select
              value={addPinId}
              onChange={(e) => setAddPinId(e.target.value)}
              disabled={savingPins || unpinnedRecruiters.length === 0}
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value="">Pin a company…</option>
              {unpinnedRecruiters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.company}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={pinSelected}
              disabled={savingPins || !addPinId}
            >
              <Plus className="mr-1 h-4 w-4" />
              Pin
            </Button>
          </div>

          {pinError && <p className="text-xs text-destructive">{pinError}</p>}
        </CardContent>
      </Card>

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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        aria-label={`Edit ${r.company}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRecruiter(r)}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={interpolate(admin.people.removeRecruiterAria, { company: r.company })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold">
                Edit {editing.company}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {editForm.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editForm.logoUrl}
                    alt="Logo"
                    className="h-14 w-14 rounded-lg border object-contain"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-muted">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="cursor-pointer text-sm text-primary hover:underline">
                    {uploadingLogo ? "Uploading…" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleLogoUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {editForm.logoUrl && (
                    <button
                      onClick={() => setEditForm((f) => ({ ...f, logoUrl: null }))}
                      className="text-left text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Company
                </label>
                <input
                  value={editForm.company}
                  onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Industry
                </label>
                <input
                  value={editForm.industry}
                  onChange={(e) => setEditForm((f) => ({ ...f, industry: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Contact email
                </label>
                <input
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Website
                </label>
                <input
                  value={editForm.websiteUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {editError && (
              <p className="mt-3 text-xs text-destructive">{editError}</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button disabled={savingEdit || uploadingLogo} onClick={handleSaveEdit}>
                {savingEdit ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackRow({
  report,
  onStatusChange,
}: {
  report: FeedbackReportRow;
  onStatusChange: (status: "open" | "triaged" | "resolved") => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const kindStyle =
    report.kind === "bug"
      ? "bg-red-100 text-red-700"
      : report.kind === "feature"
        ? "bg-blue-100 text-blue-700"
        : "bg-purple-100 text-purple-700";

  const statusStyle =
    report.status === "resolved"
      ? "bg-green-100 text-green-700"
      : report.status === "triaged"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-orange-100 text-orange-700";

  const createdAt = new Date(report.createdAt);
  const logs = Array.isArray(report.clientLogs) ? report.clientLogs : [];

  return (
    <li className="rounded-lg border bg-background">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/30"
      >
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", kindStyle)}>
          {report.kind}
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", statusStyle)}>
          {report.status}
        </span>
        <span className="flex-1 truncate text-sm font-medium">{report.subject}</span>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          {report.userEmail ?? "—"}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="space-y-3 border-t px-3 py-3 text-xs">
          <div className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm leading-relaxed">
            {report.body}
          </div>

          <dl className="grid gap-1 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">From</dt>
              <dd>{report.userEmail ?? "anonymous"} ({report.userRole ?? "—"})</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Page</dt>
              <dd>
                <code className="break-all rounded bg-muted px-1 py-0.5">{report.pathname ?? "—"}</code>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Severity</dt>
              <dd>{report.severity}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Viewport</dt>
              <dd>{report.viewport ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">App version</dt>
              <dd>
                <code className="rounded bg-muted px-1 py-0.5">{report.appVersion ?? "dev"}</code>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">User agent</dt>
              <dd className="break-all">{report.userAgent ?? "—"}</dd>
            </div>
          </dl>

          {report.screenshotUrl && (
            <div>
              <p className="mb-1 text-muted-foreground">Screenshot</p>
              <a href={report.screenshotUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={report.screenshotUrl}
                  alt="User screenshot"
                  className="max-h-72 w-auto rounded-md border border-border object-contain"
                />
              </a>
            </div>
          )}

          {logs.length > 0 && (
            <details className="rounded-md border border-border bg-muted/30 p-2">
              <summary className="cursor-pointer text-muted-foreground">
                Recent client errors ({logs.length})
              </summary>
              <ol className="mt-2 space-y-2">
                {logs.map((entry, i) => {
                  const e = entry as Record<string, unknown>;
                  return (
                    <li key={i} className="rounded bg-background p-2 font-mono text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{String(e.type ?? "error")}</span>
                        <span className="text-muted-foreground">
                          {typeof e.ts === "number" ? new Date(e.ts).toLocaleTimeString() : ""}
                        </span>
                      </div>
                      <div className="mt-1 break-all">{String(e.message ?? "")}</div>
                      {e.source ? <div className="text-muted-foreground">{String(e.source)}</div> : null}
                      {e.stack ? (
                        <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
                          {String(e.stack)}
                        </pre>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </details>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-muted-foreground">Mark as</span>
            {(["open", "triaged", "resolved"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStatusChange(s)}
                disabled={s === report.status}
                className={cn(
                  "h-7 rounded-full border px-3 text-[11px] capitalize",
                  s === report.status
                    ? "cursor-default border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/50"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

// ------------------------------------------------------------------
// Interviews Section — flat admin view of all bookings with bulk cancel
// ------------------------------------------------------------------

function InterviewsSection({
  bookings,
  onCancel,
  onBulkCancel,
  onTimeOverride,
}: {
  bookings: AdminBooking[];
  onCancel: (b: AdminBooking, note?: string) => void;
  onBulkCancel: (ids: number[], note?: string) => Promise<number>;
  onTimeOverride: (
    b: AdminBooking,
    time: string,
    action: AdminBookingTimeAction,
    note?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const { messages } = useStudentI18n();
  const admin = messages.admin;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"active" | "cancelled" | "all">("active");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkEmail, setBulkEmail] = useState("");
  const [bulkNote, setBulkNote] = useState("");
  const [bulkRunning, setBulkRunning] = useState(false);

  const filtered = bookings.filter((b) => {
    if (filter === "active") return isActiveBookingStatus(b.status);
    if (filter === "cancelled")
      return b.status === "cancelled" || b.status === "rejected";
    return true;
  });

  const counts = {
    active: bookings.filter((b) => isActiveBookingStatus(b.status)).length,
    cancelled: bookings.filter(
      (b) => b.status === "cancelled" || b.status === "rejected"
    ).length,
    all: bookings.length,
  };

  async function runBulkCancel() {
    const target = bulkEmail.trim().toLowerCase();
    if (!target) return;
    const matches = bookings.filter(
      (b) =>
        isActiveBookingStatus(b.status) &&
        b.applicantEmail.toLowerCase().includes(target)
    );
    if (matches.length === 0) {
      alert(`No active bookings match "${target}".`);
      return;
    }
    if (
      !confirm(
        `Cancel ${matches.length} booking${matches.length === 1 ? "" : "s"} matching "${target}"? Applicants will be notified.`
      )
    )
      return;
    setBulkRunning(true);
    try {
      const cancelled = await onBulkCancel(
        matches.map((m) => m.id),
        bulkNote
      );
      alert(`Cancelled ${cancelled} of ${matches.length} bookings.`);
      setBulkEmail("");
      setBulkNote("");
      setBulkOpen(false);
    } finally {
      setBulkRunning(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-heading text-lg font-semibold">
          {admin.people.tabs.bookings}
        </h2>
        <Badge variant="secondary" className="ml-1">
          {counts.all}
        </Badge>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["active", "cancelled", "all"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {key === "active"
              ? "Active"
              : key === "cancelled"
                ? "Cancelled / Rejected"
                : "All"}
            <span className="ml-1.5 opacity-70">{counts[key]}</span>
          </button>
        ))}
        <div className="ml-auto">
          <Button
            size="sm"
            variant={bulkOpen ? "outline" : "default"}
            onClick={() => setBulkOpen((v) => !v)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Bulk cancel by email
          </Button>
        </div>
      </div>

      {bulkOpen && (
        <Card className="mb-3">
          <CardContent className="py-4">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Cancels every <strong>active</strong> booking whose applicant
                email contains the text below. Soft-cancel: rows are kept,
                slots released, applicants notified via email.
              </p>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Input
                  type="text"
                  placeholder="applicant email or substring (e.g. niko.tecx@)"
                  value={bulkEmail}
                  onChange={(e) => setBulkEmail(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Note to applicants (optional)"
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={runBulkCancel}
                  disabled={bulkRunning || !bulkEmail.trim()}
                >
                  {bulkRunning ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Cancel matching
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative mb-3 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={admin.people.searchBookingsPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <BookingsTable
        bookings={filtered}
        query={query}
        onCancel={(b) => onCancel(b)}
        onTimeOverride={onTimeOverride}
      />
    </div>
  );
}

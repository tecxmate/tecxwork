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
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/site-footer";
import { QRCard } from "@/components/qr-code";

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

type Stats = {
  totalRecruiters: number;
  totalBookings: number;
  activeBookings: number;
  totalSlots: number;
  availableSlots: number;
  totalApplicants: number;
};

const MODES = [
  {
    value: "applicant_books_recruiter",
    label: "Applicants book Recruiters",
    desc: "Students browse companies and book interview slots.",
  },
  {
    value: "recruiter_books_applicant",
    label: "Recruiters book Applicants",
    desc: "Recruiters browse student profiles and book interviews.",
  },
  {
    value: "both",
    label: "Both (Bidirectional)",
    desc: "Both flows are active simultaneously.",
  },
] as const;

export function AdminDashboard({
  recruiters: initialRecruiters,
  applicants: initialApplicants,
  bookings: initialBookings,
  domains: initialDomains,
  stats,
  currentMode,
  initialLocked,
  timeFrame: initialTimeFrame,
}: {
  recruiters: Recruiter[];
  applicants: Applicant[];
  bookings: AdminBooking[];
  domains: Domain[];
  stats: Stats;
  currentMode: string;
  initialLocked: boolean;
  timeFrame: { startHour: number; endHour: number; endMinute: number; slotDuration: number };
}) {
  const router = useRouter();
  const [mode, setMode] = useState(currentMode);
  const [locked, setLocked] = useState(initialLocked);
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [recruiters, setRecruiters] = useState<Recruiter[]>(initialRecruiters);
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);
  const [adminBookings, setAdminBookings] = useState<AdminBooking[]>(initialBookings);
  const [tf, setTf] = useState(initialTimeFrame);
  const [tfSaving, setTfSaving] = useState(false);
  const [tfSaved, setTfSaved] = useState(false);
  const [tfError, setTfError] = useState("");

  // Domain form
  const [newDomain, setNewDomain] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newIndustry, setNewIndustry] = useState("Technology");
  const [domainError, setDomainError] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

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
      if (
        !confirm(
          "Lock the event mode? This prevents further changes until you unlock it. Use this before the event starts to avoid accidental changes."
        )
      )
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
      if (!res.ok) throw new Error(data.error || "Failed to add domain");

      setDomains([...domains, data.domain]);
      setNewDomain("");
      setNewCompany("");
    } catch (err) {
      setDomainError(err instanceof Error ? err.message : "Error");
    } finally {
      setAddingDomain(false);
    }
  }

  async function handleDeleteDomain(id: number) {
    if (!confirm("Remove this domain from the allow-list?")) return;
    await fetch(`/api/admin/domains?id=${id}`, { method: "DELETE" });
    setDomains(domains.filter((d) => d.id !== id));
  }

  async function handleDeleteRecruiter(r: Recruiter) {
    if (
      !confirm(
        `Remove ${r.company} (${r.email})? This will permanently delete their account, all interview slots, and any bookings.`
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
    if (!confirm(`Cancel booking for ${b.applicantName} at ${b.company}? Slot will be released.`)) return;
    const res = await fetch(`/api/bookings/${b.id}`, { method: "DELETE" });
    if (res.ok) {
      setAdminBookings(adminBookings.map((x) => (x.id === b.id ? { ...x, status: "cancelled" } : x)));
      router.refresh();
    }
  }

  async function handleDeleteApplicant(a: Applicant) {
    if (
      !confirm(
        `Remove ${a.name} (${a.email})? This will permanently delete their profile, availability, and bookings.`
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

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              View Site
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {[
              { label: "Recruiters", value: stats.totalRecruiters, icon: Users },
              { label: "Students", value: stats.totalApplicants, icon: GraduationCap },
              { label: "Slots", value: stats.totalSlots, icon: Calendar },
              { label: "Available", value: stats.availableSlots, icon: Clock },
              { label: "Bookings", value: stats.totalBookings, icon: BookOpen },
            ].map((stat) => (
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
              title="Event QR Code"
              subtitle="Share this at the venue for attendees to access the platform"
              size={140}
            />
            <div className="flex sm:self-end">
              <a
                href="/api/admin/export"
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <Download className="h-4 w-4" />
                Export Bookings (CSV)
              </a>
            </div>
          </div>

          <Separator />

          {/* Event Mode Toggle */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-heading text-lg font-semibold">
                  Event Mode
                </h2>
                {saving && (
                  <span className="text-xs text-muted-foreground">
                    Saving...
                  </span>
                )}
              </div>
              <Button
                variant={locked ? "default" : "outline"}
                size="sm"
                onClick={handleToggleLock}
                disabled={saving}
              >
                {locked ? (
                  <>
                    <Lock className="mr-1.5 h-3.5 w-3.5" />
                    Locked
                  </>
                ) : (
                  <>
                    <LockOpen className="mr-1.5 h-3.5 w-3.5" />
                    Unlocked
                  </>
                )}
              </Button>
            </div>

            {locked && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Mode is locked.
                  </span>{" "}
                  Changes are prevented until you click &quot;Locked&quot; to
                  unlock. This protects against accidental changes during the
                  event.
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleModeChange(m.value)}
                  disabled={locked}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    locked
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer",
                    mode === m.value
                      ? "border-primary bg-primary/5"
                      : !locked && "border-border hover:border-primary/40"
                  )}
                >
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Time Frame */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold">
                Event Time Frame
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
                      setTfError(d.error || "Failed to save");
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
                      <label className="text-xs font-medium text-muted-foreground">Start Hour</label>
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        value={tf.startHour}
                        onChange={(e) => setTf({ ...tf, startHour: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">End Hour</label>
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        value={tf.endHour}
                        onChange={(e) => setTf({ ...tf, endHour: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">End Minute</label>
                      <Input
                        type="number"
                        min={0}
                        max={59}
                        value={tf.endMinute}
                        onChange={(e) => setTf({ ...tf, endMinute: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Slot Duration (min)</label>
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
                    Event runs {String(tf.startHour).padStart(2, "0")}:00 – {String(tf.endHour).padStart(2, "0")}:{String(tf.endMinute).padStart(2, "0")} with {tf.slotDuration}-minute slots.
                  </p>

                  {stats.activeBookings > 0 && (
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-300/50 bg-yellow-50 p-3 text-xs dark:border-yellow-800/50 dark:bg-yellow-900/10">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-700 dark:text-yellow-400" />
                      <p className="text-yellow-800 dark:text-yellow-300">
                        <span className="font-semibold">Locked.</span> {stats.activeBookings} active booking{stats.activeBookings > 1 ? "s" : ""} exist.
                        Cancel or reject all active bookings before changing the time frame.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={tfSaving || stats.activeBookings > 0} size="sm">
                      {tfSaving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving...</> : "Save & Regenerate Slots"}
                    </Button>
                    {tfSaved && (
                      <span className="text-xs text-green-600">Saved!</span>
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

          {/* Allowed Recruiter Domains */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <AtSign className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold">
                Allowed Recruiter Domains
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Only recruiters with emails from these domains can sign up. Add
              the company name and industry to pre-fill their profile.
            </p>

            <Card className="mb-4">
              <CardContent className="py-4">
                <form
                  onSubmit={handleAddDomain}
                  className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Domain
                    </label>
                    <Input
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="tsmc.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Company Name
                    </label>
                    <Input
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      placeholder="TSMC"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Industry
                    </label>
                    <select
                      value={newIndustry}
                      onChange={(e) => setNewIndustry(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      <option>Technology</option>
                      <option>Finance</option>
                      <option>Semiconductor</option>
                      <option>Manufacturing</option>
                      <option>Consulting</option>
                      <option>Healthcare</option>
                      <option>E-Commerce</option>
                    </select>
                  </div>
                  {domainError && (
                    <p className="text-xs text-destructive sm:col-span-3">
                      {domainError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={addingDomain}
                    className="sm:col-span-3"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Domain
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {domains.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No allowed domains yet. Add one above to let recruiters sign up.
                </p>
              ) : (
                domains.map((d) => (
                  <Card key={d.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <p className="font-medium">{d.company}</p>
                        <p className="text-xs text-muted-foreground">
                          @{d.domain} · {d.industry}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDomain(d.id)}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${d.domain}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* People: Recruiters + Applicants */}
          <PeopleSection
            recruiters={recruiters}
            applicants={applicants}
            bookings={adminBookings}
            onDeleteRecruiter={handleDeleteRecruiter}
            onDeleteApplicant={handleDeleteApplicant}
            onCancelBooking={handleCancelBooking}
          />
        </div>
      </main>
      <SiteFooter />
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
}: {
  recruiters: Recruiter[];
  applicants: Applicant[];
  bookings: AdminBooking[];
  onDeleteRecruiter: (r: Recruiter) => void;
  onDeleteApplicant: (a: Applicant) => void;
  onCancelBooking: (b: AdminBooking) => void;
}) {
  const [tab, setTab] = useState<"recruiters" | "applicants" | "bookings">("recruiters");
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
        <h2 className="font-heading text-lg font-semibold">People</h2>
      </div>

      {/* Tabs */}
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
          Recruiters
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
          Students
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
          Bookings
          <Badge variant="secondary" className="ml-1 text-xs">
            {bookings.filter((b) => b.status !== "cancelled" && b.status !== "rejected").length}
          </Badge>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={
            tab === "recruiters"
              ? "Search name, company, email..."
              : "Search name, email, major..."
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
                  label="Name"
                  active={recSort.key === "name"}
                  dir={recSort.dir}
                  onClick={() => toggleRecSort("name")}
                />
                <SortHeader
                  label="Company"
                  active={recSort.key === "company"}
                  dir={recSort.dir}
                  onClick={() => toggleRecSort("company")}
                />
                <SortHeader
                  label="Email"
                  active={recSort.key === "email"}
                  dir={recSort.dir}
                  onClick={() => toggleRecSort("email")}
                />
                <SortHeader
                  label="Industry"
                  active={recSort.key === "industry"}
                  dir={recSort.dir}
                  onClick={() => toggleRecSort("industry")}
                  className="hidden sm:table-cell"
                />
                <SortHeader
                  label="Joined"
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
                    No recruiters found.
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
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => onDeleteRecruiter(r)}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${r.company}`}
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
                <SortHeader label="Name" active={appSort.key === "name"} dir={appSort.dir} onClick={() => toggleAppSort("name")} />
                <SortHeader label="Email" active={appSort.key === "email"} dir={appSort.dir} onClick={() => toggleAppSort("email")} />
                <SortHeader label="Major" active={appSort.key === "major"} dir={appSort.dir} onClick={() => toggleAppSort("major")} className="hidden sm:table-cell" />
                <SortHeader label="Joined" active={appSort.key === "createdAt"} dir={appSort.dir} onClick={() => toggleAppSort("createdAt")} className="hidden md:table-cell" />
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No students found.</td></tr>
              ) : (
                filteredApplicants.map((a) => (
                  <tr key={a.id} className="border-b last:border-b-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-medium">{a.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground"><a href={`mailto:${a.email}`} className="hover:text-primary hover:underline">{a.email}</a></td>
                    <td className="hidden px-3 py-2.5 text-muted-foreground sm:table-cell">{a.major || "—"}</td>
                    <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => onDeleteApplicant(a)} className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${a.name}`}>
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
  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    waitlisted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
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
            <th className="px-3 py-2 text-left font-medium">Student</th>
            <th className="px-3 py-2 text-left font-medium">Company</th>
            <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Position</th>
            <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Time</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                No bookings found.
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
                    {b.position || "—"}
                  </td>
                  <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">
                    {b.requestedTime
                      ? new Date(b.requestedTime).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "Asia/Taipei",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        statusColor[b.status] ?? ""
                      )}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {isActive && (
                      <button
                        onClick={() => onCancel(b)}
                        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Cancel booking"
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

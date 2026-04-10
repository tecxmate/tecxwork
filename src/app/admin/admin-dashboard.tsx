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
  Mail,
  AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/site-footer";

type Recruiter = {
  id: number;
  company: string;
  industry: string;
  contactEmail: string;
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
  recruiters,
  domains: initialDomains,
  stats,
  currentMode,
}: {
  recruiters: Recruiter[];
  domains: Domain[];
  stats: Stats;
  currentMode: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(currentMode);
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState<Domain[]>(initialDomains);

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
    setSaving(true);
    setMode(newMode);
    await fetch("/api/admin/mode", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode }),
    });
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

          <Separator />

          {/* Event Mode Toggle */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold">Event Mode</h2>
              {saving && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleModeChange(m.value)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-4 text-left transition-colors",
                    mode === m.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
                </button>
              ))}
            </div>
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

          {/* Recruiter list */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold">
                Registered Recruiters
              </h2>
            </div>
            <div className="space-y-2">
              {recruiters.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.company}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        {r.contactEmail}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {r.industry}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
              {recruiters.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No recruiters yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

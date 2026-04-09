"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Calendar,
  BookOpen,
  Clock,
  LogOut,
  GraduationCap,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Recruiter = {
  id: number;
  company: string;
  industry: string;
  contactEmail: string;
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
  stats,
  currentMode,
}: {
  recruiters: Recruiter[];
  stats: Stats;
  currentMode: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(currentMode);
  const [saving, setSaving] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
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

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">
              Admin Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
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

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Recruiters", value: stats.totalRecruiters, icon: Users },
              { label: "Applicants", value: stats.totalApplicants, icon: GraduationCap },
              { label: "Total Slots", value: stats.totalSlots, icon: Calendar },
              { label: "Available", value: stats.availableSlots, icon: Clock },
              { label: "Bookings", value: stats.totalBookings, icon: BookOpen },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
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
                <span className="text-xs text-muted-foreground">
                  Saving...
                </span>
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Recruiter list */}
          <div>
            <h2 className="font-heading text-lg font-semibold">Recruiters</h2>
            <div className="mt-4 space-y-2">
              {recruiters.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{r.company}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.contactEmail}
                      </p>
                    </div>
                    <Badge variant="secondary">{r.industry}</Badge>
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
    </div>
  );
}

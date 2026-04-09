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
  Users,
  BookOpen,
  Calendar,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SlotPicker } from "@/components/slot-picker-applicant";

type Booking = {
  id: number;
  direction: string;
  applicantName: string;
  applicantEmail: string;
  cvLink: string;
  status: string;
  createdAt: Date | null;
  slotStart: Date;
  slotEnd: Date;
};

type Recruiter = {
  id: number;
  company: string;
  industry: string;
  description: string;
  contactEmail: string;
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

type Tab = "bookings" | "applicants";

export function RecruiterDashboard({
  recruiter,
  bookings,
  eventMode,
}: {
  recruiter: Recruiter;
  bookings: Booking[];
  eventMode: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("bookings");
  const showApplicants =
    eventMode === "recruiter_books_applicant" || eventMode === "both";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">
              {recruiter.company}
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

      {/* Tabs */}
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl gap-0 px-4 sm:px-6">
          <button
            onClick={() => setTab("bookings")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "bookings"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="h-4 w-4" />
            My Bookings
            <Badge variant="secondary" className="ml-1 text-xs">
              {bookings.length}
            </Badge>
          </button>
          {showApplicants && (
            <button
              onClick={() => setTab("applicants")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                tab === "applicants"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <GraduationCap className="h-4 w-4" />
              Browse Applicants
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {tab === "bookings" ? (
            <BookingsTab bookings={bookings} />
          ) : (
            <ApplicantsTab recruiterId={recruiter.id} />
          )}
        </div>
      </main>
    </div>
  );
}

function BookingsTab({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No bookings yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <Card key={b.id}>
          <CardContent className="py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{b.applicantName}</p>
                  <Badge variant="outline" className="text-xs">
                    {b.direction === "recruiter_books_applicant"
                      ? "You booked"
                      : "They booked"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {b.applicantEmail}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(b.slotStart), "MMM d, HH:mm")} –{" "}
                    {format(new Date(b.slotEnd), "HH:mm")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={b.cvLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  CV
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Badge
                  variant={
                    b.status === "confirmed" ? "default" : "secondary"
                  }
                >
                  {b.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ApplicantsTab({ recruiterId }: { recruiterId: number }) {
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
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, major, or skill..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading applicants...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No applicants found.
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
                    CV
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
      if (!res.ok) throw new Error(data.error || "Booking failed");

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
            Interview Booked!
          </h3>
          <p className="text-sm text-muted-foreground">
            Interview with {applicant.name} at{" "}
            {selectedSlot &&
              format(new Date(selectedSlot.startTime), "MMM d, HH:mm")}
            .
          </p>
          <Button variant="outline" onClick={onBack}>
            Back to Applicants
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={onBack}>
        Back to Applicants
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
              View CV
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        {/* Slot picker */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <h3 className="font-heading text-lg font-semibold">
              Select a Time Slot
            </h3>
            <p className="text-sm text-muted-foreground">
              Pick a time from {applicant.name}&apos;s availability.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <SlotPicker
              applicantId={applicant.id}
              onSlotSelect={(slot) => setSelectedSlot(slot)}
            />

            {selectedSlot && bookingState === "picking" && (
              <Button onClick={handleConfirm} className="w-full">
                Confirm Booking at{" "}
                {format(new Date(selectedSlot.startTime), "HH:mm")}
              </Button>
            )}

            {bookingState === "confirming" && (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </Button>
            )}

            {bookingState === "error" && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {errorMsg}
                <button
                  onClick={() => setBookingState("picking")}
                  className="mt-1 block text-xs underline"
                >
                  Try again
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Search,
  Loader2,
  Users,
  Mail,
  FileText,
  ExternalLink,
} from "lucide-react";

import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { SlotPicker } from "@/components/slot-picker-applicant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Applicant = {
  id: number;
  name: string;
  email: string;
  schoolName: string;
  schoolNameEn: string;
  major: string;
  expectedGraduation: string;
  skills: string[];
  cvLink: string;
  description: string;
};

export function RecruiterApplicantsTab({
  recruiterId,
}: {
  recruiterId: number;
}) {
  const { messages } = useRecruiterI18n();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setCurrentPage(1);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const loadingTimer = window.setTimeout(() => {
      setLoading(true);
    }, 0);

    const params = new URLSearchParams({
      query: debouncedQuery,
      page: String(currentPage),
      limit: "12",
    });

    fetch(`/api/applicants?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setApplicants(data.applicants ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setApplicants([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));

    return () => {
      controller.abort();
      window.clearTimeout(loadingTimer);
    };
  }, [debouncedQuery, currentPage]);

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
      ) : applicants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {messages.dashboard.applicants.empty}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {total} applicants found
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {applicants.map((a) => (
              <Card
                key={a.id}
                className="cursor-pointer"
                onClick={() => setSelectedApplicant(a)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{a.name}</p>
                      {(a.schoolName || a.schoolNameEn) && (
                        <p className="text-xs text-muted-foreground">
                          {a.schoolName || a.schoolNameEn}
                        </p>
                      )}
                      {a.major && (
                        <p className="text-xs text-muted-foreground">{a.major}</p>
                      )}
                      {a.expectedGraduation && (
                        <p className="text-xs text-muted-foreground">
                          Expected graduation: {a.expectedGraduation}
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
                        <Badge key={s} variant="outline" className="text-xs font-normal">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {a.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {a.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
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
      if (!res.ok) {
        throw new Error(data.error || messages.signup.errors.somethingWentWrong);
      }

      setBookingState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
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
            {selectedSlot && format(new Date(selectedSlot.startTime), "MMM d, HH:mm")}.
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-heading text-lg font-semibold">{applicant.name}</h2>
            {(applicant.schoolName || applicant.schoolNameEn) && (
              <p className="text-sm text-muted-foreground">
                {applicant.schoolName || applicant.schoolNameEn}
              </p>
            )}
            {applicant.major && (
              <p className="text-sm text-muted-foreground">{applicant.major}</p>
            )}
            {applicant.expectedGraduation && (
              <p className="text-sm text-muted-foreground">
                Expected graduation: {applicant.expectedGraduation}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {applicant.description && (
              <p className="text-sm text-muted-foreground">{applicant.description}</p>
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

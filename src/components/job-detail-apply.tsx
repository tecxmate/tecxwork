"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, LogIn } from "lucide-react";

import { BookingForm } from "@/components/booking-form";
import {
  RecruiterJobPostingCard,
  type RecruiterJobPosting,
} from "@/components/recruiter-job-posting-card";
import { SlotPicker } from "@/components/slot-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EVENT_CONFIG } from "@/lib/data";
import type { JobPostingLocale } from "@/lib/job-posting";
import { interpolate, type StudentMessages } from "@/lib/student-messages";

type SelectedSlot = {
  startTime: string;
  endTime: string;
};

type Step = "details" | "pick-slot" | "booking-form";

type JobDetailApplyJob = RecruiterJobPosting & {
  recruiterId: number;
  company: string;
};

export function JobDetailApply({
  job,
  locale,
  messages,
  isApplicant,
}: {
  job: JobDetailApplyJob;
  locale: JobPostingLocale;
  messages: StudentMessages;
  isApplicant: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [appliedPositions, setAppliedPositions] = useState<
    {
      jobOpeningId: number | null;
      position: string;
      requestedTime: string;
      status: string;
    }[]
  >([]);

  useEffect(() => {
    if (!isApplicant) return;
    fetch(`/api/bookings/mine?recruiterId=${job.recruiterId}`)
      .then((response) => response.json())
      .then((data) => {
        const bookingsList = (data.bookings ?? [])
          .filter(
            (booking: { status: string }) =>
              booking.status === "pending" ||
              booking.status === "accepted" ||
              booking.status === "waitlisted"
          )
          .map(
            (booking: {
              jobOpeningId: number | null;
              position: string;
              requestedTime: string;
              status: string;
            }) => ({
              jobOpeningId: booking.jobOpeningId,
              position: booking.position,
              requestedTime: booking.requestedTime,
              status: booking.status,
            })
          );
        setAppliedPositions(bookingsList);
      })
      .catch(() => {});
  }, [isApplicant, job.recruiterId]);

  const appliedBooking = appliedPositions.find((booking) =>
    booking.jobOpeningId
      ? booking.jobOpeningId === job.id
      : booking.position === job.title
  );
  const alreadyApplied = appliedBooking !== undefined;
  const bookingStatusLabel = (status: string) => {
    if (status === "accepted") return messages.recruiterDetail.interviewConfirmed;
    if (status === "waitlisted") return messages.recruiterDetail.waitlisted;
    if (status === "pending") return messages.recruiterDetail.pendingReview;
    return messages.recruiterDetail.applied;
  };

  const handleApply = () => {
    if (!isApplicant) {
      router.push("/get-started");
      return;
    }
    setStep("pick-slot");
  };

  const handleBack = () => {
    if (step === "booking-form") {
      setSelectedSlot(null);
      setStep("pick-slot");
    } else {
      setStep("details");
    }
  };

  const handleDone = () => {
    if (selectedSlot) {
      setAppliedPositions([
        ...appliedPositions,
        {
          jobOpeningId: job.id,
          position: job.title,
          requestedTime: selectedSlot.startTime,
          status: "pending",
        },
      ]);
    }
    setSelectedSlot(null);
    setStep("details");
  };

  if (step === "pick-slot") {
    return (
      <Card>
        <CardHeader>
          <button
            onClick={handleBack}
            className="mb-2 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {messages.common.back}
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {job.title}
            </Badge>
          </div>
          <h2 className="font-heading text-lg font-semibold">
            {messages.recruiterDetail.selectTimeSlot}
          </h2>
          <p className="text-sm text-muted-foreground">
            {interpolate(messages.recruiterDetail.pickTime, {
              duration: EVENT_CONFIG.slotDuration,
            })}
          </p>
        </CardHeader>
        <CardContent>
          <SlotPicker
            recruiterId={job.recruiterId}
            onSlotSelect={(slot) => {
              setSelectedSlot(slot);
              setStep("booking-form");
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (step === "booking-form" && selectedSlot) {
    return (
      <BookingForm
        recruiterId={job.recruiterId}
        company={job.company}
        jobOpeningId={job.id}
        positions={[job.title]}
        slot={selectedSlot}
        onBack={handleBack}
        onDone={handleDone}
      />
    );
  }

  return (
    <RecruiterJobPostingCard
      job={job}
      locale={locale}
      className="border-0 bg-transparent p-0 shadow-none hover:border-transparent hover:bg-transparent hover:shadow-none"
      labels={{
        seniority: messages.jobsPage.card.seniority,
        languageRequirement: messages.jobsPage.card.languageRequirement,
        visaSupport: messages.jobsPage.card.visaSupport,
        applicationDeadline: messages.jobsPage.card.applicationDeadline,
        description: messages.jobsPage.card.description,
        responsibilities: messages.jobsPage.card.responsibilities,
        requirements: messages.jobsPage.card.requirements,
        benefits: messages.jobsPage.card.benefits,
        viewJd: messages.jobsPage.card.viewJd,
        noJd: messages.jobsPage.card.noJd,
      }}
      status={
        alreadyApplied ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {bookingStatusLabel(appliedBooking!.status)}
          </span>
        ) : undefined
      }
      action={
        alreadyApplied ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {messages.recruiterDetail.onePerPosition}
          </span>
        ) : (
          <Button size="sm" onClick={handleApply} className="shrink-0">
            {isApplicant ? (
              <>
                {messages.recruiterDetail.apply}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <LogIn className="mr-1 h-3.5 w-3.5" />
                {messages.recruiterDetail.loginToApply}
              </>
            )}
          </Button>
        )
      }
    />
  );
}

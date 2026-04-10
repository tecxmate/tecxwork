"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SlotPicker } from "@/components/slot-picker";
import { BookingForm } from "@/components/booking-form";
import { EVENT_CONFIG } from "@/lib/data";

type Recruiter = {
  id: number;
  company: string;
  industry: string;
  description: string;
  positions: string[];
  contactEmail: string;
  jdLink: string | null;
};

type SelectedSlot = {
  id: number;
  startTime: string;
  endTime: string;
};

export function RecruiterDetail({ recruiter }: { recruiter: Recruiter }) {
  const [step, setStep] = useState<"pick-slot" | "booking-form">("pick-slot");
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const handleSlotSelect = (slot: SelectedSlot) => {
    setSelectedSlot(slot);
    setStep("booking-form");
  };

  const handleBack = () => {
    setSelectedSlot(null);
    setStep("pick-slot");
  };

  const CompanyInfo = () => (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-center gap-3 lg:flex-col lg:items-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary lg:h-14 lg:w-14">
            <Building2 className="h-6 w-6 text-primary lg:h-7 lg:w-7" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold lg:text-2xl">
              {recruiter.company}
            </h1>
            <Badge variant="secondary" className="mt-1">
              {recruiter.industry}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{recruiter.description}</p>
        <Separator />
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Open Positions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recruiter.positions.map((pos) => (
              <Badge key={pos} variant="outline" className="text-xs font-normal">
                {pos}
              </Badge>
            ))}
          </div>
        </div>
        <Separator />
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-all">
              Share CV with: {recruiter.contactEmail}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{EVENT_CONFIG.slotDuration} min interview</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{EVENT_CONFIG.location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/browse"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <div className="flex-1 text-center">
            <p className="truncate text-sm font-medium">{recruiter.company}</p>
          </div>
          <div className="w-14" />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl">
          {/* Mobile: collapsible company info at top */}
          <div className="mb-4 lg:hidden">
            <Card>
              <button
                onClick={() => setInfoExpanded(!infoExpanded)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-base font-semibold">
                      {recruiter.company}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {recruiter.industry} · {recruiter.positions.length} positions
                    </p>
                  </div>
                </div>
                {infoExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {infoExpanded && (
                <CardContent className="border-t pt-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {recruiter.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recruiter.positions.map((pos) => (
                        <Badge
                          key={pos}
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {pos}
                        </Badge>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <p className="flex items-start gap-1.5">
                        <Mail className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="break-all">{recruiter.contactEmail}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 shrink-0" />
                        {EVENT_CONFIG.slotDuration} min interview
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Desktop: full company info card */}
            <div className="hidden lg:col-span-2 lg:block">
              <CompanyInfo />
            </div>

            {/* Slot picker / booking form — primary focus on mobile */}
            <div className="lg:col-span-3">
              {step === "pick-slot" ? (
                <Card>
                  <CardHeader>
                    <h2 className="font-heading text-lg font-semibold">
                      Select a Time Slot
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Pick a time for your {EVENT_CONFIG.slotDuration} min
                      interview.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <SlotPicker
                      recruiterId={recruiter.id}
                      onSlotSelect={handleSlotSelect}
                    />
                  </CardContent>
                </Card>
              ) : selectedSlot ? (
                <BookingForm
                  recruiterId={recruiter.id}
                  company={recruiter.company}
                  contactEmail={recruiter.contactEmail}
                  slot={selectedSlot}
                  onBack={handleBack}
                />
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

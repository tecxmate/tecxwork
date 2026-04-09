"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Mail, MapPin, Clock } from "lucide-react";
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

  const handleSlotSelect = (slot: SelectedSlot) => {
    setSelectedSlot(slot);
    setStep("booking-form");
  };

  const handleBack = () => {
    setSelectedSlot(null);
    setStep("pick-slot");
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Directory</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-heading text-2xl font-bold">{recruiter.company}</h1>
                    <Badge variant="secondary" className="mt-1">{recruiter.industry}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{recruiter.description}</p>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Open Positions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {recruiter.positions.map((pos) => (
                        <Badge key={pos} variant="outline" className="text-xs font-normal">{pos}</Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Share CV with: {recruiter.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{EVENT_CONFIG.slotDuration} min interview</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{EVENT_CONFIG.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {step === "pick-slot" ? (
                <Card>
                  <CardHeader>
                    <h2 className="font-heading text-lg font-semibold">Select a Time Slot</h2>
                    <p className="text-sm text-muted-foreground">
                      Pick a time for your {EVENT_CONFIG.slotDuration} min interview.
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

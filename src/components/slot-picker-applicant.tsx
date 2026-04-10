"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Slot = { id: number; startTime: string; endTime: string; status: string };

export function SlotPicker({
  applicantId,
  onSlotSelect,
}: {
  applicantId: number;
  onSlotSelect: (slot: { id: number; startTime: string }) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  useEffect(() => {
    setSelectedDate(startOfDay(new Date("2026-06-06T00:00:00+08:00")));
    setMounted(true);
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    setError(null);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    try {
      const res = await fetch(
        `/api/applicant-slots?applicantId=${applicantId}&date=${dateStr}`
      );
      if (!res.ok) throw new Error("Failed to load slots");
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setError("Could not load available times.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [applicantId, selectedDate]);

  useEffect(() => {
    if (mounted) fetchSlots();
  }, [fetchSlots, mounted]);

  if (!mounted || !selectedDate) {
    return (
      <div className="space-y-4">
        <Skeleton className="mx-auto h-5 w-48" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.status === "available");

  const navigateDay = (offset: number) => {
    setSelectedSlotId(null);
    setSelectedDate((d) => addDays(d!, offset));
  };

  const handleSelect = (slot: Slot) => {
    setSelectedSlotId(slot.id);
    onSlotSelect({ id: slot.id, startTime: slot.startTime });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateDay(-1)}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </p>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateDay(1)}
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center text-sm text-destructive">
          {error}
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No available slots on this day.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {availableSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => handleSelect(slot)}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                selectedSlotId === slot.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
              )}
              aria-pressed={selectedSlotId === slot.id}
            >
              {format(new Date(slot.startTime), "HH:mm")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

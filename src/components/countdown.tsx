"use client";

import { useEffect, useState } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function calcTimeLeft(target: Date): TimeLeft | null {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-3xl font-bold tabular-nums text-primary sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function Countdown({ target }: { target: Date }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setTimeLeft(calcTimeLeft(target));
    const id = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-4 sm:gap-6">
        {["Days", "Hours", "Min", "Sec"].map((label) => (
          <Digit key={label} value={0} label={label} />
        ))}
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <p className="text-lg font-semibold text-primary">
        Event is happening now!
      </p>
    );
  }

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <Digit value={timeLeft.days} label="Days" />
      <span className="text-2xl text-muted-foreground">:</span>
      <Digit value={timeLeft.hours} label="Hours" />
      <span className="text-2xl text-muted-foreground">:</span>
      <Digit value={timeLeft.minutes} label="Min" />
      <span className="text-2xl text-muted-foreground">:</span>
      <Digit value={timeLeft.seconds} label="Sec" />
    </div>
  );
}

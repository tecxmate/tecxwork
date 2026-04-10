import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Clock, Users, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import { Directory } from "@/components/directory";
import { LogoutButton } from "@/components/logout-button";
import { EVENT_CONFIG } from "@/lib/data";
import { getSession } from "@/lib/auth";

export default async function BrowsePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  if (session.role === "recruiter") redirect("/dashboard");

  const formattedDate = EVENT_CONFIG.date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: EVENT_CONFIG.timezone,
  });

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/browse" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">TecxWork</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground md:inline">
              {session.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Compact hero on mobile, bigger on desktop */}
      <section className="border-b bg-card px-4 py-6 sm:px-6 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl text-center">
          <Badge className="mb-2 sm:mb-4">2026 Event</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {EVENT_CONFIG.name}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:mt-3 sm:text-lg">
            Browse companies and book your interview slot.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:mt-6 sm:gap-x-6 sm:gap-y-3 sm:text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="max-w-[180px] truncate sm:max-w-none">
                {EVENT_CONFIG.location}
              </span>
            </span>
          </div>

          <div className="mt-4 flex justify-center sm:mt-6">
            <Countdown target={EVENT_CONFIG.date} />
          </div>
        </div>
      </section>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <Directory />
        </div>
      </main>

      <Separator />

      <footer className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="font-semibold">Data Protection Notice (PIPA)</p>
                <p className="text-muted-foreground">
                  Your CV link is shared only with the recruiter you book with.
                  All booking data is purged within 2 days after the event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

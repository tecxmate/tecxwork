import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  LogOut,
} from "lucide-react";
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
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: EVENT_CONFIG.timezone,
  });

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/browse" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">TecxWork</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="border-b bg-card px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl text-center">
          <Badge className="mb-4">2026 Recruitment Event</Badge>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {EVENT_CONFIG.name}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
            {EVENT_CONFIG.subtitle} — Browse companies and book your interview
            slot.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {EVENT_CONFIG.location}
            </span>
          </div>

          <div className="mt-8 flex justify-center">
            <Countdown target={EVENT_CONFIG.date} />
          </div>
        </div>
      </section>

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <Directory />
        </div>
      </main>

      <Separator />

      <footer className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">
                  Personal Data Protection Notice (PIPA)
                </p>
                <p className="text-muted-foreground">
                  Your CV link is shared only with the specific recruiter you
                  book with. Google Drive permissions are managed directly
                  between you and the recruiter. All centralized booking data
                  will be permanently purged within 2 days of the event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

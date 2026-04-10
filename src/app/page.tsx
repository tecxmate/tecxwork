import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  Building2,
  ShieldCheck,
  ArrowRight,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Countdown } from "@/components/countdown";
import { EVENT_CONFIG } from "@/lib/data";
import { getSession } from "@/lib/auth";

const ROLES = [
  {
    id: "applicant",
    icon: GraduationCap,
    title: "I'm a Student",
    description:
      "Browse participating companies and book interview slots. Register to also let recruiters discover you.",
    cta: "Sign up",
    primaryHref: "/register",
    secondaryHref: "/login",
    secondaryLabel: "Already have an account? Log in",
  },
  {
    id: "recruiter",
    icon: Building2,
    title: "I'm a Recruiter",
    description:
      "View your scheduled interviews, browse student profiles, and book candidates directly.",
    cta: "Sign up",
    primaryHref: "/recruiter/signup",
    secondaryHref: "/login",
    secondaryLabel: "Already have an account? Log in",
  },
  {
    id: "admin",
    icon: ShieldCheck,
    title: "I'm an Admin",
    description:
      "Manage recruiter access, event settings, and oversee all bookings for the recruitment fair.",
    cta: "Admin Login",
    primaryHref: "/login",
    secondaryHref: null,
    secondaryLabel: null,
  },
] as const;

export default async function Home() {
  // Auto-redirect logged-in users
  const session = await getSession();
  if (session) {
    if (session.role === "admin") redirect("/admin");
    if (session.role === "recruiter") redirect("/dashboard");
    if (session.role === "applicant") redirect("/browse");
  }

  const formattedDate = EVENT_CONFIG.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: EVENT_CONFIG.timezone,
  });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">TecxWork</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {EVENT_CONFIG.location}
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-5xl space-y-10">
          <div className="text-center">
            <p className="text-sm font-medium text-primary">
              {formattedDate}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-5xl">
              {EVENT_CONFIG.name}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
              {EVENT_CONFIG.subtitle}. Choose your role to get started.
            </p>

            <div className="mt-6 flex justify-center">
              <Countdown target={EVENT_CONFIG.date} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {ROLES.map((role) => (
              <Card
                key={role.id}
                className="flex flex-col transition-shadow duration-200 hover:shadow-md"
              >
                <CardHeader className="gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                    <role.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="font-heading text-xl font-semibold">
                    {role.title}
                  </h2>
                  <p className="min-h-[4.5rem] text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-2">
                  <Link
                    href={role.primaryHref}
                    className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {role.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <div className="h-4 text-center">
                    {role.secondaryHref && (
                      <Link
                        href={role.secondaryHref}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {role.secondaryLabel}
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        &copy; 2026 TecxWork &middot; PIPA compliant
      </footer>
    </div>
  );
}

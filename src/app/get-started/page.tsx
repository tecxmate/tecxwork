import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  Building2,
  ShieldCheck,
  ArrowRight,
  Users,
  ArrowLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";

type Role = {
  id: string;
  icon: typeof GraduationCap;
  title: string;
  description: string;
  loginHref: string;
  signupHref: string | null;
};

const ROLES: Role[] = [
  {
    id: "applicant",
    icon: GraduationCap,
    title: "I'm a Student",
    description:
      "Browse participating companies and book interview slots. Register to also let recruiters discover you.",
    loginHref: "/login",
    signupHref: "/register",
  },
  {
    id: "recruiter",
    icon: Building2,
    title: "I'm a Recruiter",
    description:
      "View your scheduled interviews, browse student profiles, and book candidates directly.",
    loginHref: "/login",
    signupHref: "/recruiter/signup",
  },
  {
    id: "admin",
    icon: ShieldCheck,
    title: "I'm an Admin",
    description:
      "Manage recruiter access, event settings, and oversee all bookings for the recruitment fair.",
    loginHref: "/login",
    signupHref: null,
  },
];

export default async function GetStartedPage() {
  // Auto-redirect logged-in users
  const session = await getSession();
  if (session) {
    if (session.role === "admin") redirect("/admin");
    if (session.role === "recruiter") redirect("/dashboard");
    if (session.role === "applicant") redirect("/browse");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Sign Up for TECXWORK
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Choose your role to get started
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {ROLES.map((role) => (
              <Card
                key={role.id}
                className="flex flex-col gap-4 p-5 transition-shadow duration-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                  <role.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold">
                    {role.title}
                  </h2>
                  <p className="mt-1 min-h-[4.5rem] text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </div>

                <div className="mt-auto flex flex-col gap-2">
                  <Link
                    href={role.loginHref}
                    className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Log In
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  {role.signupHref ? (
                    <Link
                      href={role.signupHref}
                      className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      Sign Up
                    </Link>
                  ) : (
                    <div className="flex h-10 items-center justify-center text-xs text-muted-foreground">
                      Contact admin for access
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

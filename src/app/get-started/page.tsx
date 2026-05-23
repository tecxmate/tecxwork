import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  Building2,
  ShieldCheck,
  ArrowRight,
  Users,
  ArrowLeft,
  Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { StudentLanguageSwitcher } from "@/components/student-language-switcher";
import { getSession } from "@/lib/auth";
import { getStudentLocale } from "@/lib/student-locale.server";
import { getStudentMessages } from "@/lib/student-messages";

type Role = {
  id: string;
  icon: typeof GraduationCap;
  title: string;
  description: string;
  browseHref?: string;
  browseLabel?: string;
  loginHref: string;
  signupHref: string | null;
};

export default async function GetStartedPage() {
  // Auto-redirect logged-in users
  const session = await getSession();
  const locale = await getStudentLocale();
  const messages = getStudentMessages(locale);
  if (session) {
    if (session.role === "admin") redirect("/admin");
    if (session.role === "recruiter") redirect("/dashboard/interviews");
    if (session.role === "professional") redirect("/professional/dashboard");
    if (session.role === "applicant") redirect("/browse");
  }

  const roles: Role[] = [
    {
      id: "applicant",
      icon: GraduationCap,
      title: messages.getStarted.studentTitle,
      description: messages.getStarted.studentDescription,
      browseHref: "/browse",
      browseLabel: messages.common.browseCompanies,
      loginHref: "/login",
      signupHref: "/register",
    },
    {
      id: "professional",
      icon: Briefcase,
      title: messages.getStarted.professionalTitle,
      description: messages.getStarted.professionalDescription,
      loginHref: "/login",
      signupHref: "/professional/signup",
    },
    {
      id: "recruiter",
      icon: Building2,
      title: messages.getStarted.recruiterTitle,
      description: messages.getStarted.recruiterDescription,
      loginHref: "/login",
      signupHref: "/recruiter/signup",
    },
    {
      id: "admin",
      icon: ShieldCheck,
      title: messages.getStarted.adminTitle,
      description: messages.getStarted.adminDescription,
      loginHref: "/login",
      signupHref: null,
    },
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="h-[env(safe-area-inset-top)] bg-primary md:hidden" />
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {messages.common.back}
          </Link>
          <div className="ml-auto">
            <StudentLanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {messages.getStarted.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {messages.getStarted.subtitle}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
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
                  {role.browseHref ? (
                    <Link
                      href={role.browseHref}
                      className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {role.browseLabel ?? "Browse"}
                    </Link>
                  ) : null}
                  <Link
                    href={role.loginHref}
                    className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {messages.common.logIn}
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  {role.signupHref ? (
                    <Link
                      href={role.signupHref}
                      className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {messages.common.signUp}
                    </Link>
                  ) : (
                    <div className="flex h-10 items-center justify-center text-xs text-muted-foreground">
                      {messages.getStarted.contactAdmin}
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

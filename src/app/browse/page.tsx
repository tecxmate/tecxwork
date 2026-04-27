import Link from "next/link";
import { redirect } from "next/navigation";
import { AppTopBar } from "@/components/app-topbar";
import { LogoutButton } from "@/components/logout-button";
import { Directory } from "@/components/directory";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";
import { getStudentLocale } from "@/lib/student-locale.server";
import { getStudentMessages } from "@/lib/student-messages";

export default async function BrowsePage() {
  const session = await getSession();
  const locale = await getStudentLocale();
  const messages = getStudentMessages(locale);
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "recruiter") redirect("/dashboard/interviews");

  return (
    <div className="flex flex-1 flex-col">
      <AppTopBar
        href="/browse"
        navRole={session?.role ?? "guest"}
        currentPath="/browse"
        desktopActions={
          session ? (
            <LogoutButton />
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
              >
                {messages.common.logIn}
              </Link>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:text-sm"
              >
                {messages.common.signUp}
              </Link>
            </>
          )
        }
      />

      <section className="border-b bg-card px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {messages.browsePage.title}
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
            {messages.browsePage.subtitle}
          </p>
        </div>
      </section>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <Directory />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

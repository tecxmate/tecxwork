import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppTopBar } from "@/components/app-topbar";
import { LogoutButton } from "@/components/logout-button";
import { Separator } from "@/components/ui/separator";
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
  if (session?.role === "recruiter") redirect("/dashboard");

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

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <Directory />
        </div>
      </main>

      <Separator />

      <div className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="font-semibold">{messages.browsePage.pipaTitle}</p>
                <p className="text-muted-foreground">
                  {messages.browsePage.pipaBody}
                </p>
                {!session && (
                  <p className="text-muted-foreground">
                    {messages.browsePage.guestHint}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

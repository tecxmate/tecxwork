import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppTopBar } from "@/components/app-topbar";
import { Separator } from "@/components/ui/separator";
import { Directory } from "@/components/directory";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";

export default async function BrowsePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  if (session.role === "recruiter") redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col">
      <AppTopBar
        href="/browse"
        desktopActions={
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 sm:text-sm"
          >
            My Profile
          </Link>
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
                <p className="font-semibold">Data Protection Notice (PIPA)</p>
                <p className="text-muted-foreground">
                  Your CV link is shared only with the recruiter you book with.
                  All booking data is purged within 2 days after the event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

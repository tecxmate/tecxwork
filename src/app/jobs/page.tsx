import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/site-footer";
import { JobDirectory } from "@/components/job-directory";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Job Opportunities | V-GEN TRIDENT",
  description:
    "Browse part-time and full-time job opportunities in Taiwan for Vietnamese students",
};

export default function JobsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-wordmark text-xl text-primary italic">tecxwork</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 sm:text-sm"
            >
              Career Fair
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:text-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b bg-card px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl text-center">
          <Badge className="mb-2 sm:mb-4">Job Board</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Jobs for Vietnamese in Taiwan
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
            Browse part-time and full-time opportunities from Taiwan&apos;s top
            job platforms. Click &ldquo;Apply&rdquo; to apply directly on the
            original site.
          </p>
        </div>
      </section>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <JobDirectory />
        </div>
      </main>

      <div className="border-t bg-muted/30 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-xs text-muted-foreground">
            Job data provided by{" "}
            <a
              href="https://www.1111.com.tw"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              1111 Job Bank
            </a>
            . Click &ldquo;Apply&rdquo; to view full details and submit your
            application on the original platform.
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * 404.
 *
 * Without this, a missing page falls through to Next's own default — unstyled, unbranded,
 * and a dead end. The route-level error boundary already covers pages that *throw*; this is
 * the other half, and the two deliberately read the same way: say what happened, do not
 * blame the person, and offer somewhere to go.
 *
 * The destinations are the ones that are safe for anyone: a signed-out visitor, a candidate
 * and a recruiter can all use them. `/dashboard` is deliberately absent — offering it to a
 * signed-out visitor produces a second dead end at the login redirect.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Compass className="h-6 w-6" />
        </span>
        <h1 className="font-heading text-xl font-bold text-foreground">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be out of date, or the page may have moved. Nothing is wrong with your
          account.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Go home
          </Link>
          <Link
            href="/jobs"
            className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Browse jobs
          </Link>
        </div>
      </div>
    </main>
  );
}

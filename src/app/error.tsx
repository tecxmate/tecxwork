"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

/**
 * Route-level error boundary.
 *
 * Without this a thrown render error shows Next's own error screen, which tells a recruiter
 * nothing and offers no way out. The `digest` is the id Next also writes into the server log,
 * so quoting it in a support message ties the report to the actual stack trace.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side errors never reach onRequestError, so report them here too.
    console.error(
      JSON.stringify({
        level: "error",
        at: new Date().toISOString(),
        source: "client",
        message: error.message,
        digest: error.digest ?? null,
        path: typeof window !== "undefined" ? window.location.pathname : null,
      })
    );
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Something went wrong on this page
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing you did caused this, and nothing you had already saved was lost. Try again —
          if it keeps happening, send us the reference below.
        </p>

        {error.digest ? (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            <RotateCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/feedback"
            className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Report the problem
          </Link>
        </div>
      </div>
    </main>
  );
}

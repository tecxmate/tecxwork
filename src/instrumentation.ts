/**
 * Server error reporting.
 *
 * Before this, an unhandled error surfaced as a Next error page and nobody found out — on
 * event day that means a recruiter hits a 500 mid-booking and the first you hear of it is a
 * phone call. Next calls `onRequestError` for every uncaught server error, so this is the one
 * place that sees all of them.
 *
 * Two transports, both optional and neither requiring an account to be useful today:
 *
 *   1. A structured single-line JSON log. Vercel indexes these, so you can search or alert on
 *      `level:"error"` without integrating anything.
 *   2. A POST to ERROR_WEBHOOK_URL if set — point it at Slack, Discord, or anything that
 *      accepts JSON, and errors arrive where someone will actually see them.
 *
 * Deliberately not wired to a specific vendor SDK: an unconfigured Sentry install is dead
 * weight, and a webhook covers the "tell someone" requirement with no signup.
 */

type ErrorContext = {
  routerKind: string;
  routePath: string;
  routeType: string;
};

const WEBHOOK_TIMEOUT_MS = 3000;

/** Strip anything that could carry candidate PII out of the reported URL. */
function safePath(url: string | undefined): string {
  if (!url) return "(unknown)";
  try {
    const parsed = new URL(url, "http://local");
    // query strings on this app carry search terms and ids; the path is enough to locate a bug
    return parsed.pathname;
  } catch {
    return url.split("?")[0];
  }
}

export async function onRequestError(
  err: unknown,
  request: {
    path?: string;
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
  },
  context: ErrorContext
): Promise<void> {
  const error = err instanceof Error ? err : new Error(String(err));

  const payload = {
    level: "error" as const,
    at: new Date().toISOString(),
    message: error.message,
    name: error.name,
    // first few frames only — enough to locate it, short enough to read in a log line
    stack: error.stack?.split("\n").slice(0, 6).join(" | "),
    path: safePath(request.path),
    method: request.method ?? "(unknown)",
    routePath: context.routePath,
    routeType: context.routeType,
  };

  // Always log. This is the transport that works with no configuration at all.
  console.error(JSON.stringify(payload));

  const webhook = process.env.ERROR_WEBHOOK_URL;
  if (!webhook) return;

  // Never let reporting failure become a second failure: time-bound it and swallow errors.
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🔴 ${payload.name}: ${payload.message}\n${payload.method} ${payload.path} (${payload.routeType})`,
        ...payload,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch {
    // A dead webhook must not turn one error into two.
  }
}

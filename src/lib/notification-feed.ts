"use client";

/**
 * One notification poller for the whole page, awake only while somebody is looking.
 *
 * WHY THIS IS NOT JUST A useEffect IN THE COMPONENT.
 *
 * Neon bills compute by CU-hours: the compute's size multiplied by the time it is
 * AWAKE, not by how many queries it answers. An idle compute suspends after a few
 * minutes and stops billing. So the expensive thing an app can do is not a slow
 * query — it is a heartbeat that never lets the database go idle.
 *
 * The bell had one. `setInterval(fetch, 60_000)` inside the component, and:
 *
 *   - The bell renders in BOTH the top bar and the sidebar footer. At every
 *     viewport one of the two is hidden by CSS — but hidden is still mounted, and
 *     a mounted interval still fires. Measured in Chromium at 1440px and at 390px:
 *     two bells mounted, one visible, and 6 requests to /api/notifications in 190
 *     seconds. Two pollers, one bell, twice the traffic, no benefit.
 *
 *   - Nothing stopped it when the tab was not being looked at. Chromium happens to
 *     throttle background timers hard (measured: 0 requests in 190s hidden), but
 *     that is the browser's mercy, not the app's design — Safari's throttling
 *     differs, and a tab that is VISIBLE but unattended (a dashboard parked on a
 *     second monitor) is throttled by nobody. That tab pins the compute awake for
 *     as long as it is open.
 *
 * So: one module-level poller shared by every bell on the page, which runs only
 * while the document is visible AND somebody has interacted recently. Coming back
 * fetches immediately, so nothing is ever staler than the moment you looked at it.
 *
 * What is deliberately NOT changed is the 60-second interval. The billed quantity
 * is awake time, and while somebody is actively using the app the compute is awake
 * regardless of the bell — so a longer interval would trade freshness for nearly
 * nothing. The saving is entirely in not polling when nobody is there.
 */

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: { url?: string };
};

export type NotificationFeed = {
  notifications: NotificationItem[];
  unreadCount: number;
};

const POLL_MS = 60_000;

/**
 * How long a tab may sit untouched before the poller stops. Long enough to cover
 * reading a long page or taking a call; short enough that a dashboard left open
 * over a weekend costs one poll, not three thousand.
 */
const IDLE_AFTER_MS = 15 * 60_000;

const EMPTY: NotificationFeed = { notifications: [], unreadCount: 0 };

let feed: NotificationFeed = EMPTY;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let lastActivity = Date.now();
let inFlight: Promise<void> | null = null;
let listening = false;

function emit() {
  for (const l of listeners) l();
}

/** Server state, so every subscriber renders the same empty feed before hydration. */
export function getServerSnapshot(): NotificationFeed {
  return EMPTY;
}

export function getSnapshot(): NotificationFeed {
  return feed;
}

/** Apply a local change (mark-as-read) without waiting for the next poll. */
export function patchFeed(next: NotificationFeed) {
  feed = next;
  emit();
}

function attended(): boolean {
  if (typeof document === "undefined") return false;
  if (document.visibilityState !== "visible") return false;
  return Date.now() - lastActivity < IDLE_AFTER_MS;
}

async function refresh() {
  // One request even if several bells ask at once — the two mounted bells used to
  // issue two identical requests a few milliseconds apart.
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      feed = {
        notifications: data.notifications ?? [],
        unreadCount: data.unreadCount ?? 0,
      };
      emit();
    } catch {
      // A failed poll is not worth surfacing; the next one will try again.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

function tick() {
  if (attended()) void refresh();
  else stopTimer();
}

function startTimer() {
  if (timer !== null) return;
  timer = setInterval(tick, POLL_MS);
}

function stopTimer() {
  if (timer === null) return;
  clearInterval(timer);
  timer = null;
}

/**
 * Wake on any sign of a person, and fetch straight away if the poller had stopped.
 * `passive` and `capture` so this never interferes with the handlers that matter.
 */
function onActivity() {
  // The listeners outlive the last bell — they are registered once and never torn
  // down — so without this guard a click on a page with no bell mounted would
  // restart the poller and run it forever with nobody subscribed.
  if (listeners.size === 0) return;
  const wasIdle = timer === null;
  lastActivity = Date.now();
  if (document.visibilityState !== "visible") return;
  if (wasIdle) {
    void refresh();
    startTimer();
  }
}

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "focus", "scroll"] as const;

function listen() {
  if (listening || typeof document === "undefined") return;
  listening = true;
  for (const e of ACTIVITY_EVENTS) {
    window.addEventListener(e, onActivity, { passive: true, capture: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") onActivity();
    else stopTimer();
  });
  // Deliberately never removed: the bells live in the app shell, so tearing the
  // listeners down and re-adding them on every navigation would cost more than
  // leaving four passive handlers in place. onActivity() is inert with no
  // subscribers, which is what makes that safe.
}

/** Subscribe a bell. The first one starts the poller; the last one stops it. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    listen();
    lastActivity = Date.now();
    void refresh();
    startTimer();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopTimer();
  };
}

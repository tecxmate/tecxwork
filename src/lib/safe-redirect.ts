/**
 * Sanitise a `?next=` destination.
 *
 * A post-login redirect taken straight from the query string is an open redirect: an
 * attacker mails `/login?next=https://evil.example` and the victim is bounced off the real
 * site immediately after authenticating, on a page that looked entirely legitimate.
 *
 * Only same-site absolute paths survive. In particular `//evil.example` is rejected — a
 * protocol-relative URL starts with a slash and would otherwise pass a naive
 * `startsWith("/")` check, which is the usual way this bug ships.
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback: string
): string {
  if (!next) return fallback;

  const value = next.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  // `/\evil.example` is treated as protocol-relative by some browsers.
  if (value.startsWith("/\\")) return fallback;
  // Control characters and whitespace can smuggle a scheme past the checks above, because
  // browsers strip some of them before parsing the URL.
  // Checked by code point rather than by regex so the intent survives copy-paste —
  // a literal control character inside a character class is invisible in a diff.
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code <= 0x20 || code === 0x7f) return fallback;
  }

  return value;
}

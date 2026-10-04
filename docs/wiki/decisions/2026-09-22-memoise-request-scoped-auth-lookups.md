---
title: Memoise auth and tenancy per request, keyed on an identifier and never on the cookie
type: decision
slug: 2026-09-22-memoise-request-scoped-auth-lookups
date: 2026-09-22
updated: 2026-09-22
attributed_to: [claude-code]
belongs_to: [request-memoisation, tecxwork]
source: observation
status: active
tags: [performance, neon, auth, security, caching]
related: [request-memoisation, architecture-overview, testing]
---

## Context

[niko] asked for the system to be optimised, without naming a target. So the
target was measured rather than guessed: a local Postgres 16 with
`log_statement=all`, the Yang Luck demo seed, the production build, and a script
that brackets each HTTP request with marker queries and counts the statements
between them.

What that found, on thirteen dashboard pages signed in as the agency recruiter:
**280 statements per page-load set, of which roughly half were exact repeats**,
and every repeat was auth or tenancy context. `/dashboard/clients` read the
session row six times and the recruiter row four times in one render.

It also found what was *not* wrong, which mattered for scoping: no N+1 in any
request path (the only awaited-query-in-a-loop sites are seed scripts), and the
loaders already run concurrently across several connections. The problem was
duplication, not serialisation or fan-out.

## Why the duplication exists

It is a consequence of a deliberate, good property: every loader resolves its own
auth, so it is safe to call from anywhere. That is what stops a page from
rendering rows the equivalent route would have refused — the failure
`agency-auth.ts` documents at length. Nobody should unpick it.

Memoising the lookups keeps the property and removes its cost.

## The decision

Add `src/lib/request-cache.ts`: `cache()`-wrapped reads for session expiry, the
caller's recruiter row, their membership, and the org, and route the existing
helpers through it. Also collapse two reads of the *same* recruiter row — id by
`user_id`, then `clientKind`/`orgId` back by that id — into one.

**Keyed on an identifier, never on ambient request state.** Every memo takes the
id it looks up as an argument and none of them read cookies or headers. This is
not stylistic. A memo keyed on nothing would, if React's per-request scope ever
failed to hold, hand the first request's session to the second — and every test
written with one account would pass. Keyed on an id, the worst a scope bug can
leak is the answer to "is session `<uuid>` live" for a uuid the caller already
held.

Consequently `getSession()` is not itself memoised — it reads the cookie and
verifies the signature every time, and shares only the row check. Nor is
`getMember()`; the two lookups inside it are, and they now run as a pair rather
than in sequence.

`src/test/request-cache.test.ts` pins the rule by parsing the module and failing
on any `cache(async () => …)` with an empty parameter list. That test was checked
by adding such a memo and watching it fail, then removing it.

## Result

280 → 133 statements across the thirteen pages (−52%); `/dashboard/clients` 28 → 12,
`/dashboard/placements` 30 → 14. The rendered RSC payload is byte-identical
before and after.

## What was deliberately not done

- **No speculative fetch.** The session check and the recruiter lookup could run
  in parallel, since the user id is in the verified token — but that issues a
  query for invalid sessions, which is a small amplification gift to anyone
  replaying a dead cookie. One round trip is not worth it.
- **No cross-request caching of anything auth-shaped.** Revocation has to bite on
  the next request, and any TTL is a window where it does not.
- **The loaders were left as they are.** They each resolve their own auth on
  purpose; making them share a resolved context by passing it around would undo
  the property that keeps pages and routes in agreement.

---
title: Per-request memoisation of auth and tenancy lookups
type: topic
slug: request-memoisation
date: 2026-09-22
updated: 2026-09-22
attributed_to: [claude-code]
belongs_to: [tecxwork]
source: observation
status: active
tags: [performance, neon, auth, tenancy, caching, react-cache]
related: [2026-09-22-memoise-request-scoped-auth-lookups, architecture-overview, drizzle-sql-gotchas, testing]
---

## What it is

`src/lib/request-cache.ts` — a small set of `cache()`-wrapped reads for the facts
every page and route needs before it can do anything else: is this session live,
which recruiter is this user, what org are they in, is that org paid up.

It exists because those facts were being re-fetched by every loader that needed
them. Measured on a local Postgres with `log_statement=all`, signed in as the
Yang Luck agency recruiter, one render of `/dashboard/clients` issued **28
statements of which only 13 were distinct** — the session row was read six times,
the recruiter row four.

## The numbers

Statements per page load, warm, same account, same seed data:

| page | before | after |
|---|---:|---:|
| `/dashboard` | 6 | 4 |
| `/dashboard/pipeline` | 21 | 11 |
| `/dashboard/clients` | 28 | 12 |
| `/dashboard/reports` | 22 | 11 |
| `/dashboard/jobs` | 15 | 7 |
| `/dashboard/candidates` | 27 | 14 |
| `/dashboard/applicants` | 15 | 7 |
| `/dashboard/interviews` | 15 | 7 |
| `/dashboard/billing` | 24 | 11 |
| `/dashboard/placements` | 30 | 14 |
| `/dashboard/offers` | 24 | 11 |
| `/dashboard/compliance` | 28 | 12 |
| `/dashboard/team` | 25 | 12 |
| **total** | **280** | **133** |

−52%. On a local socket that buys nothing measurable. It is worth doing because
production is Vercel `sin1` talking to Neon over a WebSocket, where each of those
is a round trip, and the repeats sit on the critical path — every loader awaits
its own auth before it queries anything, so they are latency the page pays before
rendering rather than throughput it can absorb.

## The keying rule

**Every memo takes the identifier it looks up as an argument. None of them read
the cookie or the headers.**

This is the whole safety story, and `src/test/request-cache.test.ts` fails the
build if a new memo breaks it. A memo keyed on *nothing* —
`cache(() => readTheCookieAndLookItUp())` — would, if React's per-request scope
ever failed to hold, serve the first request's session to the second. Every test
written with a single account would still pass. Keyed on an identifier, the worst
a scope bug could do is answer "is session `<uuid>` live" for a uuid the caller
already had.

So `getSession()` itself is **not** memoised: it reads the cookie and verifies the
signature every time, and only the "is this row still there" round trip is shared.
Likewise `getMember()` is not memoised; the two lookups inside it are.

## What it is not

Not a data cache. `cache()` lasts one server request and is dropped. Nothing
survives into the next request and nothing is shared between users. Revocation
still bites on the next request, which is what it always meant — the previous
behaviour re-read the same row several times *within* one request that had
already been admitted, which never caught anything.

## How it was verified

- **400 requests, 4 users, 40-way concurrency**, each response checked against the
  cookie that asked for it: zero cross-user leaks, zero identity mismatches.
- **150 interleaved concurrent page loads, 3 users**, hashing the rendered body:
  no body ever served to more than one identity.
- **Revocation and expiry** still take effect on the next request; other users
  unaffected; protected routes still 401.
- **Output unchanged.** The rendered RSC payload is byte-identical before and
  after, reconstructed from the streamed chunks and compared. The raw HTML can
  differ by a few dozen bytes because the stream resolves in a different order
  once a memoised lookup returns without awaiting a query — same content, different
  chunk boundaries.
- Full suite: 302 tests, 24 files, against a real Postgres.

## Gotcha worth knowing

`src/app/api/__probe` never routed. The App Router treats a `_`-prefixed folder as
private, so a throwaway probe route under `__probe` 404s silently. Name temporary
routes without the underscore.

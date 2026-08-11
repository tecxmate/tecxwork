---
title: Platform Manual (screens & functions)
type: topic
slug: platform-manual
date: 2026-08-08
updated: 2026-08-11
attributed_to: [niko]
belongs_to: [tecxwork, recruitment-workflows]
source: chat
status: active
tags: [documentation, onboarding, demo]
related: [recruiter-dashboard, admin-panel, recruitment-workflows, event-time-config, neon-account-topology]
---

## What this is

A comprehensive, workflow-driven operating manual covering **every screen and function**
of the platform across all four roles. Built 2026-08-08 at niko's request, serving three
audiences at once: end-user onboarding, investor/partner product tour, and internal handover.

**Live:** https://yangluck.tecxmate.com/documentation — linked from the site footer.
**In repo:** `public/documentation.html` (7.7 MB, 51 screenshots inlined as base64 WebP;
works served *and* offline). Trilingual EN / 繁中 / VN. See `docs/manual/README.md`.
**Public build strips `data-internal` blocks** — and their strings in the i18n dictionary,
not just their DOM nodes.
**Artifact:** https://claude.ai/code/artifact/dc62f299-3a37-43be-86e9-99e93d412d9e
**Source:** `docs/manual/src/manual.src.html` + `src/build.py` — placeholders
`{{IMG:name}}` / `{{IMG_BARE:name}}` are substituted with base64 WebP at build time, so the
editable source stays readable and diffable. `src/capture-all.mjs` re-captures the screenshots.

## Structure (chosen over screen-by-screen)

A **"Start here" band** comes first, so a cold reader has context before Act 1 (added on
niko's feedback that the entry experience must stand alone):

1. **How to read this manual** — three reader routes with time estimates, plus a legend for
   the repeating four-part screen anatomy (step · route · purpose · screenshot · controls).
2. **What the platform is** — leads with the agency business model, then a four-parties table.
3. **How a placement actually happens** — the lifecycle diagram (see below).
4. **Vocabulary** — 14 terms: job order, submission, placement, slot, ARC, work permit, PIPA…
5. Roles & access matrix · 6. Full screen map.

Then four "Acts" following real end-to-end journeys, not route order:

1. **Applicant** (14 steps) — arrive → sign up → 8-tab profile → browse → job detail →
   company page → pick slot → CV + PIPA consent → submitted → track.
2. **Employer / client-company recruiter** (6) — signup+approval → post job → full job form
   → company profile → applicant triage → interview-day run sheet.
3. **Agency / ATS** (6) — pipeline board → candidate drawer → client switching → client
   accounts → compliance → reports.
4. **Admin** (6) — all bookings → job moderation → moderate one job → applicant registry →
   recruiter registry → 6-tab settings.

Plus orientation (roles/access matrix, full screen map) and reference (i18n, notifications,
PIPA, known gaps).

## The lifecycle diagram

Hand-authored inline SVG (no library). Its single claim: **one Apply creates two records** —
an interview booking (the employer's, ends when the interview happens) and a pipeline card
(the agency's, runs for weeks) — joined by "same candidate, no shared status field", both
converging on Hired. Admin actions appear as gates on the setup band above.

Three things that cost time and will again:

- `.diagram` must override the generic `figure{display:flex}` rule, or the SVG collapses to
  its intrinsic size (422px) and the caption sits beside it instead of below.
- A CSS `text-anchor` declared in a class **beats** the SVG `text-anchor="start"` presentation
  attribute. Four labels were silently centred on their own arrow lines. Use inline `style`.
- Inline SVG resolves CSS custom properties (`fill="var(--r-agency)"`), so the diagram themes
  light/dark for free — no duplicate markup.

## Key framing established

**"Two products, one codebase."** The marketplace side (browse/apply/book a real 30-min
slot) and the ATS side (5-stage pipeline scoped per client company). This distinction
explains the navigation split and is the manual's organising thesis.

**Two recruiter surfaces, one role.** Client-company and agency accounts are both
`recruiter`; Clients / Compliance / Reports render only for the agency account. Documented
explicitly because "missing tabs" reads as a bug otherwise.

**Bookings ≠ pipeline stages.** Deliberately separate systems that meet on the candidate,
not in one status field.

## Capture method (reproducible)

- 56 screenshots via Playwright (`playwright-core` + the ms-playwright chromium-1234 build;
  the bundled headless-shell version mismatches — pass `executablePath` to the full Chrome
  for Testing binary).
- Logged in per role via `ctx.request.post('/api/auth/login')` — the session cookie sticks
  to the browser context, so no form driving needed.
- Next.js dev overlay hidden via `ctx.addInitScript` injecting
  `nextjs-portal,[data-nextjs-toast]{display:none}` — otherwise the "1 Issue" badge lands
  in every screenshot.
- Images: 1320px wide WebP q76 → 2.86 MB for 56, ~3.8 MB as base64. (JPEG q74 was 4.6 MB;
  WebP is worth it for the artifact's 16 MB budget.) Final page 3.53 MB with 51 embedded.

See [[demo-db-manual-capture]] for the database work this required.

## 2026-08-11 refresh — the stale-manual debt paid

The 08-09 log flagged the published manual as out of date (billing, credit notes, candidate
search absent; all recruiter screenshots showing the pre-sidebar nav). This refresh:

- **Act 3 grew from 6 to 11 screens**: candidate search, offers, placements, billing and the
  stage editor added; compliance gained the stored-artifact story; reports became "Reports &
  exports" documenting the Employer-Pays and 評鑑 exports. Screen map +5 routes. 56 screens.
- **Every screenshot re-captured** (62 shot, 56 used) from a **fully local demo world**:
  local Postgres + the seeds + a new `seed-yang-luck-billing.ts` covering fee rates, offers,
  invoices and a credit note — the layer the 08-09 sessions had only created by hand.
- **Decks regenerated**: 48 slides × en/zh/vi (was 43), new sections flowing in from the
  shared markup. 79 new strings translated into 繁中 and Tiếng Việt.
- **The capture/check tooling is now portable** — the Playwright scripts carried one
  machine's absolute paths; they now resolve browser, output and playwright from env, and
  check-lightbox derives the gallery count instead of hardcoding 51.

Verified: build.py clean (8.42 MB, i18n 1144×3 enforced), all four checkers pass. Caveat:
WebKit cannot be downloaded in the CCR container, so check-anchors and check-mobile-nav ran
under Chromium — the README notes the anchor check passes vacuously there. Re-run both on a
machine with WebKit before treating those two as fully verified.

**Capture gotchas that cost time (so the next run doesn't pay them):**
1. `EVENT_CONFIG.date` in `src/lib/data.ts` is **hardcoded** (June 6) and the applicant slot
   picker keys on it — not on the admin-configured `event_config` row. Demo slots must sit
   on that date for the apply flow to capture. This is the manual's own known-gaps bug,
   still live.
2. `seed-yang-luck.ts` reset **fails against a billing-seeded world**: offers/invoices FK
   applications, and the seed's deletes predate the ATS tables. Reset order needs the ATS
   layer cleared first — or drop/recreate the schema.
3. The event-config runtime cache survives a dev-server restart; a SQL date change alone
   does not reach the picker.

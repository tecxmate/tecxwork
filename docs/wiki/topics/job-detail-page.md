---
title: Job detail page (/jobs/[id])
type: topic
slug: job-detail-page
date: 2026-07-27
updated: 2026-07-27
attributed_to: [niko]
belongs_to: [tecxwork]
source: chat
status: active
tags: [frontend, seo, ux]
related: [seo, design-system, public-homepage]
---

## What it is

The public job posting page at `/jobs/[id]`. Server component (`src/app/jobs/[id]/page.tsx`) that
loads the opening + recruiter, emits `JobPosting` JSON-LD, and renders `JobDetailApply` — a client
component owning the three-step apply flow (`details` → `pick-slot` → `booking-form`).

## Layout (as of 2026-07-27)

Two columns on `lg+`, `minmax(0,1fr) 20rem`, container `max-w-6xl`:

- **Left — the job content.** Title, company, location/type line, then Summary / Responsibilities /
  Requirements / Benefits, then the JD link. This is the primary reading column because Latin and
  Vietnamese readers scan left-to-right; the job itself must be the first thing under the eye.
- **Right — supporting panel** (sticky on desktop, stacks below on mobile): salary + apply CTA +
  deadline, an "About the company" card linking to `/recruiter/[id]`, and a "General information"
  fact list (location, employment type, workplace, category, seniority, visa support, language).

Rendering lives in `src/components/job-detail-content.tsx`. It reuses `TextBlock` (exported from
`recruiter-job-posting-card.tsx`) so list/paragraph parsing stays identical between the job board
cards and the detail page.

Reference points niko gave: a job-board detail screenshot and
<https://tuyendungviettrien.com/viec-lam/ke-toan-truong-1782868345700/>.

## Related jobs / internal linking

`src/components/related-jobs.tsx` renders under the posting (passed into `JobDetailApply` as
`footer` so it is hidden while the user is picking a slot or filling the booking form).

Selection (`getRelatedJobs` in the page): approved openings, excluding the current one, matching the
same recruiter **or** the same job category, newest first, capped at 6 — topped up with the newest
approved openings when the board is sparse so the block is never empty.

Backlinks emitted: one per related job (`/jobs/<id>`), the category page
(`/jobs/cat/<slug>`, falling back to `/jobs`), and the recruiter profile (`/recruiter/<id>`).
Purpose is twofold — keep candidates browsing instead of bouncing, and give crawlers dense internal
links between job pages, category pages, and company pages (see [seo](seo.md)).

## i18n

New `jobDetail` message block in `src/messages/student/{en,vi,zh-TW}.ts` (vi and zh-TW spread the en
block then override). Existing `jobsPage.card.*` labels are still reused for the section headings.

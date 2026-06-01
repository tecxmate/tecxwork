---
title: Recruitment Workflows & Booking Engine
type: topic
slug: recruitment-workflows
date: 2026-05-04
updated: 2026-06-01
attributed_to: [niko]
belongs_to: [tecxmate]
source: document
status: active
tags: [workflow, booking, slots, admin, recruiter, student]
related: [tecxwork, v-gen-trident-2026, 2026-05-12-linkedin-style-job-apply-flow]
---

## 1. Student Workflow
1. **Registration**: Profile creation with name, major, skills, and Google Drive CV link.
   - Candidate idea: add consent-based CV autofill from LinkedIn-derived data. Official LinkedIn APIs are permission-gated; the safer near-term flow is student upload/paste of their own LinkedIn export/profile PDF/text, then parse into editable CV fields.
   - Student CV export is available from `/profile`: students can preview a polished CV generated from profile data and export it through the browser print/Save as PDF flow, with the main-logo `tecxwork` wordmark font preserved in the print window.
2. **Discovery**: Browse recruiter directory by industry or position, or browse recruiter-posted jobs.
3. **Job-level apply**: Clicking a job opens that job's detail page with an immediate apply action. Company logos/names on job cards link to the company page for browsing all jobs from that recruiter.
4. **Booking**: Select 15-minute slots on the event calendar.
5. **Interview**: Attend physical or virtual session at the booked time.

## 2. Recruiter Workflow
1. **Onboarding**: Set up company profile and job openings.
2. **Scheduling**: Set availability and manage generated interview slots.
3. **Discovery**: (Optional) Browse applicant profiles and invite candidates to interview ("Reverse Booking").
4. **Review**: Access student CVs via shared Google Drive links for booked candidates.

## 3. Admin Workflow
1. **Configuration**: Set event name, dates, and booking mode.
2. **Moderation**: Approve or reject recruiter job postings.
3. **Controls**: Lock/Unlock booking modes, manage allowed email domains for recruiters.
4. **Oversight**: Real-time stats on registrations and booking volume.

## Booking Modes
- **Applicants book Recruiters**: Traditional job fair flow.
- **Recruiters book Applicants**: Talent search flow.
- **Bidirectional**: Both flows active simultaneously.

## Job Moderation
- **Mode 1: Review Required**: Every recruiter job must be manually approved by an admin before becoming public.
- **Mode 2: Instant Publish**: Recruiters can publish jobs directly without admin intervention.

## History
- 2026-06-01: Investigated a student report that tapping Accept on the mobile recruiter page appeared to do nothing. Live DB still showed the SSB proposal as `reschedule_proposed`, and `booking_reschedule_logs` was empty, so the accept did not complete through the currently deployed logged route. Code audit found a UX bug regardless: proposal response errors were only rendered in the desktop detail panel, not the mobile job card shown to the student. Mobile and desktop now show success/error notices, the fetch handler catches network failures, and the button state is always cleared in `finally`.
- 2026-06-01: Fixed accepted-reschedule confirmation emails rendering raw UTC database timestamps such as `2026-06-06 07:30:00+00`, which students read as 7:30 AM. Root cause: raw SQL `RETURNING start_time` can provide timestamp strings, and `sendBookingEmails()` called `.toLocaleString()` on the value without first coercing it to `Date`; strings return themselves. Email and notification formatting now accept `Date | string`, normalize valid timestamp strings to `Date`, and render in Asia/Taipei.
- 2026-06-01: Audited the booking reschedule flow after Niko requested recent logs for student/recruiter rescheduling. Existing runtime traces were partial: `email_logs` showed recent `reschedule_proposed` sends, `notifications` showed recent proposal notices, and active `bookings` rows retained `proposed_time` / `proposed_by_email`, but there was no durable action log for propose, retract, accept, decline, or acceptance failures. Added `booking_reschedule_logs`, a migration helper script, and non-blocking logging in the propose/retract/student-response routes. The live table was created on 2026-06-01 and starts at 0 rows; historical synthetic backfill was skipped because old rows do not reliably record every action timestamp.
- 2026-06-01: Fixed reschedule proposal navigation after student reports that "New Time Proposed" notifications/email opened the site but did not take them to an actionable Accept/Decline state. Proposal emails and in-app/push notifications now carry `/recruiter/<id>?proposal=<bookingId>`, notification rows open their metadata URL, and the recruiter detail page selects the proposed job when opened with that query.
- 2026-05-27: Added recruiter-driven reschedule proposals to unblock piles of pending bookings. New booking status `reschedule_proposed` plus `proposed_time` and `proposed_by_email` columns on `bookings`. Recruiter dashboard exposes a "Suggest time" action on pending/waitlisted applications; on submit the student gets an email + in-app notification and can Accept (runs the same slot-claim transaction as recruiter acceptance, swapping `requested_time` to the proposed time) or Decline (cancels). The student slot picker also shows a per-time "X waiting" badge counting pending/waitlisted/reschedule_proposed bookings for that recruiter+time so students can self-route away from popular slots. Migration `0005_reschedule_proposed.sql` adds the enum values and columns.
- 2026-05-27: Implemented shareable category links under `/jobs/cat/<slug>`, with `/jobs/cat/tech`, `/jobs/cat/business`, and `/jobs/cat/service` served by one dynamic page at `/jobs/cat/[category]`. The route validates slugs, filters approved jobs by `job_category`, hides the category dropdown inside category-specific pages, and reuses the shared `/jobs` listing component instead of duplicating three pages.
- 2026-05-26: Implemented job-level category tagging with an additive `job_openings.job_category` text field defaulting to blank, admin-only category assignment in job review/moderation, public `/jobs` filtering, and localized labels for Business/general, Tech/Engineering, and Service/Hospitality. Ran the additive migration and backfilled 84 previously blank jobs only, resulting in 38 Business, 38 Tech/Engineering, and 8 Service/Hospitality tags; rerunning the backfill dry-run reported 0 blank categories.
- 2026-05-26: Niko shared stakeholder input requesting job-level filtering by three broad categories: Business/general, Tech/Engineering, and Service/Hospitality. Current jobs have company, location, employment type, and recruiter industry filters but no job-level category. Recommended safe shape is an additive `job_openings.job_category` text field with admin-only assignment during job review/moderation; existing jobs remain uncategorized until backfilled or manually tagged.
- 2026-05-25: Job-card metadata fields such as long locations, salary labels, and deadlines are constrained with bounded flex items and inner truncation so they cannot stretch public/internal job cards past the viewport.
- 2026-05-25: Student application submission now sends a recruiter email immediately when `POST /api/bookings` creates a pending application, while the later acceptance email remains unchanged.
- 2026-05-24: Uploaded company logos in company and job cards now keep a small safe inset inside the square logo frame so long horizontal wordmarks fit without touching the edges.
- 2026-05-24: Company cards now mirror job-card logo treatment, with a larger seamless uploaded logo block on the left and company title/details on the right.
- 2026-05-24: First-visit locale selection now detects browser language preferences on both server and client, persists the selected student/recruiter locale cookie, and preserves manual language choices.
- 2026-05-24: Student-facing recruiter detail pages now place the language switcher inside the mobile hamburger menu, matching other auth/topbar screens and giving long company names more header space.
- 2026-05-19: Recruiter-created job location is optional; blank job locations remain blank in public job cards/details and do not fall back to event venue.
- 2026-05-19: Added Construction to company/recruiter industry options, public industry filters, and student preferred-industry choices.
- 2026-05-19: Homepage "View all companies" links now route guests directly to `/browse` instead of `/get-started`; applying/bookings still require login later.
- 2026-05-17: Expanded company/recruiter industry tags and student preferred-industry options to include Beauty plus additional real-world sectors such as Education, Retail, Hospitality, Media, Logistics, Food & Beverage, Energy, Automotive, Gaming, and Nonprofit.
- 2026-05-17: Reverted the inline SVG wordmark experiment because Safari PDF output broke the CV text layout; retained the stable text wordmark with print-window font loading.
- 2026-05-17: Reverted the experimental direct PDF generator after it broke text layout; restored the browser-rendered print-window export while preserving the cursive `tecxwork` font fix.
- 2026-05-17: Removed the Safari-insecure SVG/canvas snapshot path from CV export and switched the direct PDF download to vector text PDF generation.
- 2026-05-17: Replaced Safari print-preview CV export with direct client-side PDF generation from the rendered CV surface so browser metadata and print borders cannot appear.
- 2026-05-17: Removed browser print metadata margins and the visible page border from student CV PDF export by using a zero-margin A4 page with internal CV padding.
- 2026-05-17: Preserved the cursive `tecxwork` wordmark in exported PDFs by carrying the app root font classes into the print window and waiting for print fonts before opening the dialog.
- 2026-05-17: Fixed Safari blank student CV PDF export by cloning the visible CV surface into the print window instead of copying its hidden print-only wrapper.
- 2026-05-16: Optimized the `/profile` My Profile header by using the profile avatar as the left anchor and placing title, email, and completion progress to its right.
- 2026-05-16: Updated student CV header rendering so the university appears bold on the line below the major.
- 2026-05-16: Made My CV QR Code compact on `/profile` by placing the QR code on the left and the CV link/actions on the right.
- 2026-05-16: Reordered `/profile` so My CV QR Code contains the CV Link field and Export CV appears after the My Profile form.
- 2026-05-16: Fixed blank student CV PDF export by printing a dedicated CV document instead of the full profile page.
- 2026-05-16: Adjusted student CV export branding by removing extra TECXWORK CV/generated-by text and using the main wordmark font for the bottom logo.
- 2026-05-16: Implemented student CV preview/export on `/profile` using a print-optimized template generated from existing profile fields.
- 2026-05-16: Niko proposed CV export for students who already completed profile/CV data as a more immediately useful function than LinkedIn import.
- 2026-05-16: Niko asked about adding a LinkedIn import/autofill function for students to complete CV data, noting that resume builders such as Kickresume/CakeResume-like products offer similar flows.
- 2026-05-15: Removed the separate floating Back-to-top button; tapping the active mobile navigation pill now scrolls the current page to top.
- 2026-05-15: Company photo viewer arrows moved into narrow side rails outside the centered photo, using bare high-contrast icons instead of circular controls.
- 2026-05-15: Company photo viewer supports swipe left/right and left/right tap zones; navigation controls use a higher-contrast floating style.
- 2026-05-15: Job-card recruiter logos no longer add an extra frame around uploaded logos; fallback icons keep their framed placeholder.
- 2026-05-15: `/browse` and `/jobs` can show optional admin-managed decorative image carousels above the list content, with one or two wide images per page.
- 2026-05-15: Public job cards now use a larger LinkedIn-style recruiter logo block; the logo and company name link to the recruiter profile while the job title/details remain job-focused.
- 2026-05-15: Company gallery photos on recruiter detail pages open into a full-screen viewer with previous/next controls, Escape close, and full-photo `object-contain` display.
- 2026-05-15: Public recruiter cards now constrain long industry badges the same way position chips are constrained, preventing mobile directory/homepage cards from widening the viewport.
- 2026-05-12: [LinkedIn-style job detail apply flow](../decisions/2026-05-12-linkedin-style-job-apply-flow.md) moved job-click intent to `/jobs/[id]` apply and made company identity the company-page navigation affordance.
- 2026-05-28: Cross-company conflict hint added to recruiter "propose time" — modal shows student's confirmed busy ranges at other companies (times only, no company/position) and the server soft-blocks overlaps with `409 applicant_busy` unless `force: true`. Recruiter override surfaces as a "Suggest anyway" button. Helper at `src/lib/applicant-busy.ts`, endpoint at `GET /api/bookings/[id]/applicant-busy`.
- 2026-05-28: **Known gap** — the applicant-busy guard only covers the recruiter propose-time path. `POST /api/bookings/review` (accept) and the student-initiated booking flow are still unguarded, so a student can still be double-booked via those two paths. Reuse `getApplicantBusyRanges` + `overlapsBusy` when extending. Privacy axis is different for the student-side check: the student is allowed to see *which* company they're already booked with; recruiters are not.

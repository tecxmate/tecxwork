---
title: Recruitment Workflows & Booking Engine
type: topic
slug: recruitment-workflows
date: 2026-05-04
updated: 2026-05-16
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
   - Student CV export is available from `/profile`: students can preview a polished CV generated from profile data and export it via the browser print dialog/Save as PDF flow, with the main-logo `tecxwork` wordmark at the bottom.
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

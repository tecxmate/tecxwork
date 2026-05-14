---
title: Recruitment Workflows & Booking Engine
type: topic
slug: recruitment-workflows
date: 2026-05-04
updated: 2026-05-15
attributed_to: [niko]
belongs_to: [tecxmate]
source: document
status: active
tags: [workflow, booking, slots, admin, recruiter, student]
related: [tecxwork, v-gen-trident-2026, 2026-05-12-linkedin-style-job-apply-flow]
---

## 1. Student Workflow
1. **Registration**: Profile creation with name, major, skills, and Google Drive CV link.
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
- 2026-05-15: Public recruiter cards now constrain long industry badges the same way position chips are constrained, preventing mobile directory/homepage cards from widening the viewport.
- 2026-05-12: [LinkedIn-style job detail apply flow](../decisions/2026-05-12-linkedin-style-job-apply-flow.md) moved job-click intent to `/jobs/[id]` apply and made company identity the company-page navigation affordance.

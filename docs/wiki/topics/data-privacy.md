---
title: Data Privacy & CV Sharing
type: topic
slug: data-privacy
date: 2026-05-04
updated: 2026-05-28
attributed_to: [gpt, niko]
belongs_to: [tecxmate]
source: document
status: active
tags: [privacy, pipa, pdpa, cv, google-drive]
related: [taiwan-compliance, 2026-05-19-hide-hr-email-from-students]
---

## The "Explicit Targeted Sharing" Model
To comply with Taiwan PIPA while avoiding the cost and complexity of a secure file storage server, the platform uses an offloaded Google Drive strategy.

### Mechanism
- Students provide a **Google Drive link** to their CV during registration or booking.
- Students are instructed to set the link to **"Anyone with the link can view"** so companies can open CVs without Google Drive access-request friction.
- Recruiter/HR contact emails are **not displayed on student-facing recruiter or job pages**. Contact emails remain stored for platform notifications, admin workflows, exports, and recruiter-owned dashboards.

### Benefits
- **Zero Storage Cost**: No large PDF files stored on Tecxmate servers.
- **Privacy First**: Access control remains with the student on their own Google account.
- **Auditability**: Google Drive logs provide a record of who accessed the file.

## PIPA Consent Flow
- Every registration and booking requires a mandatory checkbox for PIPA consent.
- Consent covers the collection of the profile data and the specific CV link.
- Users are notified of their rights under Taiwan PDPA Article 3 (Inquiry, Correct, Delete).

## HR email exposure
- 2026-05-19: [Hide HR email from student-facing pages](../decisions/2026-05-19-hide-hr-email-from-students.md) removed recruiter `contactEmail` from public directory, recruiter detail, job detail, and booking-form payloads to prevent students from bypassing the platform by applying directly over email.

## Cross-Border Data Transfer
- **Collection**: Taiwan.
- **Storage**: Japan (Neon DB).
- **Support/Processing**: Vietnam (Tecxmate Team).
- **Compliance**: Adheres to Taiwan PDPA Article 21 and Vietnam PDPD regarding international data handling.

## Data Retention
- Profiles are maintained long-term to provide "Talent Passport" functionality for future events.
- Users can request permanent deletion ("Right to be Forgotten") at any time via `official@tecxmate.com`.

## Recruiter Visibility Into Student Data (by Event Mode)
What a recruiter can see about a student today, by event mode:
- **Always (any mode), per booking row** (`src/app/dashboard/recruiter-data.ts:39-65`): `applicantName`, `applicantEmail`, `cvLink`, `position`, status, times. This travels with every booking the student sends to that recruiter.
- **`recruiter_books_applicant` or `both`**: recruiters can also browse the full applicant directory (`/dashboard/applicants`, `/applicant/[id]`, served by `GET /api/applicants` — `src/app/api/applicants/route.ts:37-58`) and see the entire profile for ANY registered student — phone, nationality, school, major, study level/year, expected graduation, skills, preferred locations/industries, work experiences, work authorization, cv link, linkedin url, portfolio url, description. Access is currently not gated to "students who applied to this recruiter."
- **`applicant_books_recruiter`**: directory is hidden; recruiters only see the per-booking-row fields.

### Open issue — tighten "Both" mode before V-GEN TRIDENT 2026
V-GEN TRIDENT 2026 is expected to run in `both` mode, which under today's rules exposes the entire student directory to every recruiter. Possible tightenings to decide before the event goes live:
1. Gate the directory to students who have already applied to or been bookmarked by that recruiter (join via `bookings.recruiterId ↔ bookings.applicantId`).
2. Keep an open directory but reduce fields to name/major/skills until the student opts in to sharing the full profile with that company.
3. Require students to mark themselves "discoverable" at signup; non-discoverable profiles never appear in the recruiter directory.
A decision is needed; this is currently a known privacy gap, not an enforced policy.

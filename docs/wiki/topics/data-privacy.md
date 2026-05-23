---
title: Data Privacy & CV Sharing
type: topic
slug: data-privacy
date: 2026-05-04
updated: 2026-05-23
attributed_to: [gpt, niko]
belongs_to: [tecxmate]
source: document
status: active
tags: [privacy, pipa, pdpa, cv, google-drive]
related: [taiwan-compliance, 2026-05-19-hide-hr-email-from-students, 2026-05-23-talent-passport-retention-opt-in]
---

## The "Explicit Targeted Sharing" Model
To comply with Taiwan PIPA while avoiding the cost and complexity of a secure file storage server, the platform uses an offloaded Google Drive strategy.

### Mechanism
- Students provide a **Google Drive link** to their CV during registration or booking.
- Students are instructed to set the link to **"Anyone with the link can view"** so companies can open CVs without Google Drive access-request friction.
- Student-facing copy now states plainly that anyone who receives such a link can view the CV, and that TECXWORK uses the link for recruitment workflows.
- Recruiter/HR contact emails are **not displayed on student-facing recruiter or job pages**. Contact emails remain stored for platform notifications, admin workflows, exports, and recruiter-owned dashboards.

### Tradeoffs
- **Zero Storage Cost**: No large PDF files stored on Tecxmate servers.
- **Student-controlled access**: Access settings remain in the student's Google account.
- **Disclosure risk**: The "Anyone with the link" setting is an accessible share link, not private per-recruiter access control.
- **Operational reliability**: Recruiters can open CVs without a Google Drive access-request delay.

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
- The live privacy policy uses a split model: single-event data should be deleted from active databases within 30 days after the event unless the user explicitly opts into persistent "Talent Passport" retention.
- 2026-05-23: `applicantProfiles` gained `talentPassportOptIn` and `talentPassportConsentedAt`, with an optional registration/profile checkbox for persistent Talent Passport retention.
- Admin applicant deletion cascades profile, applicant slots, bookings, and linked user rows in a transaction, so manual permanent deletion exists for admin-handled requests.
- Risk posture as of 2026-05-23: long-term retention now has a dedicated opt-in flag and consent timestamp; the remaining operational requirement is a post-event purge/deletion workflow that deletes non-opted-in event data according to the public privacy policy.
- Users can request permanent deletion ("Right to be Forgotten") at any time via `official@tecxmate.com`.

## Legal Risk Notes
- Keeping user data is not automatically unlawful under Taiwan PDPA if collection/processing has a specific purpose, proper notice, consent or another lawful basis, security controls, and user-rights handling.
- The main lawsuit/regulatory exposure is mismatch: retaining event data after the stated event purpose without opt-in, using data for a new purpose such as year-round monetized talent search without separate consent, failing to honor deletion/correction/access requests, or suffering a leak.
- The "Anyone with the link" CV workflow reduces recruiter access friction but increases practical disclosure risk; the platform should be careful not to describe Google Drive links as equivalent to targeted access control.

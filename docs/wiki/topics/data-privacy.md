---
title: Data Privacy & CV Sharing
type: topic
slug: data-privacy
date: 2026-05-04
updated: 2026-05-19
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

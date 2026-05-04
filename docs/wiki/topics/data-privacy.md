---
title: Data Privacy & CV Sharing
type: topic
slug: data-privacy
date: 2026-05-04
updated: 2026-05-04
attributed_to: [gpt, niko]
belongs_to: [tecxmate]
source: document
status: active
tags: [privacy, pipa, pdpa, cv, google-drive]
related: [taiwan-compliance]
---

## The "Explicit Targeted Sharing" Model
To comply with Taiwan PIPA while avoiding the cost and complexity of a secure file storage server, the platform uses an offloaded Google Drive strategy.

### Mechanism
- Students provide a **Google Drive link** to their CV during registration or booking.
- **Crucial Restriction**: The platform instructs students **NOT** to set the link to "Anyone with the link can view."
- **Targeted Permission**: Students are instructed to explicitly share the file ONLY with the authorized recruiter's email address listed on the company profile.

### Benefits
- **Zero Storage Cost**: No large PDF files stored on Tecxmate servers.
- **Privacy First**: Access control remains with the student on their own Google account.
- **Auditability**: Google Drive logs provide a record of who accessed the file.

## PIPA Consent Flow
- Every registration and booking requires a mandatory checkbox for PIPA consent.
- Consent covers the collection of the profile data and the specific CV link.
- Users are notified of their rights under Taiwan PDPA Article 3 (Inquiry, Correct, Delete).

## Cross-Border Data Transfer
- **Collection**: Taiwan.
- **Storage**: Japan (Neon DB).
- **Support/Processing**: Vietnam (Tecxmate Team).
- **Compliance**: Adheres to Taiwan PDPA Article 21 and Vietnam PDPD regarding international data handling.

## Data Retention
- Profiles are maintained long-term to provide "Talent Passport" functionality for future events.
- Users can request permanent deletion ("Right to be Forgotten") at any time via `official@tecxmate.com`.

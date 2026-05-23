---
title: Talent Passport retention opt-in
type: decision
slug: 2026-05-23-talent-passport-retention-opt-in
date: 2026-05-23
attributed_to: [niko]
belongs_to: [data-privacy]
source: chat
status: active
tags: [privacy, retention, consent, talent-passport]
related: [data-privacy, taiwan-compliance, 2026-05-05-cv-anyone-with-link]
---

## Context
The privacy policy says single-event data is deleted after the event unless the user explicitly opts into persistent Talent Passport retention. The schema previously had `pipaConsent` and `wantsNewsletter`, but no dedicated Talent Passport retention consent field.

## Decision
Add a dedicated Talent Passport opt-in separate from PDPA event consent and newsletter consent. Store both the boolean choice and a consent timestamp. Default existing and new users to no persistent retention unless they opt in.

## Rationale
PDPA consent for a recruitment event is not the same as consent to keep a reusable profile for future events or recruiter opportunities. A distinct checkbox and timestamp make the retention purpose explicit and auditable.

## Consequences
- `applicant_profiles` now has `talent_passport_opt_in` and `talent_passport_consented_at`.
- Registration and profile editing expose an optional Talent Passport checkbox.
- `/api/applicants` and `/api/me/profile` persist the choice and timestamp.
- Public copy now describes "Anyone with the link" Drive CVs as accessible to anyone who receives the link.
- Remaining work: operate a post-event purge workflow for users who did not opt into Talent Passport retention.

## Provenance
- Discussed and implemented on 2026-05-23 between [niko] (owner) and [claude-code] (agent).

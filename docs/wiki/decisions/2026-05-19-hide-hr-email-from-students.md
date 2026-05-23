---
title: Hide HR Email From Student-Facing Pages
type: decision
slug: 2026-05-19-hide-hr-email-from-students
date: 2026-05-19
attributed_to: [niko]
belongs_to: [data-privacy]
source: chat
status: active
tags: [privacy, recruiter, student]
related: [data-privacy, recruitment-workflows]
---

## Context
Students found that the platform displayed recruiter/HR contact emails, letting them bypass the platform by applying directly through email.

## Decision
Student-facing recruiter directory, recruiter detail, job detail, and booking screens must not display or send recruiter HR contact emails to the browser unless a future flow explicitly needs it.

## Rationale
Niko identified direct HR email exposure as a platform-bypass risk. The platform should keep applications and booking review inside Tecxwork while still allowing recruiter contact emails to exist for internal notifications, admin workflows, exports, and recruiter dashboards.

## Consequences
Public recruiter and job queries omit `contactEmail`; the recruiter directory cache was versioned to avoid serving stale email-bearing payloads. Booking copy now instructs students to use an accessible Google Drive CV link without naming the HR email.

## Provenance
- Discussed on 2026-05-19 between [niko] (owner) and [gpt] (agent).

---
title: Recruiter dashboard
type: topic
slug: recruiter-dashboard
role: area
date: 2026-05-04
updated: 2026-05-13
attributed_to: [claude-code]
belongs_to: [tecxwork]
source: code
status: active
tags: [area, recruiter]
related: [tecxwork]
---

## Scope
Recruiter-facing dashboard: company profile, gallery, jobs, slots, interviews.

## Key code
- `src/app/dashboard/recruiter-dashboard-company.tsx`
- `src/app/api/me/recruiter/route.ts` — slot regen on interviewerCount change.

## History
- 2026-05-13: Recruiter job create and edit forms now use explicit submit feedback. After a successful POST to `/api/me/jobs`, the add button shows disabled gray `Saved` on the reset form until the recruiter begins the next draft. After a successful PUT to `/api/me/jobs/[id]`, the save button changes to disabled gray `Saved`; editing any field switches it back to enabled `Save`.

---
title: Recruiter dashboard
type: topic
slug: recruiter-dashboard
role: area
date: 2026-05-04
updated: 2026-05-15
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
- 2026-05-15: My Company editor was flattened out of its single card wrapper; the description now leads the page with uploads in a side column on wide screens.
- 2026-05-15: Recruiter company profile description editor is now a wider, taller adaptive textarea, with website/interviewer fields grouped below it.
- 2026-05-15: Recruiter company/jobs editor now has a sticky save-status strip matching admin settings. It shows all saved, unsaved changes, saving, saved, and error states; job submit/delete actions also show in-flight button spinners.
- 2026-05-13: Salary currency in recruiter job forms is now event-configured. The default for this event is TWD, VND, and USD only; admins can add/remove visible currencies in `/admin/settings`, and recruiter create/update APIs reject currencies not enabled for the event.
- 2026-05-13: Salary currency in recruiter job forms is now a select backed by an ISO 4217-style fiat currency allowlist. TWD, VND, and USD are pinned as the first three choices; `/api/me/jobs` create/update rejects unknown currency codes instead of accepting random text.
- 2026-05-13: Recruiter job create and edit forms now use explicit submit feedback. After a successful POST to `/api/me/jobs`, the add button shows disabled gray `Saved` on the reset form until the recruiter begins the next draft. After a successful PUT to `/api/me/jobs/[id]`, the save button changes to disabled gray `Saved`; editing any field switches it back to enabled `Save`.

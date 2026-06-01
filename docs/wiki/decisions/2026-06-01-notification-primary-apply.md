---
title: Notification-primary for application_submitted + post-apply push prompt
type: decision
slug: 2026-06-01-notification-primary-apply
date: 2026-06-01
attributed_to: [niko]
belongs_to: [tecxwork]
source: document
status: active
tags: [notifications, email, resend, web-push, cost, reliability]
related: [2026-06-01-notification-retention, recruitment-workflows]
---

## Context
Audit of the email/notification system found **more emails than notifications**
(280+ logged Resend emails vs 201 notifications, plus unlogged auth emails).
`application_submitted` was the single biggest email type (134, ~48% of logged
email) — a confirmation sent to the student for an action they just took *in the
app*. Emails cost Resend credits and the free tier caps ~100/day, a reliability
risk for event day (2026-06-06). Notifications (in-app bell + web push) are free
but only reach logged-in / push-enabled users; push adoption was ~0.

## Decision
Make `application_submitted` **notification-primary**:
- On apply, create an in-app notification for the **student** (applicant
  "pending" → "Application Submitted"), which also pushes if they have push on.
  (Previously the student got only an email; the recruiter already got the
  in-app notification.)
- Send the student email **only as a fallback** when they have **no** push
  subscription. Recruiter notification unchanged.

Grow push adoption so the fallback rarely fires: add a **post-apply prompt** in
the booking-form success view ("Turn on notifications") that subscribes via web
push. Extracted the subscribe logic into a shared `usePush()` hook
(`src/lib/use-push.ts`) used by both the notification bell and the prompt.

## Kept as email (reliable reach, no change)
Auth verification + password reset, interview **confirmed**, reschedule
proposal, reminders.

## Files
`src/lib/use-push.ts` (new), `src/components/notification-bell.tsx` (uses hook),
`src/components/booking-form.tsx` (prompt), `src/app/api/bookings/route.ts`
(student notif + email fallback), `src/messages/student/{en,vi,zh-TW}.ts`.

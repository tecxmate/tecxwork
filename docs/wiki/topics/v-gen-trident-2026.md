---
title: V-GEN TRIDENT 2026
type: topic
slug: v-gen-trident-2026
role: automation
date: 2026-05-04
updated: 2026-06-06
attributed_to: [niko]
belongs_to: [vsatw, tecxmate]
source: document
status: active
tags: [event, career-fair, 2026]
related: [vsatw, tecxmate, tecxwork]
---

## Overview
The flagship career fair event for Vietnamese students in Taiwan, hosted at MCUT (Ming Chi University of Technology) on June 6, 2026.

## Event Details
- **Date**: Saturday, June 6, 2026.
- **Time**: 10:00 AM – 17:30 PM (Taipei Time).
- **Venue**: MCUT (Ming Chi University of Technology).
- **Format**: Hybrid (Digital booking via Tecxwork + Physical interviews).

## Configuration
- **Interview Slots**: 15-minute intervals.
- **Booking Modes**: Student-books-Recruiter, Recruiter-books-Student, or Bidirectional.
- **Moderation**: Admin-controlled job approval toggle.

## Event-Day Pre-Check
- **2026-06-06**: Main event-day readiness check found production event config set to `applicant_books_recruiter`, `mode_locked=true`, `emergency_fallback=false`, job moderation off, and student cancellation off. Live counts: 164 applicant profiles, 38 recruiters, 141 approved jobs, 477 recruiter slots, 294 bookings, 668 notifications. Booking consistency checks found no duplicate accepted recruiter slots, no duplicate accepted applicant slots, no accepted applicant double-bookings, no orphan booked recruiter slots, and no accepted booking pointing at an unbooked slot.
- **2026-06-06**: Created the missing production `booking_action_logs` table via the existing additive migration script. The logger was fail-open, so bookings were not blocked, but audit logging would otherwise be unavailable/noisy during the event.
- **2026-06-06**: Watch item: 7 pending/waitlisted applications requested recruiter/time combinations with no currently available interviewer slot. Those recruiter accept actions will need waitlist/reject/reschedule behavior rather than direct acceptance.

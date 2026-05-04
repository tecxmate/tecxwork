---
title: Applicant Double-Booking Prevention
type: decision
slug: 2026-04-28-double-booking-prevention
date: 2026-04-28
attributed_to: [niko]
belongs_to: [tecxwork]
source: document
status: active
tags: [concurrency, booking]
related: [booking-engine, architecture-overview]
---

## Context
A race condition was identified where two recruiters could accept pending requests for the same applicant at the same time, leading to a double-booked student.

## Decision
Implement a strict transaction-based check with an advisory lock during the booking review process.

## Implementation
- Added a DB transaction in `PUT /api/bookings/review`.
- Keyed an advisory lock by applicant email + requested time.
- Re-checks for conflicts before committing the slot reservation.

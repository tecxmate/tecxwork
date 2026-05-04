---
title: Custom Booking Engine over Cal.com
type: decision
slug: 2026-04-20-custom-booking-engine
date: 2026-04-20
attributed_to: [niko]
belongs_to: [tecxwork]
source: document
status: active
tags: [booking, architecture]
related: [booking-engine, architecture-overview]
---

## Context
Initial plans considered using Cal.com for interview scheduling. However, the unique requirements of a single-day career fair (high concurrency, atomic slot decrementing, specific recruiter-applicant workflows) made a custom-built solution more attractive.

## Decision
Build a custom integrated directory and booking system directly into the Next.js app using Neon Postgres for state management.

## Rationale
- **Control**: Full control over the atomic locking logic to prevent double-bookings.
- **Integration**: Seamless UX within the Tecxwork directory.
- **Cost**: $0 licensing fee compared to enterprise scheduling tools.
- **Privacy**: Direct control over PIPA-compliant data flows.

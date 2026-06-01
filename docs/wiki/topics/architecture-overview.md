---
title: Architecture Overview
type: topic
slug: architecture-overview
date: 2026-05-04
updated: 2026-06-01
attributed_to: [niko]
belongs_to: [tecxmate]
source: document
status: active
tags: [architecture, tech-stack, nextjs, neon, vercel]
related: [tecxwork, booking-engine]
---

## Technical Stack
- **Framework**: Next.js (App Router, TypeScript).
- **Styling**: Tailwind CSS + Shadcn UI.
- **Database**: Neon Serverless Postgres (utilizing Drizzle ORM).
- **Hosting**: Vercel (Edge network for global low-latency).
- **Email**: Resend (Transactional emails).
- **Authentication**: Custom JWT + bcrypt implementation.

## Core Design Patterns
- **Atomic Bookings**: Uses database transactions and advisory locks (via Neon/Postgres) to prevent race conditions during high-concurrency booking spikes (the "9:00 AM Thundering Herd").
- **Stateless Auth**: JWT-based sessions to avoid database bottlenecks on every request.
- **Edge Performance**: Heavy use of prefetching and edge-cached static assets via Vercel.

## Data Infrastructure
- **Current runtime location audit (2026-06-01)**: Latest production Vercel deployment `app-erea8swq9-nikolasdoans-projects.vercel.app` shows Node functions built in `iad1` (Washington, D.C.). Local `DATABASE_URL` host resolves to Neon's `us-east-1.aws.neon.tech`, so the app/database round trip is currently colocated in US East.
- **Target location**: For Taiwan/Vietnam users, Tokyo (`hnd1` on Vercel, AWS `ap-northeast-1` on Neon) is the likely latency-optimized target if the database is migrated/recreated there.
- **Timezone**: Strictly `Asia/Taipei (UTC+8)` for all date-time logic to avoid scheduling drift.

## Scalability Strategy
- **Serverless**: Leverage Vercel Functions and Neon's autoscaling to handle spikes from 0 to 1,000+ concurrent users without manual provisioning.
- **Offloading**: CV and JD storage is offloaded to Google Drive to keep the core system lean and bandwidth-efficient.

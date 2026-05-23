---
title: Architecture Overview
type: topic
slug: architecture-overview
date: 2026-05-04
updated: 2026-05-04
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
- **Location**: Database is hosted in `Tokyo, Japan` (AWS `ap-northeast-1`) via Neon to provide the best latency for Taiwan users while keeping data in a region with high protection standards.
- **Timezone**: Strictly `Asia/Taipei (UTC+8)` for all date-time logic to avoid scheduling drift.

## Scalability Strategy
- **Serverless**: Leverage Vercel Functions and Neon's autoscaling to handle spikes from 0 to 1,000+ concurrent users without manual provisioning.
- **Offloading**: CV and JD storage is offloaded to Google Drive to keep the core system lean and bandwidth-efficient.

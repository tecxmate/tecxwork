---
title: Architecture Overview
type: topic
slug: architecture-overview
date: 2026-05-04
updated: 2026-06-06
attributed_to: [niko]
belongs_to: [tecxmate]
source: document
status: active
tags: [architecture, tech-stack, nextjs, neon, vercel, mcp]
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

## Next.js vs Vite Assessment
- **2026-06-06**: Niko asked whether converting the app to Vite + React would reduce business-logic exposure. The assessment is that this repo uses Next.js as both frontend framework and backend runtime: about 30 App Router pages, 54 API route handlers, server-only dashboard/admin data modules, cookie-based auth, cron handlers, upload/blob/email integrations, and direct Neon/Drizzle access. A Vite conversion would require creating a separate backend/API layer for those responsibilities; Vite alone is only a browser bundler and would expose any logic imported into the client bundle. The preferred mitigation for sensitive logic is to keep it server-only and enforce API authorization, not migrate frameworks.
- **2026-06-06**: Follow-up assessment: Next.js was suitable from the start for this product because the app needs authenticated dashboards, server-side redirects, API handlers, cron jobs, SEO/social metadata, image/icon generation, and Vercel/Neon integration. A pure Vite SPA would have been simpler for a static marketing site or client-only app, but this project would still have needed a separate backend from day one.

## Data Infrastructure
- **Region — Singapore (since 2026-06-01)**: Vercel functions run in `sin1` (set via `vercel.json` `regions:["sin1"]`); the prod Neon DB is in `ap-southeast-1` (host `ep-delicate-lab-aos3iphg`, pooled, in Niko's own Neon account). Co-located in Singapore — chosen over the old US-East colocation to cut Taiwan-user latency (~200ms → ~50ms). Tokyo (`hnd1`/`ap-northeast-1`) was preferred but Neon offered no Tokyo region for this account. See [[2026-06-01-tokyo-region-migration]].
- **Single Vercel project**: the live project is **`app`** (serves `work.tecxmate.com`). A redundant duplicate project (`tecxwork`) that auto-built the same branch was deleted 2026-06-01 — see [[2026-06-01-vercel-project-consolidation]].
- **DB resilience**: prod Neon is **free-tier** (0.25 CU + a connection-attempt ceiling). Two mitigations after the 2026-06-01 outage: the Neon pool has an idle-client `error` handler so a dropped socket can't crash the instance ([[2026-06-01-neon-pool-crash-hardening]]), and the per-request `event_config` read is runtime-cached ([[2026-06-01-event-config-cache]]). Consider upgrading off free-tier before high-traffic event days.
- **Caching**: hot reads go through the Vercel runtime cache (`@vercel/functions` `getCache`, `lib/cache.ts`) — recruiters, external jobs, and `event_config` (tag-invalidated on admin edits). Public pages are `ƒ (Dynamic)` (server-side session/locale cookies), so route-level ISR is not used.
- **Timezone**: Strictly `Asia/Taipei (UTC+8)` for all date-time logic to avoid scheduling drift.

## Scalability Strategy
- **Serverless**: Leverage Vercel Functions and Neon's autoscaling to handle spikes from 0 to 1,000+ concurrent users without manual provisioning.
- **Offloading**: CV and JD storage is offloaded to Google Drive to keep the core system lean and bandwidth-efficient.

## Agent Tooling
- **Linear MCP**: Local coding agents should use Linear's official hosted MCP endpoint (`https://mcp.linear.app/mcp`) rather than a local Linear server. Codex setup: `codex mcp add linear --url https://mcp.linear.app/mcp`. Claude Code setup: `claude mcp add --transport http linear-server https://mcp.linear.app/mcp`, then run `/mcp` in a Claude Code session to authenticate.

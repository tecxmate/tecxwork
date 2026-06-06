---
title: Upgrade live project to Vercel Pro
type: decision
slug: 2026-06-06-vercel-pro-upgrade
date: 2026-06-06
attributed_to: [niko]
belongs_to: [tecxwork]
source: chat
status: active
tags: [infra, vercel, billing, event-day]
related: [architecture-overview, 2026-06-01-vercel-project-consolidation, v-gen-trident-2026]
---

## Context
On event day (2026-06-06) the Vercel dashboard for the live `app` project (`work.tecxmate.com`) showed **free-tier resources exceeded**:
- Fluid Active CPU **5h 23m / 4h** — already over the cap.
- Blob Data Transfer 8.54 / 10 GB (86%).
- Edge Requests 645K / 1M (65%).
- Function Invocations 620K / 1M (62%).

The Hobby plan has **no overage billing** — when limits are hit it throttles or pauses the project rather than charging. With three metrics at 62–86% mid-month and event traffic peaking, that risked an outage at the worst possible time. Hobby is also non-commercial-use only, and this is a live commercial job platform.

## Decision
Upgraded the live project to **Vercel Pro ($20/month)**. Niko confirmed the upgrade was completed.

## Rationale
- Converts the Hobby hard wall into on-demand usage — the site stays up under load and any overage is billed in cents instead of pausing the project. [niko]
- Removes the ToS mismatch of running a commercial product on the personal-use tier.
- Cheap insurance against a second avoidable outage after the 2026-06-01 connection-storm incident.

## Consequences
- All four free-tier limits lifted; overage is now metered, not blocking.
- Recommended follow-up (not yet done): set a **hard spend limit / spend-management cap** on the Pro plan so a runaway metric can't produce a surprise bill.
- The Fluid Active CPU figure (5h 23m) is worth watching post-event — sustained high CPU likely traces to synchronous waits against the free-tier Singapore Neon DB (0.25 CU). That's a later optimization, not a blocker. See [[architecture-overview]].

## Provenance
- Discussed and decided on 2026-06-06 between [niko] (owner) and [claude-code] (agent).
- No code change — Vercel plan/billing change only.

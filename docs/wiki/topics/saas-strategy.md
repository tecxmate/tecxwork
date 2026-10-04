---
title: SaaS Strategy & Product Pivot
type: topic
slug: saas-strategy
date: 2026-05-04
updated: 2026-09-15
attributed_to: [niko]
belongs_to: [tecxmate]
source: document
status: active
tags: [strategy, product, pivot, saas]
related: [tecxwork, v-gen-trident-2026, 2026-09-15-flagship-is-bizmap-tecxwork-feeds-it]
---

> **Qualified 2026-09-15.** [niko] named bizmap/marketecx the flagship and said monetizing
> tecxwork touches a legal gray zone. Read as [taiwan-compliance](taiwan-compliance.md) §1 —
> unlicensed matching **for profit** — that retires the *independent Tecxmate product* this
> page describes, while leaving the licensed-agency line
> ([Yang Luck](../decisions/2026-07-27-yang-luck-licensee-positioning.md),
> [per-seat SaaS](../decisions/2026-08-12-saas-tenancy-and-commercial-model.md)) standing,
> because there the customer holds the licence. See
> [2026-09-15-flagship-is-bizmap-tecxwork-feeds-it](../decisions/2026-09-15-flagship-is-bizmap-tecxwork-feeds-it.md),
> including the narrower/wider reading it flags for [niko] to confirm.

## Overview
The project is pivoting from a custom single-event scheduling tool for V-GEN into a reusable, multi-tenant B2B SaaS product for event organizers and recruiters.

## Strategic Positioning
- **Target**: Event organizers (universities, associations, agencies) and recruiters.
- **Narrative**: "Career fair operations software" or "Event talent-matching infrastructure."
- **Avoid**: Positioning as a "public job marketplace" to reduce legal/operational risk.

## Key Product Concepts
### 1. The "Talent Passport"
A student profile that persists across multiple events, allowing students to "carry" their validated data, CVs, and interview history to different career fairs hosted on the platform.

### 2. Multi-tenant Architecture
Moving from a single-tenant Next.js deployment to a system supporting multiple organizations, each managing their own events, recruiters, and applicants.

### 3. AI-Driven Talent Matching
Utilizing LLMs (Claude/Gemini) to parse resumes, categorize skills, and provide "smart" matching between students and job openings, moving beyond simple scheduling.

## Product Roadmap Gaps
- **Multi-tenancy**: Need to scope all data (recruiters, slots, bookings) to an `Organization` and `Event`.
- **Branding Layer**: Allow organizers to customize colors, logos, and copy via an admin UI.
- **Permissions**: Implement roles (Platform Owner, Org Admin, Recruiter, Student).
- **Onboarding UX**: Polished setup checklists for new organizers.

---
title: Navigation Consolidation (Desktop/Mobile)
type: decision
slug: 2026-04-30-navigation-consolidation
date: 2026-04-30
attributed_to: [niko]
belongs_to: [public-homepage, tecxwork]
source: document
status: active
tags: [ux, refactor]
related: [tecxwork]
---

## Context
Navigation systems were becoming fragmented: recruiter desktop used a sidebar, mobile used bottom nav, public pages used a top bar. This was hard to maintain and inconsistent.

## Decision
Consolidate all primary navigation into a shared Top Bar for desktop and a shared Bottom Nav for mobile.

## Implementation
- Removed recruiter-side sidebar.
- Moved primary navigation links to `src/lib/navigation.ts`.
- Introduced `src/components/desktop-top-nav.tsx` with route prefetching.
- All primary actions (Admin/Recruiter/Applicant) are now visible in the unified nav based on the user's role.

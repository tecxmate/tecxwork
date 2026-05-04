---
title: Job Moderation Toggle for Admins
type: decision
slug: 2026-04-24-job-moderation-toggle
date: 2026-04-24
attributed_to: [niko]
belongs_to: [admin-panel, tecxwork]
source: document
status: active
tags: [moderation, workflow]
related: [recruitment-workflows]
---

## Context
Different events have different moderation requirements. Some organizers want to vet every job posting, while others trust recruiters to publish directly.

## Decision
Added `event_config.job_moderation_enabled` toggle to the admin dashboard.

## Implementation
- **ON**: Recruiters submit jobs for review; Admin must approve.
- **OFF**: Recruiters publish jobs instantly.
- Added migration script `src/lib/db/add-job-moderation-toggle-column.ts`.

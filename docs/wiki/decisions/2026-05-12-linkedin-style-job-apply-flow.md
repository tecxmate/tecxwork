---
title: LinkedIn-style job detail apply flow
type: decision
slug: 2026-05-12-linkedin-style-job-apply-flow
date: 2026-05-12
attributed_to: [niko]
belongs_to: [recruitment-workflows, public-homepage]
source: chat
status: active
tags: [student, jobs, apply-flow]
related: [recruitment-workflows, public-homepage]
---

## Context
Students clicking recruiter-posted jobs were landing on a job detail page whose primary action sent them to the company page. The actual apply flow lived one level deeper on `/recruiter/[id]`, where students then selected a position and booked an interview time.

## Decision
Recruiter-posted jobs should behave like LinkedIn: clicking a job opens the job detail page with an immediate apply action for that specific position. Company logos and company names in job listings become the affordance for navigating to the company page and browsing all jobs from that company.

## Rationale
[niko] identified the old flow as indirect: job intent should lead directly to applying for that job, while company exploration should be available through the visible company identity already shown on job cards.

## Consequences
- `/jobs/[id]` owns a job-specific apply flow using the existing slot picker and booking form.
- Job listing cards keep job-detail navigation on the title/details action.
- Company logo/name links route to `/recruiter/[id]`.
- The company page remains the browse-all-jobs surface for a recruiter.

## Provenance
- Discussed on 2026-05-12 between [niko] (owner) and GPT (agent).

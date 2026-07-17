---
title: Yang Luck ATS-kanban pitch demo
type: decision
slug: 2026-07-18-yang-luck-demo
date: 2026-07-18
attributed_to: [niko]
belongs_to: [tecxwork, saas-strategy]
source: chat
status: active
tags: [demo, ats, kanban, yang-luck, pitch]
related: [tecxwork-sales-deck, saas-strategy]
---

## Context
Cowork (business workstream) handed off `docs/specs/yang-luck-demo-handoff.md`: build a
clickable pitch demo of a recruitment platform for **揚運國際集團 (Yang Luck)**, a
Taichung manpower agency. Headline = an **ATS kanban pipeline**. Build on TECXWORK,
demo quality, fictional data.

## Decision
Built on a new branch **`demo/yang-luck` off `main`** (NOT multi-tenant-exploration,
NOT merged to main). Star surface is **`/pipeline`** — a 5-stage ATS kanban.

## Rationale / key calls
- **Isolated demo DB:** the Neon MCP is on the Tecxmate org and cannot branch the live
  `delicate-lab` prod DB (different login). Provisioned a fresh isolated Neon project
  **`tecxwork-yl-demo` (green-paper-12737860)** instead — functionally identical for a
  fake-data demo, zero prod contact. Seed script guards against prod hosts. See
  [[neon-account-topology]].
- **New `applications` table** (`applicant × job × pipeline_stage` enum
  applied→screening→interview→offer→hired, + stage_updated_at/notes/ai_score) rather
  than overloading the interview-slot `bookings` machinery.
- **dnd-kit** for drag-drop (headline UX); persists via `PATCH /api/applications/:id`.
- Branded surface (purple #3A1C71) + in-page **繁中/EN/VI** toggle; mocked AI-score badge.
- Vercel preview via **branch-scoped `DATABASE_URL`** (+ demo `JWT_SECRET`) so the
  preview uses the demo DB, not prod.

## Consequences
- New files: `src/app/pipeline/*`, `src/app/api/applications/[id]/route.ts`,
  `src/lib/pipeline-{data,types}.ts`, `src/lib/db/seed-yang-luck.ts`, `DEMO.md`,
  `public/demo/*.png`. New dep: `@dnd-kit/*`.
- Live preview: https://app-git-demo-yang-luck-nikolasdoans-projects.vercel.app/pipeline
- Seeded: 1 agency recruiter, 7 client-placement jobs, 30 fictional VN/ID/PH candidates
  across all 5 stages (showcase job has 12). Recruiter login `hr@yangluck.demo / demo1234`.
- Not merged to main; multi-tenant tables deliberately excluded (main has none).

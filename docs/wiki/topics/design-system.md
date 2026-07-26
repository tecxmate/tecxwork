---
title: Tecxmate Design System
type: topic
slug: design-system
date: 2026-05-04
updated: 2026-06-01
attributed_to: [niko]
belongs_to: [tecxmate]
source: document
status: active
tags: [design, branding, ui, ux]
related: [tecxmate]
---

## Visual Language
- **Inspiration**: Apple-clean, minimal, and functional.
- **Key Principles**:
  - **Generous Whitespace**: Focus on clarity and ease of use.
  - **Neutral Grays**: Primary background is `#FAFAFA`, text is `#1D1D1F`.
  - **Purple Accents**: Brand color `#8C52FF` (HSL 271, 76%, 53%) is used sparingly for primary actions and brand identity.
  - **Square over Rounded**: Cards and thumbnails are squared (`rounded-none`). Rounded corners are reserved for buttons and form fields.

## Typography
- **Sans-Serif**: Apple system stack (San Francisco) for the interface.
- **Display Serif**: *Instrument Serif Italic* for the wordmark and rare accent moments.

## Key Components
- **The "Glow" Card**: Interactive cards use a subtle colored border and ambient shadow on hover, rather than elevation.
- **Book-a-call Pill**: A signature high-contrast pill-shaped button for the primary CTA.
- **Status Badges**: Rounded-full tokens for status (Live, Beta, Success) using Apple's system colors.
- **Android PWA frame**: Standalone PWA chrome should match the light app canvas (`#FAFAFA`). Do not let OS dark preference force a black status/navigation frame around the light UI.

## The Wordmark
- **Style**: Always lowercase `tecxmate`.
- **Font**: Instrument Serif Italic, Thin weight.
- **Color**: Primary purple on white, or white on purple/black.

## Component Rules
- **Client-hook components must declare `"use client"`.** Any component that calls `useStudentI18n`, `useRecruiterI18n`, or any other `useContext`-based hook needs `"use client"` at the top of the file — even if the component looks purely presentational. `next build` will not catch the omission; failure surfaces only at runtime as a streamed Server Component error (e.g. a `$RX("B:1", "<digest>")` boundary marker in the rendered HTML and "This page couldn't load" in the browser). See 2026-05-27 log entry for the `recruiter-card.tsx` regression.

## History
- 2026-07-27: Pipeline kanban board (`src/app/pipeline/pipeline-board.tsx`) realigned to the system so it reads as native, not a bolted-on library. Candidate cards adopt the signature **Glow Card** hover (`border-border/70` → `hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)]`, same as recruiter/job cards). Hardcoded hex stage/AI colors replaced with palette tokens; AI badge uses the `bg-{c}/15 text-{c}` status-pill tint. Column headers now head each stage with the **colored count circle** (`h-5 w-5 rounded-full bg-{c}-500/15 text-{c}-600`) — the exact idiom the booking tab uses for its application-stage groups, since the kanban is the board form of that same pipeline — replacing a generic gray count badge + decorative dot. Column borders softened to `border-border/60`. Candidate drawer header changed from a solid `bg-primary` block to the system's panel-header idiom (`bg-card` + `border-b border-border`, muted uppercase eyebrow, `font-heading … font-semibold` heading, outline close button).
- 2026-06-01: Loading affordances are smoothed independently from raw network timing. `useSmoothLoading` adds delayed show and minimum visible duration for company/list loaders, shared skeletons use a slower `skeleton-smooth` breathe animation instead of Tailwind's default pulse, and inline loaders use `loading-spinner-smooth`.

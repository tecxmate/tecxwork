---
title: Admin workspace gets the same left rail as the recruiter workspace
type: decision
slug: 2026-08-12-admin-workspace-rail
date: 2026-08-12
updated: 2026-08-12
attributed_to: [claude-code]
belongs_to: [admin-panel, design-system]
source: request
status: accepted
tags: [ui, navigation, admin, sidebar, consistency]
related: [admin-panel, recruiter-dashboard, design-system]
---

## The ask

niko: *"the admin panel also need to redesign to match the nicely done left side bar of the
recruiter panel."* The recruiter workspace had gained a persistent collapsible rail; the admin
workspace still hung its five destinations off the top bar, so moving between the two felt like
moving between two different products.

## What changed

New `src/components/admin-sidebar.tsx`, wired into `admin-dashboard.tsx` beside the whole
workspace (rail outside the top bar, so it stays put while the section changes), with
`hideDesktopNav` on `AppTopBar` — the bar keeps the links for small screens, where a persistent
rail costs more width than it earns.

## Two choices worth recording

**Two components, not one parameterised rail.** The obvious move is to extract a shared
`<WorkspaceRail items={...} groups={...} />`. Rejected: the two rails differ in grouping and in
capability filtering (the recruiter rail filters by plan, the admin rail does not), and a single
component threading both concerns reads worse than two that each state their own case. They are
~150 lines of mostly-markup; the duplication is cheaper than the abstraction. Revisit if a third
workspace appears.

**The collapse preference is shared, deliberately.** Both rails read and write
`tecxwork_sidebar_collapsed`. An admin who is also a recruiter should not find one workspace
collapsed and the other expanded — it is the same control doing the same job. State moves via
`useSyncExternalStore` over a `tecxwork:sidebar` window event, because `storage` does not fire in
the tab that wrote the value, and because effect-then-setState trips
`react-hooks/set-state-in-effect`.

Groups are Moderation / Registry / Configuration. Anything a group does not claim falls into a
"More" group that renders only when it catches something — adding a nav item can never silently
hide it.

## Gotcha this cost an hour

The rail rendered correctly the whole time. Verification was pointed at a **stale dev server**:
port 3000 was already occupied, so `next dev` quietly bound 3001 and printed that fact in a log
nobody re-read. The browser check hit 3000 — an older server whose `.next` had since been
deleted, which is where the flood of "500 Internal Server Error" on chunk requests came from.
Every signal (`aside` absent, admin links still in the top bar, empty `body.firstElementChild`)
was consistent with "the code does not work" and was actually "you are looking at a different
build."

Read the dev server's own startup line for the port before trusting a browser check, and kill
strays first — `tsc` and `lint` passing while the browser shows nothing is a strong hint the two
are not looking at the same thing.

## Verified

Rail present at 224px expanded / 68px collapsed, preference persisting across navigation, active
state tracking the route, desktop top-bar admin links 0 (was 5), rail suppressed at 390px.
tsc 0, lint 0 errors.

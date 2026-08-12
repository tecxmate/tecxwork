---
title: Brand, notifications and account move into the workspace rail
type: decision
slug: 2026-08-12-workspace-rail-brand-and-account
date: 2026-08-12
updated: 2026-08-12
attributed_to: [niko]
belongs_to: [design-system, recruiter-dashboard, admin-panel]
source: request
status: accepted
tags: [ui, navigation, sidebar, saas-conventions]
related: [2026-08-12-admin-workspace-rail, recruiter-dashboard, admin-panel, design-system]
---

## The ask

niko, from a screenshot of the recruiter workspace: *"Move the account settings into the lower
left corner into the collapsible sidebar. show the company name not only recruiter. tecxwork
Logo should also be on the bar. When the bar is expanded, the tecxwork is shown. When the bar
is collapsed, only the logo is shown. Notification put it on... also on the lower left corner
on top of the account settings. this is very standard layout of SaaS workspace."*

## What moved

Everything that was in the top bar is now in the rail:

| Element | Was | Now |
|---|---|---|
| Brand lockup | top-left of the header | rail header — wordmark expanded, logo only collapsed |
| Notifications | bell icon, header right | rail footer, above the account |
| Account + theme + language + logout | hamburger overflow menu | rail footer, menu opening upward |

**The desktop top bar is gone entirely** (`hideOnDesktop` on `AppTopBar`, `lg:hidden`). With
those three moved out it was an empty strip. Below `lg` there is no rail, so the bar keeps
everything it had — same breakpoint the rail uses, so the two can never both be absent.

## The company name is the primary line

The old menu said "Recruiter". That tells someone what they can do, which they already know.
The account block now leads with the **organisation** and puts the role underneath, because
the question the corner answers is *which account am I acting in* — which matters the moment a
person has more than one. The admin workspace has no company, so it names the platform
(`BRAND.displayName`) with "Administrator" beneath.

## Two implementation notes

**A third `NotificationBell` variant rather than a new component.** The bell owns polling,
mark-read and the unread count; a sidebar copy would have duplicated all of it. `variant="rail"`
reuses the existing panel and only changes the trigger and where the panel is anchored —
upward and to the right, because the trigger sits at the bottom of a 4rem-to-14rem column and
a downward panel would open off-screen while a left-aligned one would be clipped to the rail.

**Closing the account menu on collapse is derived, not an effect.** The obvious
`useEffect(() => setOpen(false), [collapsed])` trips the repo's `react-hooks/set-state-in-effect`
rule. Instead the state stores *which rail width the menu was opened against*
(`openedWith: boolean | null`) and `open` is `openedWith === collapsed`. Collapsing the rail
makes the menu closed by derivation, in one render.

`SidebarBrand` and `SidebarFooter` are exported from `dashboard-sidebar.tsx` and imported by
`admin-sidebar.tsx`. The two rails still keep their own nav grouping — per the 08-12 decision,
that part is genuinely different — but the chrome above and below the list is now one
implementation.

## Verified

Against a locally seeded database, both workspaces at 1440px:

| check | expanded | collapsed |
|---|---|---|
| rail width | 224px | 68px |
| brand | logo + wordmark | logo only |
| notifications row | labelled, above account | icon, unread dot |
| account block | company + role, menu opens upward | initial only, tooltip |
| desktop top bar | hidden | hidden |

At 390px: top bar present with brand, rail absent, no horizontal scroll. tsc 0, lint 0 errors.

## Gotcha worth keeping

Rebuilding the local demo environment needs **both** `DATABASE_URL` and `JWT_SECRET` in
`.env.local`. With only the first, `drizzle-kit push` and the seed both succeed and the site
renders — but every login returns 500, which reads as "auth is broken" rather than "an env var
is missing". Also: `drizzle.config.ts` reads `process.env.DATABASE_URL` directly and does not
load `.env.local`, so `drizzle-kit push` needs the variable passed on the command line.

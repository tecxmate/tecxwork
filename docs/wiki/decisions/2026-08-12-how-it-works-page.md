---
title: /how-it-works — the employer- and agency-facing explainer
type: decision
slug: 2026-08-12-how-it-works-page
date: 2026-08-12
updated: 2026-08-12
attributed_to: [niko]
belongs_to: [tecxwork, design-system]
source: request
status: accepted
tags: [marketing, positioning, public-site, honesty]
related: [platform-manual, saas-strategy, 2026-08-11-corridor-agnostic-positioning, 2026-08-12-documentation-route-closed]
---

## The ask

niko: *"this needs a landing page explain beautifully how it works."* Chosen scope: a new
`/how-it-works` route, written for **employers and agencies** — the people who pay.

Context: `/documentation` had just been closed, which removed the only surface that explained
the product end to end. `/about` is a positioning statement and `/tutorial` is a dense
reference manual; neither is a scannable explanation of the mechanism.

## What the page argues

Not a feature list. An agency evaluating this already knows what a kanban board is; what they
cannot tell from a screenshot is whether the record survives an audit. So each section leads
with a mechanism and names the guarantee behind it — append-only stage history, double-billing
blocked by a database constraint rather than application code, no silent gaps in invoice
numbering, integer money, renewals that supersede rather than overwrite.

## Voice: plain, after a rewrite

The first draft was literary — headings like *"A placement is a paper trail that happens to
involve people"* and *"What holds when nobody is watching"*. niko: *"write in simple direct
language. try to see how cake resume do it."* Cake (cake.me, the Taiwan incumbent) writes short
benefit-first sentences in second person, with headings that name the thing: Job Posting,
Resume Search, Employer Branding. Both cake.me and cakeresume.com are blocked by this
container's egress proxy, so the pattern came from search results rather than the pages.

Rewritten accordingly: headings became *The five steps*, *Your records stay correct*, *Control
who sees what*, *Ready for an inspection*. Sentences shortened, contractions used, "you"
throughout. No claim changed — only the wording. The literary version is worth remembering as
the failure mode: it read as advertising to an audience that wants to be told plainly.

**Two JSX traps hit during the rewrite**, both invisible to tsc and lint:
1. `&rsquo;` inside the `STEPS`/`GUARANTEES` **data arrays** is not markup — those strings
   render through `{step.body}`, so React escapes them and the page shows `haven&rsquo;t`
   literally. Use the real character in JS strings; entities only work in JSX.
2. JSX dropped the space after `</em>` mid-sentence, rendering *"soon andwe are still"*.
   Needs an explicit `{" "}`.
   Both were caught by grepping the rendered HTML, not by reading the source.

The centrepiece is a hand-authored inline SVG making the one claim prose makes slowly: **one
application creates two records** — the employer's interview booking (over in an afternoon)
and the agency's pipeline card (alive for weeks), joined only by the candidate.

## What it deliberately does not claim

Two subagent surveys of the codebase turned up five things that looked like obvious copy and
are not true. Recording them because the next person writing marketing will reach for the same
five:

| Tempting claim | Reality |
|---|---|
| AI CV screening | `applications.ai_score` is a **mocked demo badge**, explicitly "not real inference" (`schema.ts:371`) |
| "Your client logs in and sees permit expiries" | The client portal is `status: proposed`. No `portal_invites`/`portal_sessions` tables exist |
| "Click Export for your RBA pack" | `export/fees` and `export/evidence` are **API routes with no UI button** |
| "We warn you 30 days before expiry" | ~~Three windows disagree: dashboard 30d, compliance CSV 60d, evidence pack 90d~~ **Resolved 2026-08-14** — one `EXPIRING_SOON_DAYS = 30` in `src/lib/compliance-window.ts`; the evidence pack keeps a separate, self-labelling 90-day evaluation horizon |
| "30-minute interview slots" | Configurable; the schema default is **15** minutes. The manual's "30-min" is wrong |
| Plans / tiers / seats | No subscription concept exists anywhere. Access is capability-based only |

The Employer-Pays section states its own limitation on the page rather than burying it: the
export reports worker-charged fees as *recorded* zero, which proves the system holds no such
fee — there is no path in the data model from a fee to a candidate — and is **not** the claim
that no cash moved outside the system. An auditor handed the wider claim would be right to
distrust everything else in the pack.

## Positioning

Corridor-agnostic per the 08-11 decision: employer side / supply side / candidate, no assumed
countries. The page says jurisdiction-specific behaviour (business tax, months-of-salary fee
conventions, ARC and work-permit types) follows from where the operator is licensed, not from
an assumed route.

~~**`/about` still contradicts this**~~ — **resolved 2026-08-14** on niko's instruction. `/about`
now describes three parties without assuming countries and carries the same "Where it works"
framing. The VSATW / V-GEN TRIDENT history stays, reworded as *the first corridor it ran, not
the shape of the product* — the 08-11 decision says the corridor is the first instance, not the
model, so deleting the history would have been the opposite error.

## Known gap

**English only.** `/about` and `/privacy-policy` are already English-only, so this is
consistent with precedent — but the audience is Taiwanese agencies and the recruiter workspace
is bilingual EN/繁中, so Traditional Chinese is the obvious next step. Copy is held in
top-of-file arrays (`STEPS`, `GUARANTEES`, `ROLE_NOTES`) rather than inline JSX specifically so
translating it later is mechanical.

## Verified

`/how-it-works` 200. No horizontal overflow at 1440px, 390px, or in dark. The SVG themes via
CSS custom properties in both modes — one copy of the markup, not two. Body line length capped
at 64ch after measuring 914px on the first pass. Added to `sitemap.ts` (priority 0.8) and the
footer. tsc 0, lint 0 errors.

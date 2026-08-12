---
title: The /documentation route is closed — the manual ships as a file, not a URL
type: decision
slug: 2026-08-12-documentation-route-closed
date: 2026-08-12
updated: 2026-08-12
attributed_to: [niko]
belongs_to: [platform-manual, data-privacy]
source: request
status: accepted
tags: [privacy, client-exposure, manual, public-assets]
related: [platform-manual, data-privacy, 2026-08-11-corridor-agnostic-positioning]
---

## The ask

niko: *"close the documentation. no more yangluck. i'll update screenshots later."*

Following the branding removal on 08-11: the header stopped saying Yang Luck, but
`/documentation` still served a manual titled "Yang Luck 揚運 build" containing 51 inlined
screenshots of the client's live workspace — pipeline, candidate drawer with names and
nationalities, clients, invoices. A larger exposure than the header ever was.

## What "closing it" actually required

Removing the `next.config.ts` rewrite **would not have closed it.** The manual is a static
file in `public/`, so it was served at `/documentation.html` directly; the rewrite only added
the prettier URL. The route and the file are two separate exposures and both had to go.

That generalises, and is the reason for the rest of this change: **nothing under `public/` is
private.** It is served at a guessable URL whether or not the app links to it.

Removed from `public/`:

| Asset | Was reachable at | Linked from the app? |
|---|---|---|
| `documentation.html` (8.8 MB) | `/documentation`, `/documentation.html` | footer |
| `tecxwork-manual{,-zh,-vi}.pptx` (13 MB) | `/tecxwork-manual.pptx` etc. | **no** |
| `demo/{kanban-board,candidate-drawer,browse-companies}.png` | `/demo/*.png` | **no** |

The three unlinked decks and three unlinked PNGs are the point: nobody put a link to them and
they were public anyway. The PNGs show a kanban board of named candidates against named client
companies (麗明營造, 揚運機電, 長隆人力資源); `DEMO.md` describes them as pitch-deck assets, so
they moved to `docs/pitch-assets/` rather than being deleted.

## The trap this leaves, and the fix

The build wrote straight back into `public/`. Re-running `build.py` after a re-capture would
have silently restored every file this change removed — the exposure would have come back as a
side effect of a routine rebuild, with nobody deciding anything.

So `build.py` and `build_pptx.py` now emit to `docs/manual/dist/`, which is gitignored (the
repo is public, so committing the built manual re-exposes it a different way). Publishing is
now a deliberate copy into `public/` plus restoring the rewrite and footer link — documented
in `docs/manual/README.md` under "If you put it back".

The decks' closing slide advertised `yangluck.tecxmate.com/documentation`; that URL is now a
404 and client-branded, so the slide no longer names a URL at all.

## What this does NOT do

- **Git history still has all of it,** and the repo is public. `public/documentation.html` and
  the source screenshots under `docs/manual/src/screenshots/` are readable by anyone who clones
  it. Deleting from HEAD is not deletion. Closing that properly means either a history rewrite
  or making the repo private, and is niko's call.
- The source screenshots are deliberately kept — niko is re-capturing against a de-branded
  dataset, and the build needs them until then.

## Verified

Dev server (port read from its own startup line, after the 08-12 stale-server lesson):
`/documentation` 404, `/documentation.html` 404, all three `.pptx` 404, `/demo/*.png` 404,
`/tutorial` still 200. Rendered footer carries five links and the string "documentation"
appears zero times in the served HTML. tsc 0, lint 0 errors.

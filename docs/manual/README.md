# Platform Manual

A single self-contained file documenting every screen and function of the platform across
all four roles, in English, 繁體中文 and Tiếng Việt. All 51 screenshots are embedded as
base64 WebP, so the same file works served over the web *and* offline — over email, or from
a USB stick. No build step, no assets folder, no network access.

**Not hosted.** `/documentation` was taken down on 2026-08-12: the manual inlines 51
screenshots of a live workspace — a client's pipeline, candidates and invoices — and the
route served them to anyone who guessed the URL. It is handed over as a file now.

**Locally:** `open docs/manual/dist/documentation.html` (run the build first).

### If you put it back

Copy the built file into `public/` and restore the rewrite in `next.config.ts`
(`{ source: "/documentation", destination: "/documentation.html" }`) plus the footer link in
`src/components/site-footer.tsx`. Do that only once the screenshots are re-captured against
a demo dataset that names no real client. **Nothing under `public/` is private** — it is
served at a guessable URL whether or not the app links to it, which is why the build writes
to `dist/` and publishing is a separate, deliberate step.

## Two builds from one source

| Output | Where | Internal notes |
|--------|-------|----------------|
| `dist/documentation.html` | handed over as a file; gitignored | **stripped** |
| `src/artifact-fragment.html` | private Claude artifact | kept |

Anything wrapped in `data-internal` — currently the "Notes & known gaps" section, which names
an unfixed bug and its source file — is removed from the public build, *including its strings
in the injected translation dictionary*. Removing it from the DOM alone would leave the
sentences sitting in the JSON blob, findable in view-source. Marking blocks in the one source
beats maintaining two documents that drift.

Private artifact (full version):
https://claude.ai/code/artifact/dc62f299-3a37-43be-86e9-99e93d412d9e

## Structure

Four "Acts" following real end-to-end journeys rather than route order:

| Act | Role | Steps |
|-----|------|-------|
| 1 | Applicant | 14 — arrive → sign up → profile → browse → apply → book → track |
| 2 | Employer (client company) | 6 — signup → post job → triage applicants → interview day |
| 3 | Agency (ATS) | 6 — pipeline → candidate → clients → compliance → reports |
| 4 | Admin | 6 — bookings → moderation → registries → settings |

Plus orientation (roles/access matrix, full screen map) and reference (i18n, notifications,
PIPA, known gaps).

## Editing

Edit `src/manual.src.html` — it is the same HTML with `{{IMG:name}}` and
`{{IMG_BARE:name}}` placeholders instead of megabytes of base64, so it stays readable and
diffable. Then rebuild:

```bash
python3 docs/manual/src/build.py
```

The build fails loudly on an unresolved placeholder or a missing screenshot, and reports any
screenshot in `src/screenshots/` that no longer appears in the document.

### Two outputs, one source

| File | Form | Why |
|------|------|-----|
| `dist/documentation.html` | full document | has `<!doctype>`, `<meta charset="utf-8">` and a viewport tag |
| `src/artifact-fragment.html` | bare fragment | the Artifact publisher supplies its own `<head>` |

**The charset tag is load-bearing.** Opened from disk (`file://`) without it, a browser
guesses Latin-1 and every em dash, middot and CJK character becomes mojibake —
`Yang Luck 揚運` renders as `Yang Luck æ¬é‹`. Don't strip it from the standalone file.

## Image resolution (don't lower this casually)

Screenshots are encoded at **2100 px wide** and rendered at a pinned **1050 px**, giving a
true 2x on Retina displays. Both numbers must move together — they are the reason the
screenshots look sharp rather than soft:

| Stage | Value |
|-------|-------|
| Playwright capture (`deviceScaleFactor: 2`) | 2880 px wide |
| `optimize.py` `TARGET_WIDTH` | 2100 px |
| Rendered width (`figure img{max-width}`) | 1050 px |
| Effective pixel ratio | **2.04x** |

An earlier build encoded at 1320 px and let images render at up to 1150 px — about 1.15x,
which reads as blurry on any modern display. The detail was always in the capture; it was
being thrown away at the optimize step. It also capped height at 2600 px, which silently
truncated the five tallest pages. There is now no height cap.

The cost is page weight: ~7.4 MB. Lazy loading keeps the first screen fast, and the
Artifact ceiling is 16 MB, so there is headroom.

## Languages (English · 繁體中文 · Tiếng Việt)

One page carries all three languages and swaps text at runtime. Three separate pages would
store the 7.4 MB of base64 screenshots three times (22 MB); this way the trilingual manual is
7.7 MB — 0.2 MB more than English alone — and the reader gets a switcher instead of three URLs.

```bash
python3 docs/manual/src/i18n_extract.py    # tag new/changed prose -> strings/en.json
python3 docs/manual/src/i18n_autofill.py   # copy "✓", "—", <code>routes</code> verbatim
# translate the remaining keys into strings/zh.json and strings/vi.json
python3 docs/manual/src/build.py
node docs/manual/src/check-i18n.mjs docs/manual/dist/documentation.html
```

Keys live in the source as `data-t="N"` and are reused, so rewording a sentence keeps its
translations. **`build.py` fails the build** if any language is missing a key or carries one
the source no longer has — the alternative is a Chinese page quietly stating something the
English stopped saying months ago.

Literal UI strings are deliberately *not* translated: routes, `demo1234`, the demo email
addresses, and button labels that really are English in the product. The glossary explains
why a few screens still say "Student" where the manual says "applicant".

## PowerPoint decks

```bash
node /tmp/render-diagrams.mjs                    # SVG diagrams -> PNG (python-pptx can't embed SVG)
python3 docs/manual/src/build_pptx.py en zh vi
```

Produces `docs/manual/dist/tecxwork-manual{,-zh,-vi}.pptx` — 43 slides each, 16:9, ~4 MB.

The deck is **parsed out of `manual.src.html`**, not retyped: every screen slide takes its
step number, title, route, purpose and control list from the same markup the HTML renders,
and translated decks reuse the same i18n dictionaries. So the deck cannot quietly drift from
the manual.

Layout: text column left, screenshot **full-bleed on the right**. An earlier version put the
screenshot in a box under a header and it was too small to read — on a slide the screenshot
*is* the content, so it gets the larger half and no margin. Pages taller than 1.05:1 are
cropped to their top and the slide says so.

`/tmp/preview_pptx.py` renders slides to HTML by reading geometry back out of the saved
file, which is how the layout gets checked (PowerPoint's AppleScript PNG export is blocked by
its sandbox). Note it does not render autoshape fills, so step badges look blank in the
preview while being correct in the file.

## Screenshot lightbox

Every screenshot is tap-to-enlarge, with next/prev across all 51, arrow keys, swipe, and a
zoom toggle. Zoom renders at the screenshots' 1x design width (1050px) and pans — fitting to
a phone viewport is barely larger than the in-page image, which would make "enlarge"
pointless.

```bash
node docs/manual/src/check-lightbox.mjs docs/manual/dist/documentation.html
```

Two things not to undo:
- The overlay is **opaque** (`#0A0810`), not translucent-with-`backdrop-filter`. WebKit
  composites a backdrop-filtered element's backdrop unevenly and the page stayed legible
  through a 94%-opaque layer.
- The two explanatory SVG diagrams are **excluded** from the gallery — they are vector and
  already legible, and would read as broken entries between screenshots.

Note the swipe check runs in Chromium: headless WebKit refuses synthesised touches
(`new Touch(...)` is an "Illegal constructor", `document.createTouch` throws). The handler is
browser-agnostic JS; the WebKit-specific concerns are covered by the other checks.

## Mobile navigation

Below 1080px the sidebar becomes an off-canvas drawer behind a sticky **Contents** bar —
otherwise all 41 entries sit in the document flow and every visit begins by scrolling past
the whole table of contents. It opens scrolled to the section you are currently reading, and
closes on link tap, backdrop tap, the close button, or Escape.

```bash
node docs/manual/src/check-mobile-nav.mjs docs/manual/dist/documentation.html
```

16 checks in WebKit at iPhone size. The one most worth keeping is the body scroll lock:
opening the drawer sets `overflow:hidden` on `<body>`, and every dismissal path must clear
it — a single missed path leaves the whole document unscrollable with no obvious cause.

## Checking the sidebar links

```bash
node docs/manual/src/check-anchors.mjs docs/manual/dist/documentation.html
```

Every `<img>` **must** carry `width`/`height` — `build.py` adds them automatically from each
WebP's header. Without them a lazily-decoded image reserves no space, so during a long smooth
scroll the images above the target finish loading, the document grows, and the jump lands
thousands of pixels short. Clicking "4.1 Every booking" landed on "2.4 Company profile".

The test runs in **WebKit with smooth scrolling on**, because that is the only combination
that reproduces it: Chromium decodes `data:` URI images immediately regardless of
`loading="lazy"`, and an instant jump gives images no chance to shift the target mid-flight.
A Chromium test, or one that disables smooth scrolling, passes vacuously on a broken build.

## Re-capturing screenshots

`src/capture-all.mjs` drives Playwright across five role passes. It needs a dev server
running against the **demo** database — never `.env.local`, which points at production.
See `docs/wiki/topics/demo-db-manual-capture.md` for the connection string, the migrations
the demo DB needs, and the seeding required to make the interview screens non-empty.

```bash
export DATABASE_URL="<tecxwork-yl-demo pooled URL>"
npm run dev
node docs/manual/src/capture-all.mjs                     # writes raw PNGs
python3 docs/manual/src/optimize.py --from <png-dir>     # -> src/screenshots/*.webp
python3 docs/manual/src/build.py                         # -> the two HTML outputs
```

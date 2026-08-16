# Repainting the brand in captured screenshots

The manual's screenshots were captured against the Yang Luck demo. Re-capturing them means
standing up a de-branded database and driving `capture-all.mjs` over 63 pages; this
directory does the cheap version instead, for the two surfaces where it is safe:

- **the header lockup** — logo tile + wordmark, 49 occurrences
- **the footer line** — `(c) 2026 <brand> by TECXMATE.COM` + the link row, 62 occurrences

Both are fixed-size elements on a flat background, which is the whole reason this works.
Anything else — headings, hero copy, seeded content — is not repaintable at a sensible cost
and needs a real re-capture. See
`docs/wiki/decisions/2026-08-16-screenshot-rebrand-by-repaint.md`.

## Why it does not look pasted on

The replacement art is rendered by the same browser at `capture-all.mjs`'s device scale
factor (2, off a 1440px viewport) and then downscaled by `optimize.py`'s factor
(2100/2880). It therefore goes through the same rasterisation and the same LANCZOS
resample as the pixels around it. Fonts are the real Instrument Serif and Geist, pulled out
of the Next font cache rather than substituted.

Files are re-encoded at `optimize.py`'s quality 78 / method 6. That is one extra lossy
generation for the untouched pixels; at 2x zoom it is not distinguishable from the first.

## Running it

Needs `playwright-core` (already a dependency), Pillow, numpy, scipy, and a dev build in
`.next/` so the fonts are on disk.

```sh
export REBRAND_DIR=/tmp/rebrand          # scratch space; anywhere writable
mkdir -p "$REBRAND_DIR"
cp public/icon.svg docs/manual/src/rebrand/{lockup,footer}.html "$REBRAND_DIR"/

# The Next font cache names files by hash. Find the two faces the lockup and footer need:
python3 - <<'PY'
from fontTools.ttLib import TTFont
import glob, shutil, os
want = {("Instrument Serif", "Italic"): ["is-a.woff2", "is-b.woff2"], ("Geist", None): ["geist.woff2"]}
for p in sorted(glob.glob(".next/dev/static/media/*.woff2")):
    n = TTFont(p, lazy=True)["name"]
    key = (n.getDebugName(1), n.getDebugName(2) if n.getDebugName(1) == "Instrument Serif" else None)
    if key in want and want[key]:
        shutil.copy(p, os.path.join(os.environ["REBRAND_DIR"], want[key].pop(0)))
PY

node docs/manual/src/rebrand/render-lockup.mjs
node docs/manual/src/rebrand/render-footer.mjs
# then downscale both PNGs by 2100/2880 with LANCZOS to <name>-2100.png

python3 docs/manual/src/rebrand/patch.py --dry          # inspect fills first
python3 docs/manual/src/rebrand/patch.py
python3 docs/manual/src/rebrand/patch_footer.py --dry
python3 docs/manual/src/rebrand/patch_footer.py
python3 docs/manual/src/build.py                        # the fragment inlines the images
```

Both patch scripts are **not idempotent in reverse**: they find the *old* brand, so
re-running them after a successful pass simply finds nothing. Run them against a clean
checkout of `screenshots/`, not against already-patched files with a new template.

## Reading the dry-run output

- `d=` on a lockup is the mean grey-level difference against the reference template. Real
  lockups land at 0.4–3.1. This check exists because anchoring on the logo's red alone also
  matches the job-moderation table's red **Reject** buttons — 210 of them.
- `flat=` is how far the frame just outside a fill strays from the colour about to be
  painted over it. Anything above ~10 means the fill would flatten a border or gradient and
  the box needs narrowing. Worst observed across 111 fills: 0.63.

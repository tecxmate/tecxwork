"""Repaint the site footer line in the manual screenshots.

The lockup swap leaves the brand's name behind: every capture ends with
"(c) 2026 Yang Luck by TECXMATE.COM", and the link row still offers Documentation, a
page that no longer exists. Both are one centred line of text on a flat surface, so the
same repaint applies -- measure the old line, fill it, composite a freshly rendered one.

The replacement is rendered from a copy of SiteFooter's own markup by the same browser at
capture-all.mjs's device scale factor, then downscaled by optimize.py's factor, so its
glyphs are rasterised and resampled exactly like the ones beside them.

Alignment: both the old line and the new one begin with "(c) 2026 ", so their ink tops
are the same feature and can be matched directly; matching bounding-box centres instead
would shift the baseline, because the old box is deepened by descenders and CJK the new
one does not have. Horizontally the line is centred, so the new one is centred on the old
one's midpoint -- the page centre on full-width pages, the content centre on the recruiter
pages with a rail.
"""
from PIL import Image
import numpy as np, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from footer_anchor import anchor, line_extent

D = "docs/manual/src/screenshots"
WORK = os.environ.get("REBRAND_DIR", "/tmp/rebrand")
LINE = os.path.join(WORK, "footer-line-2100.png")
QUALITY, METHOD = 78, 6          # optimize.py
PAD_X, PAD_Y = 10, 6
FLAT_TOL = 10


def flatness(a, box, bg):
    x0, y0, x1, y1 = box
    fr = 4
    ys0, ys1 = max(0, y0 - fr), min(a.shape[0], y1 + fr)
    xs0, xs1 = max(0, x0 - fr), min(a.shape[1], x1 + fr)
    frame = np.concatenate([
        a[ys0:y0, xs0:xs1].reshape(-1, 3), a[y1:ys1, xs0:xs1].reshape(-1, 3),
        a[y0:y1, xs0:x0].reshape(-1, 3), a[y0:y1, x1:xs1].reshape(-1, 3)])
    return float(np.abs(frame - bg).max(axis=1).mean()) if len(frame) else 0.0


def patch(path, line, dry=False):
    img = Image.open(path).convert("RGB")
    a = np.asarray(img).astype(int)
    anc = anchor(a)
    if anc is None:
        return None
    bg = a[a.shape[0] - 3, a.shape[1] - 4]
    e = line_extent(a, anc, bg)

    la = np.asarray(line)
    lys, lxs = np.nonzero(la[..., 3] > 24)
    px = int(round((e["x0"] + e["x1"]) / 2 - (int(lxs.min()) + int(lxs.max())) / 2))
    py = int(e["y0"] - int(lys.min()))
    box = (max(0, e["x0"] - PAD_X), max(0, e["y0"] - PAD_Y),
           min(img.width, e["x1"] + 1 + PAD_X), min(img.height, e["y1"] + 1 + PAD_Y))
    flat = flatness(a, box, np.array(bg))
    info = dict(line=e, paste=(px, py), box=box, flat=flat,
                bg=tuple(int(v) for v in bg))
    if not dry:
        img.paste(info["bg"], box)
        img.paste(line, (px, py), line)
        img.save(path, "WEBP", quality=QUALITY, method=METHOD)
    return info


if __name__ == "__main__":
    dry = "--dry" in sys.argv
    line = Image.open(LINE).convert("RGBA")
    print(f"line {line.size}  mode={'DRY RUN' if dry else 'WRITING'}\n")
    n = miss = 0
    worst = (0, None)
    for f in sorted(os.listdir(D)):
        info = patch(os.path.join(D, f), line, dry=dry)
        if info is None:
            miss += 1
            print(f"{f:42s} no footer on this page")
            continue
        n += 1
        if info["flat"] > worst[0]:
            worst = (info["flat"], f)
        flag = "  <-- BACKGROUND NOT FLAT" if info["flat"] > FLAT_TOL else ""
        print(f"{f:42s} fill={info['box']} paste={info['paste']} "
              f"flat={info['flat']:5.2f}{flag}")
    print(f"\n{n} footers {'to patch' if dry else 'patched'}, {miss} skipped; "
          f"worst frame deviation {worst[0]:.2f} on {worst[1]}")

"""Locate every Yang Luck lockup (logo tile + wordmark) in the manual screenshots.

Two stages, because neither alone is safe:

1. Anchor on the red stripes of the Yang Luck mark. Cheap, but red is not unique — the
   job-moderation table's "Reject" buttons are red too, and they matched.
2. Verify each anchor against a template cut from a known-good lockup. The lockup is
   rendered from the same asset at the same size everywhere, so a real one matches to a
   few grey levels and a red button does not.

The lockup's extent is then measured rather than assumed: the shots span three layouts
(top bar, rail + top bar, centred auth card) and two logo sizes.
"""
from PIL import Image
import numpy as np, os
from scipy import ndimage

D = "docs/manual/src/screenshots"
# The mark inside the logo tile of adm-03's header, our reference rendering.
REF = "adm-03-job-moderation.webp"
REF_MARK = (155, 24, 197, 64)   # x0, y0, x1, y1
REF_TILE = (153, 19, 201, 67)   # the 48x48 plate the mark sits on
SCALES = (1.0, 1.5)             # BrandMark size="sm" and size="lg"
MATCH_MAX = 26.0                # mean abs grey difference still counted as the logo


def _grey(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def load_template():
    a = np.asarray(Image.open(os.path.join(D, REF)).convert("RGB")).astype(float)
    x0, y0, x1, y1 = REF_MARK
    return _grey(a[y0:y1, x0:x1])


def red_blobs(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (r > 120) & (r - g > 45) & (r - b > 45)
    # Close the gaps between the mark's separate stripes so one logo is one blob.
    m = ndimage.binary_dilation(m, np.ones((9, 9), bool))
    lab, _ = ndimage.label(m)
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        ys, xs = sl
        if int((lab[sl] == i).sum()) < 120:
            continue
        out.append((xs.start, ys.start, xs.stop, ys.stop))
    return out


def verify(a, blob, tpl):
    """Best template score over plausible offsets and both logo sizes."""
    g = _grey(a.astype(float))
    th, tw = tpl.shape
    # Where the mark's red starts, relative to the template's own red.
    best = (1e9, None)
    for s in SCALES:
        t = np.asarray(Image.fromarray(tpl.astype(np.uint8)).resize(
            (int(round(tw * s)), int(round(th * s))), Image.LANCZOS)).astype(float)
        h, w = t.shape
        # Template red starts 2px in from its left edge and 0 from its top at scale 1.
        ox, oy = blob[0] - int(round(2 * s)), blob[1] - int(round(0 * s))
        for dy in range(-5, 6):
            for dx in range(-5, 6):
                y, x = oy + dy, ox + dx
                if y < 0 or x < 0 or y + h > g.shape[0] or x + w > g.shape[1]:
                    continue
                d = float(np.abs(g[y:y + h, x:x + w] - t).mean())
                if d < best[0]:
                    best = (d, (x, y, w, h, s))
    return best


def bg_of(a, box, pad=16):
    x0, y0, x1, y1 = box
    ys0, ys1 = max(0, y0 - pad), min(a.shape[0], y1 + pad)
    xs0, xs1 = max(0, x0 - pad), min(a.shape[1], x1 + pad)
    band = a[ys0:ys1, xs0:xs1].reshape(-1, 3)
    cols, counts = np.unique(band, axis=0, return_counts=True)
    return cols[counts.argmax()]


def extent(a, tile, gap=26, reach=560):
    """Grow from the tile to the full lockup: tile + wordmark, stopping at open space."""
    tx, ty, tw, th = tile
    cy = ty + th // 2
    half = int(th * 0.9)
    y0, y1 = max(0, cy - half), min(a.shape[0], cy + half)
    x0, x1 = max(0, tx - reach), min(a.shape[1], tx + tw + reach)
    band = a[y0:y1, x0:x1]
    bg = bg_of(a, (tx, ty, tx + tw, ty + th))
    ink = np.abs(band - bg).max(axis=2) > 14
    # A column inked top-to-bottom is a rule or panel edge, not part of the lockup.
    colink = ink.any(axis=0) & ~ink.all(axis=0)
    ac = tx + tw // 2 - x0
    L = ac
    while L > 0 and colink[max(0, L - gap):L].any():
        L -= 1
    R = ac
    while R < len(colink) - 1 and colink[R:min(len(colink), R + gap)].any():
        R += 1
    rows = np.nonzero(ink[:, L:R + 1].any(axis=1))[0]
    return dict(x0=x0 + L, x1=x0 + R, y0=y0 + int(rows.min()), y1=y0 + int(rows.max()),
                bg=tuple(int(v) for v in bg))


def find(path, tpl):
    a = np.asarray(Image.open(path).convert("RGB")).astype(int)
    hits = []
    for blob in red_blobs(a):
        score, m = verify(a, blob, tpl)
        if m is None or score > MATCH_MAX:
            hits.append(dict(rejected=True, score=score, blob=blob))
            continue
        x, y, w, h, s = m
        # Template offset back to the full tile box.
        tile = (x - int(round((REF_MARK[0] - REF_TILE[0]) * s)),
                y - int(round((REF_MARK[1] - REF_TILE[1]) * s)),
                int(round((REF_TILE[2] - REF_TILE[0]) * s)),
                int(round((REF_TILE[3] - REF_TILE[1]) * s)))
        e = extent(a, tile)
        hits.append(dict(rejected=False, score=score, scale=s, tile=tile, **e))
    return a, hits


if __name__ == "__main__":
    tpl = load_template()
    n_ok = n_rej = 0
    for f in sorted(os.listdir(D)):
        _, hits = find(os.path.join(D, f), tpl)
        ok = [h for h in hits if not h["rejected"]]
        rej = [h for h in hits if h["rejected"]]
        n_ok += len(ok); n_rej += len(rej)
        if not ok:
            print(f"{f:42s} NO LOCKUP   (rejected {len(rej)} red blobs)")
        for h in ok:
            print(f"{f:42s} s={h['scale']:.1f} d={h['score']:5.1f} "
                  f"tile={h['tile']} lockup=x[{h['x0']:4d},{h['x1']:4d}] "
                  f"y[{h['y0']:4d},{h['y1']:4d}] w={h['x1']-h['x0']+1:4d} "
                  f"h={h['y1']-h['y0']+1:3d} bg={h['bg']}")
    print(f"\nmatched {n_ok} lockups, rejected {n_rej} red blobs")

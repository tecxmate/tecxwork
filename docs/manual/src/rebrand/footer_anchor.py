"""Find the footer line by its one unambiguous landmark: the purple TECXMATE.COM link."""
from PIL import Image
import numpy as np
from scipy import ndimage


def anchor(a):
    """Bounding box of the purple TECXMATE.COM run in the footer, or None."""
    g, b = a[..., 1], a[..., 2]
    m = (b - g > 50) & (b > 140)
    m[:max(0, a.shape[0] - 140)] = False        # the footer line, not the page
    # Wide horizontal closing: the full stop in "TECXMATE.COM" splits the run in two.
    lab, _ = ndimage.label(ndimage.binary_dilation(m, np.ones((3, 17), bool)))
    best = None
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        ys, xs = sl
        h, w = ys.stop - ys.start, xs.stop - xs.start
        if not (11 <= h <= 22 and 130 <= w <= 200):
            continue
        if best is None or ys.start > best[1]:
            best = (xs.start, ys.start, xs.stop, ys.stop)
    return best


def line_extent(a, anc, bg, gap=34):
    """Grow left and right from the anchor to the ends of the footer line."""
    x0, y0, x1, y1 = anc
    cy = (y0 + y1) // 2
    yy0, yy1 = max(0, cy - 18), min(a.shape[0], cy + 18)
    ink = np.abs(a[yy0:yy1] - bg).max(axis=2) > 18
    col = ink.any(axis=0)
    L = x0
    while L > 0 and col[max(0, L - gap):L].any():
        L -= 1
    R = x1
    while R < len(col) - 1 and col[R:min(len(col), R + gap)].any():
        R += 1
    rows = np.nonzero(ink[:, L:R + 1].any(axis=1))[0]
    return dict(x0=L, x1=R, y0=yy0 + int(rows.min()), y1=yy0 + int(rows.max()))


if __name__ == "__main__":
    import os
    D = "docs/manual/src/screenshots"
    miss = 0
    for f in sorted(os.listdir(D)):
        a = np.asarray(Image.open(os.path.join(D, f)).convert("RGB")).astype(int)
        anc = anchor(a)
        if anc is None:
            miss += 1
            print(f"{f:42s} NO ANCHOR")
            continue
        bg = a[a.shape[0] - 3, a.shape[1] - 4]
        e = line_extent(a, anc, bg)
        print(f"{f:42s} anchor=x[{anc[0]},{anc[2]}] line=x[{e['x0']},{e['x1']}] "
              f"y[{e['y0']},{e['y1']}] centre={(e['x0']+e['x1'])/2:7.1f} h={e['y1']-e['y0']+1:2d}")
    print("misses:", miss)

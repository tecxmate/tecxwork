"""Swap the Yang Luck lockup for the TECXWORK one in the manual screenshots, in place.

Re-capturing the manual would mean standing up a de-branded demo database and driving
capture-all.mjs over 63 pages. The only thing wrong with these captures is the brand in
the header, and that brand occupies a known, flat-backgrounded rectangle — so it is
repainted instead: fill the old lockup's footprint with the surface colour underneath,
composite the TECXWORK lockup at the same origin.

The replacement is rendered by the same browser at the same device scale factor as
capture-all.mjs (2) and downscaled by the same factor as optimize.py (2100/2880), so it
carries the same sampling and the same softness as the pixels around it.

WebP is lossy, so saving costs the untouched pixels one extra generation. Quality 78 /
method 6 are optimize.py's own settings; at 2x zoom the second pass is not distinguishable
from the first, and keeping them means the files stay the size the manual budgets for.
"""
from PIL import Image
import numpy as np, os, sys, shutil

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from detect import D, load_template, find

WORK = os.environ.get("REBRAND_DIR", "/tmp/rebrand")
LOCKUP = os.path.join(WORK, "tecxwork-lockup-2100.png")
QUALITY, METHOD = 78, 6          # optimize.py
PAD = 3                          # covers the plate's faint 1px ring
FLAT_TOL = 10                    # how far the surrounding frame may stray from flat


def flatness(a, box, bg):
    """Is the frame just outside the fill area the same flat colour we will paint with?"""
    x0, y0, x1, y1 = box
    fr = 4
    ys0, ys1 = max(0, y0 - fr), min(a.shape[0], y1 + fr)
    xs0, xs1 = max(0, x0 - fr), min(a.shape[1], x1 + fr)
    frame = np.concatenate([
        a[ys0:y0, xs0:xs1].reshape(-1, 3), a[y1:ys1, xs0:xs1].reshape(-1, 3),
        a[y0:y1, xs0:x0].reshape(-1, 3), a[y0:y1, x1:xs1].reshape(-1, 3)])
    if not len(frame):
        return 0.0
    return float(np.abs(frame - bg).max(axis=1).mean())


def patch(path, tpl, lockup, dry=False):
    a, hits = find(path, tpl)
    ok = [h for h in hits if not h["rejected"]]
    if not ok:
        return None
    img = Image.open(path).convert("RGB")
    notes = []
    for h in ok:
        tx, ty, tw, th = h["tile"]
        bg = h["bg"]
        box = (min(tx, h["x0"]) - PAD, min(ty, h["y0"]) - PAD,
               max(tx + tw, h["x1"] + 1) + PAD, max(ty + th, h["y1"] + 1) + PAD)
        box = (max(0, box[0]), max(0, box[1]),
               min(img.width, box[2]), min(img.height, box[3]))
        f = flatness(np.asarray(img).astype(int), box, np.array(bg))
        notes.append(dict(box=box, bg=bg, flat=f, scale=h["scale"], score=h["score"]))
        if dry:
            continue
        mark = lockup
        if abs(h["scale"] - 1.0) > 0.01:
            mark = lockup.resize((round(lockup.width * h["scale"]),
                                  round(lockup.height * h["scale"])), Image.LANCZOS)
        img.paste(bg, box)
        # Same left edge, same optical centre line, as the lockup it replaces.
        img.paste(mark, (tx, ty + (th - mark.height) // 2), mark)
    if not dry:
        img.save(path, "WEBP", quality=QUALITY, method=METHOD)
    return notes


if __name__ == "__main__":
    dry = "--dry" in sys.argv
    tpl = load_template()
    lockup = Image.open(LOCKUP).convert("RGBA")
    print(f"lockup {lockup.size}  mode={'DRY RUN' if dry else 'WRITING'}\n")
    n = 0
    worst = []
    for f in sorted(os.listdir(D)):
        p = os.path.join(D, f)
        notes = patch(p, tpl, lockup, dry=dry)
        if notes is None:
            continue
        for nt in notes:
            n += 1
            worst.append((nt["flat"], f))
            flag = "  <-- BACKGROUND NOT FLAT" if nt["flat"] > FLAT_TOL else ""
            print(f"{f:42s} fill={nt['box']} bg={nt['bg']} "
                  f"flat={nt['flat']:5.2f} d={nt['score']:4.1f}{flag}")
    worst.sort(reverse=True)
    print(f"\n{n} lockups {'to patch' if dry else 'patched'}; "
          f"worst frame deviation {worst[0][0]:.2f} on {worst[0][1]}")

#!/usr/bin/env python3
"""Downscale raw Playwright PNG captures into the WebP files the manual embeds.

    python3 docs/manual/src/optimize.py --from /path/to/raw/pngs

Sizing rationale — the number that matters is TARGET_WIDTH:

  The manual renders each screenshot at roughly 980 CSS px (the content column minus the
  figure's padding). On a Retina display that is 1960 physical pixels, so anything narrower
  than ~1980 px is visibly soft no matter how high the JPEG/WebP quality is. Playwright
  captures at deviceScaleFactor 2 (2880 px wide), so the detail is there in the source --
  the only way to lose it is to downscale too far here.

  Going beyond ~1980 px buys nothing on a 2x display and costs real bytes: the full 2880 px
  captures come to ~11 MB once base64-encoded, against ~7.5 MB at 1980 px.

There is deliberately NO maximum height. An earlier version capped it, which silently
truncated the five tallest pages (the tutorial page lost two thirds of its content) with
nothing in the document to say so. A long page simply produces a long image.
"""
from __future__ import annotations

import argparse
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  python3 -m pip install Pillow")

HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.join(HERE, "screenshots")

TARGET_WIDTH = 2100   # 2x the 1050px pinned render width (see manual.src.html)
QUALITY = 78          # WebP; visually lossless for UI screenshots at this scale
METHOD = 6            # slowest/best WebP compression search


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--from", dest="src", required=True,
                    help="directory of raw .png captures from capture-all.mjs")
    ap.add_argument("--width", type=int, default=TARGET_WIDTH)
    ap.add_argument("--quality", type=int, default=QUALITY)
    args = ap.parse_args()

    if not os.path.isdir(args.src):
        sys.exit("no such directory: " + args.src)

    os.makedirs(OUTDIR, exist_ok=True)
    names = sorted(f for f in os.listdir(args.src) if f.endswith(".png"))
    if not names:
        sys.exit("no .png files in " + args.src)

    total = 0
    for name in names:
        img = Image.open(os.path.join(args.src, name)).convert("RGB")
        w, h = img.size
        scale = min(args.width / w, 1.0)
        if scale < 1.0:
            img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
        out = os.path.join(OUTDIR, name[:-4] + ".webp")
        img.save(out, "WEBP", quality=args.quality, method=METHOD)
        total += os.path.getsize(out)

    print("%d screenshots -> %s" % (len(names), OUTDIR))
    print("%.2f MB on disk, ~%.2f MB once base64-encoded into the page"
          % (total / 1024 / 1024, total * 1.34 / 1024 / 1024))
    print("run  python3 docs/manual/src/build.py  to rebuild the manual")


if __name__ == "__main__":
    main()

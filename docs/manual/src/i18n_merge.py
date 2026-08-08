#!/usr/bin/env python3
"""Merge a batch of translations into strings/<lang>.json.

    python3 i18n_merge.py zh <<'JSON'
    {"12": "…", "13": "…"}
    JSON

Reports coverage against strings/en.json so it is obvious what is still missing.
"""
from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
STRINGS = os.path.join(HERE, "strings")


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: i18n_merge.py <lang>   (batch JSON on stdin)")
    lang = sys.argv[1]
    batch = json.load(sys.stdin)

    path = os.path.join(STRINGS, lang + ".json")
    current = {}
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            current = json.load(fh)

    with open(os.path.join(STRINGS, "en.json"), encoding="utf-8") as fh:
        en = json.load(fh)

    unknown = [k for k in batch if k not in en]
    if unknown:
        sys.exit("keys not present in en.json: " + ", ".join(unknown[:10]))

    current.update(batch)
    # keep key order aligned with the document
    ordered = {k: current[k] for k in en if k in current}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(ordered, fh, ensure_ascii=False, indent=1)

    missing = [k for k in en if k not in current]
    print("%s: +%d this batch, %d/%d done (%.0f%%), %d missing"
          % (lang, len(batch), len(ordered), len(en), 100 * len(ordered) / len(en), len(missing)))
    if missing:
        print("   next missing keys: " + ", ".join(missing[:14]))


if __name__ == "__main__":
    main()

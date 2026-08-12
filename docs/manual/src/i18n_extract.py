#!/usr/bin/env python3
"""Tag every translatable element in manual.src.html and dump the English strings.

    python3 docs/manual/src/i18n_extract.py

Why one file instead of three: the screenshots are 7.4 MB of base64. Building an English, a
Chinese and a Vietnamese page separately would store them three times (22 MB). Tagging the
text and swapping it at runtime stores them once, so the trilingual manual costs barely more
than the English one — and the reader gets a language switcher instead of three URLs.

Keys are written back into the source as `data-t="N"` and reused on every later run, so
editing a sentence keeps its key (and its translations) while a genuinely new element gets a
fresh one. build.py refuses to build if a translation file has keys the source no longer has,
or is missing keys the source does have, so drift is loud rather than silent.
"""
from __future__ import annotations

import json
import os
import re
import sys

try:
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("BeautifulSoup is required:  python3 -m pip install beautifulsoup4 lxml")

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "manual.src.html")
STRINGS = os.path.join(HERE, "strings")

# Elements whose inner HTML is prose worth translating.
TAGS = {"h1", "h2", "h3", "h4", "h5", "p", "li", "dt", "dd", "th", "td",
        "figcaption", "text", "title"}
# ...plus these, which are prose but not in the tag list above.
EXTRA_SELECTORS = [".who", ".mins", ".rj-role", ".rj-who", ".rj-go", ".lb-hint",
                   ".nav-bar-title", ".nav-toggle", ".legend-row > div", ".note",
                   "nav.rail a", ".theme-switch button"]
# Never translate: literal routes, code, and anything machine-readable.
SKIP_CLASSES = {"route"}
SKIP_TAGS = {"script", "style", "code"}
# Controls whose aria-label a reader hears.
ARIA_SELECTORS = [".nav-toggle", ".rail-close", "#lb-close", "#lb-prev", "#lb-next", "#lb-zoom"]


def translatable(soup):
    """Elements to tag, in document order, skipping any nested inside another."""
    picked = []
    chosen = set()
    for el in soup.find_all(True):
        if el.name in SKIP_TAGS:
            continue
        classes = set(el.get("class") or [])
        if classes & SKIP_CLASSES:
            continue
        matches = el.name in TAGS or any(el in soup.select(s) for s in ())  # placeholder
        if not matches:
            continue
        # skip if an ancestor was already chosen -- we translate the outermost unit
        if any(id(p) in chosen for p in el.parents):
            continue
        # skip empties and pure-placeholder nodes
        inner = el.decode_contents().strip()
        if not inner or re.fullmatch(r"\{\{[^}]+\}\}", inner):
            continue
        chosen.add(id(el))
        picked.append(el)
    return picked


def main() -> None:
    with open(SRC, encoding="utf-8") as fh:
        soup = BeautifulSoup(fh.read(), "html.parser")

    # union of tag-based and selector-based candidates, outermost-only
    candidates = []
    seen = set()
    for el in soup.find_all(True):
        if el.name in SKIP_TAGS:
            continue
        if set(el.get("class") or []) & SKIP_CLASSES:
            continue
        ok = el.name in TAGS
        if not ok:
            for sel in EXTRA_SELECTORS:
                if el in soup.select(sel):
                    ok = True
                    break
        if ok and id(el) not in seen:
            seen.add(id(el))
            candidates.append(el)

    chosen_ids = set()
    units = []
    for el in candidates:
        if any(id(p) in chosen_ids for p in el.parents):
            continue
        inner = el.decode_contents().strip()
        if not inner or re.fullmatch(r"\{\{[^}]+\}\}", inner):
            continue
        chosen_ids.add(id(el))
        units.append(el)

    # assign / reuse keys
    used = {int(e["data-t"]) for e in soup.select("[data-t]") if e.get("data-t", "").isdigit()}
    nxt = (max(used) + 1) if used else 1
    en = {}
    for el in units:
        key = el.get("data-t")
        if not key:
            key = str(nxt)
            nxt += 1
            el["data-t"] = key
        en[key] = el.decode_contents().strip()

    # aria-labels
    for sel in ARIA_SELECTORS:
        for el in soup.select(sel):
            if not el.get("aria-label"):
                continue
            key = el.get("data-ta")
            if not key:
                key = "a%d" % nxt
                nxt += 1
                el["data-ta"] = key
            en[key] = el["aria-label"]

    with open(SRC, "w", encoding="utf-8") as fh:
        fh.write(str(soup))

    os.makedirs(STRINGS, exist_ok=True)
    with open(os.path.join(STRINGS, "en.json"), "w", encoding="utf-8") as fh:
        json.dump(en, fh, ensure_ascii=False, indent=1)

    words = sum(len(re.findall(r"[A-Za-z][\w'’-]*", re.sub(r"<[^>]+>", " ", v))) for v in en.values())
    print("tagged %d translatable units (%d words) -> strings/en.json" % (len(en), words))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Copy language-neutral strings verbatim into every translation file.

    python3 docs/manual/src/i18n_autofill.py

A large share of the extracted units carry no prose at all: table cells that are just "✓" or
"—", and cells that are nothing but a literal route or demo credential in <code>. Those are
identical in English, Chinese and Vietnamese, so translating them by hand is pure noise and a
chance to introduce typos. This fills them in and leaves only real sentences to translate.

A unit is language-neutral when, after removing every <code>…</code> span and all tags, no
Latin letter and no CJK character remains.
"""
from __future__ import annotations

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
STRINGS = os.path.join(HERE, "strings")
LANGS = ("zh", "vi")


def neutral(html: str) -> bool:
    without_code = re.sub(r"<code>.*?</code>", " ", html, flags=re.S)
    text = re.sub(r"<[^>]+>", " ", without_code)
    text = text.replace("&amp;", " ").replace("&nbsp;", " ")
    return not re.search(r"[A-Za-z一-鿿]", text)


def main() -> None:
    with open(os.path.join(STRINGS, "en.json"), encoding="utf-8") as fh:
        en = json.load(fh)

    auto = {k: v for k, v in en.items() if neutral(v)}
    print("%d of %d units are language-neutral" % (len(auto), len(en)))

    for lang in LANGS:
        path = os.path.join(STRINGS, lang + ".json")
        current = {}
        if os.path.exists(path):
            with open(path, encoding="utf-8") as fh:
                current = json.load(fh)
        added = 0
        for k, v in auto.items():
            if k not in current:
                current[k] = v
                added += 1
        ordered = {k: current[k] for k in en if k in current}
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(ordered, fh, ensure_ascii=False, indent=1)
        missing = len(en) - len(ordered)
        print("  %s: +%d auto, %d/%d done, %d left to translate"
              % (lang, added, len(ordered), len(en), missing))


if __name__ == "__main__":
    main()

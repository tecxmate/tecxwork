#!/usr/bin/env python3
"""Inline the WebP screenshots into manual.src.html and emit both deliverables.

Two outputs, from one source:

  public/documentation.html          standalone document -- has <!doctype>, <meta charset>
                                     and a viewport tag, so it renders correctly both when
                                     served by the app at /documentation and when opened
                                     straight off disk (file://). Without the charset a
                                     browser guesses Latin-1 and every em dash, middot and
                                     CJK character turns into mojibake.

  artifact-fragment.html             bare fragment -- no doctype/html/head/body, because the
                                     Artifact publisher wraps it in its own skeleton (and
                                     supplies the charset itself). Passing a full document
                                     there would nest <html> inside <body>.
"""
from __future__ import annotations

import base64
import json
import os
import re
import struct

HERE = os.path.dirname(os.path.abspath(__file__))            # docs/manual/src
IMGDIR = os.path.join(HERE, "screenshots")
SRC = os.path.join(HERE, "manual.src.html")
# Served by the app at /documentation (rewritten to /documentation.html in
# next.config.ts) and equally openable straight off disk. One copy, not two.
OUT_STANDALONE = os.path.normpath(os.path.join(HERE, "..", "..", "..",
                                               "public", "documentation.html"))
OUT_FRAGMENT = os.path.join(HERE, "artifact-fragment.html")

MAX_MB = 15  # the Artifact publisher's ceiling is 16 MB; leave headroom


def alt_for(name: str) -> str:
    """Turn a screenshot slug into readable alt text."""
    text = name.replace("-", " ")
    for prefix in ("pub ", "app ", "rec ", "adm ", "flow "):
        text = text.replace(prefix, "")
    return re.sub(r"^\d+\s*", "", text).strip()


def _path(name: str) -> str:
    path = os.path.join(IMGDIR, name + ".webp")
    if not os.path.exists(path):
        raise SystemExit("MISSING IMAGE: " + path)
    return path


def data_uri(name: str) -> str:
    with open(_path(name), "rb") as fh:
        return "data:image/webp;base64," + base64.b64encode(fh.read()).decode("ascii")


def dimensions(name: str) -> tuple[int, int]:
    """Pixel size of a lossy (VP8) WebP, read straight from the RIFF header.

    Every img MUST carry width/height. Without them a lazily-loaded image reserves no space
    until it decodes, so the document's height grows as you scroll -- and an in-page anchor
    jump lands on whatever happened to be at that offset before the images above it loaded.
    (Clicking "4.1 Every booking" used to land on "2.4 Company profile".) With the attributes
    present the browser derives an aspect-ratio box up front and the layout never shifts.
    """
    with open(_path(name), "rb") as fh:
        head = fh.read(30)
    if head[:4] != b"RIFF" or head[8:12] != b"WEBP":
        raise SystemExit("not a WebP: " + name)
    if head[12:16] != b"VP8 ":
        raise SystemExit("expected lossy VP8 WebP (optimize.py's output): " + name)
    # VP8 keyframe: 3-byte tag, 3-byte start code, then 16-bit LE width/height (14-bit each).
    w, h = struct.unpack("<HH", head[26:30])
    return w & 0x3FFF, h & 0x3FFF


def render(src: str) -> tuple[str, list[str]]:
    """Substitute every {{IMG}} / {{IMG_BARE}} placeholder. Returns (html, used names)."""
    used: list[str] = []

    def figure(match: re.Match[str]) -> str:
        name = match.group(1)
        used.append(name)
        w, h = dimensions(name)
        return (
            '<figure><img src="%s" alt="Screenshot: %s" width="%d" height="%d" '
            'loading="lazy" decoding="async"></figure>'
            % (data_uri(name), alt_for(name), w, h)
        )

    def bare(match: re.Match[str]) -> str:
        name = match.group(1)
        used.append(name)
        w, h = dimensions(name)
        return (
            '<img src="%s" alt="Screenshot: %s" width="%d" height="%d" '
            'loading="lazy" decoding="async" class="inline-shot">'
            % (data_uri(name), alt_for(name), w, h)
        )

    html = re.sub(r"\{\{IMG:([a-z0-9\-]+)\}\}", figure, src)
    html = re.sub(r"\{\{IMG_BARE:([a-z0-9\-]+)\}\}", bare, html)

    leftover = re.findall(r"\{\{[^}]+\}\}", html)
    if leftover:
        raise SystemExit("UNRESOLVED PLACEHOLDERS: " + ", ".join(sorted(set(leftover))))
    return html, used


def wrap_standalone(fragment: str) -> str:
    """Wrap the fragment in a real document so file:// opens render correctly."""
    # Match attributes too: the title carries a data-t key so it translates with everything
    # else, and it is moved into <head> intact rather than rebuilt.
    title_match = re.search(r"<title[^>]*>.*?</title>", fragment, re.S)
    title_tag = title_match.group(0) if title_match else "<title>TECXWORK User Manual</title>"
    body = re.sub(r"<title[^>]*>.*?</title>\s*", "", fragment, count=1, flags=re.S)

    return (
        "<!doctype html>\n"
        '<html lang="en">\n'
        "<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "%s\n"
        '<meta name="description" content="User manual for TECXWORK, a hiring platform '
        'connecting Vietnamese and Indonesian applicants with Taiwanese employers. Every '
        'screen and control, for applicants, employers, agency recruiters and admins.">\n'
        "<style>*{box-sizing:border-box}body{margin:0}</style>\n"
        "</head>\n"
        "<body>\n%s\n</body>\n</html>\n" % (title_tag, body.strip())
    )


def i18n_payload(keep: set[str] | None = None) -> str:
    """Inline the translation dictionaries, refusing to build if any language has drifted.

    `keep` restricts the payload to the keys still present in the document. The public build
    needs this: stripping the internal section removes it from the DOM, but its sentences
    would otherwise survive verbatim inside the injected JSON and be findable in view-source.

    Silent drift is the real risk here: a sentence gets reworded in English, its key keeps
    the old translation, and the Chinese page quietly says something that is no longer true.
    So a missing or orphaned key is a build failure, not a warning.
    """
    strings = os.path.join(HERE, "strings")
    with open(os.path.join(strings, "en.json"), encoding="utf-8") as fh:
        en = json.load(fh)

    payload = {"en": en}
    for lang in ("zh", "vi"):
        path = os.path.join(strings, lang + ".json")
        if not os.path.exists(path):
            raise SystemExit("missing translation file: " + path)
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        missing = [k for k in en if k not in data]
        orphan = [k for k in data if k not in en]
        if missing:
            raise SystemExit("%s.json is missing %d key(s): %s"
                             % (lang, len(missing), ", ".join(missing[:12])))
        if orphan:
            raise SystemExit("%s.json has %d key(s) the source no longer has: %s"
                             % (lang, len(orphan), ", ".join(orphan[:12])))
        payload[lang] = data

    if keep is not None:
        payload = {lang: {k: v for k, v in d.items() if k in keep} for lang, d in payload.items()}

    blob = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    # </script> inside a translated string would end the block early
    blob = blob.replace("</", "<\\/")
    print("i18n: %d units × %d languages" % (len(payload["en"]), len(payload)))
    return "<script>window.__I18N=" + blob + ";</script>\n"


def strip_internal(html: str) -> tuple[str, int]:
    """Remove every element marked `data-internal`.

    The public build is served from the marketing site, so the "Notes & known gaps" section
    -- which names an unfixed bug and its source file -- is cut from it. The same section is
    genuinely useful internally, so it stays in the artifact fragment. Marking the blocks in
    the source rather than maintaining two documents keeps the two from drifting apart.
    """
    from html.parser import HTMLParser

    class Stripper(HTMLParser):
        def __init__(self) -> None:
            super().__init__(convert_charrefs=False)
            self.out: list[str] = []
            self.depth = 0          # nesting depth inside a data-internal element
            self.tag_stack: list[str] = []
            self.removed = 0

        def handle_starttag(self, tag, attrs):
            internal = any(k == "data-internal" for k, _ in attrs)
            if self.depth:
                if tag not in VOID:
                    self.depth += 1
                return
            if internal:
                self.removed += 1
                self.depth = 1 if tag not in VOID else 0
                return
            self.out.append(self.get_starttag_text())

        def handle_startendtag(self, tag, attrs):
            if self.depth:
                return
            self.out.append(self.get_starttag_text())

        def handle_endtag(self, tag):
            if self.depth:
                self.depth -= 1
                return
            self.out.append("</%s>" % tag)

        def _emit(self, text):
            if not self.depth:
                self.out.append(text)

        handle_data = _emit
        handle_comment = lambda self, d: self._emit("<!--%s-->" % d)
        handle_entityref = lambda self, n: self._emit("&%s;" % n)
        handle_charref = lambda self, n: self._emit("&#%s;" % n)
        handle_decl = lambda self, d: self._emit("<!%s>" % d)

    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
            "link", "meta", "param", "source", "track", "wbr"}

    p = Stripper()
    p.feed(html)
    p.close()
    return "".join(p.out), p.removed


def main() -> None:
    with open(SRC, encoding="utf-8") as fh:
        fragment, used = render(fh.read())

    public_body, removed = strip_internal(fragment)
    public_keys = set(re.findall(r'data-ta?="([^"]+)"', public_body))
    print("public build: removed %d internal block(s)" % removed)

    # the dictionaries must exist before the runtime that reads them
    standalone = wrap_standalone(i18n_payload(public_keys) + public_body)
    artifact = i18n_payload() + fragment

    for path, content in ((OUT_STANDALONE, standalone), (OUT_FRAGMENT, artifact)):
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
        size_mb = os.path.getsize(path) / 1024 / 1024
        print("wrote %-52s %.2f MB" % (os.path.basename(path), size_mb))
        if size_mb > MAX_MB:
            print("   !! WARNING: over %d MB" % MAX_MB)

    print("embedded %d images (%d unique)" % (len(used), len(set(used))))

    available = sorted(f[:-5] for f in os.listdir(IMGDIR) if f.endswith(".webp"))
    unused = [name for name in available if name not in used]
    if unused:
        print("NOT USED (%d): %s" % (len(unused), ", ".join(unused)))


if __name__ == "__main__":
    main()

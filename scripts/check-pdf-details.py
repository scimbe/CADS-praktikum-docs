#!/usr/bin/env python3
"""Prueft, dass der Inhalt jedes aufklappbaren Blocks (<details>, in Markdown
`??? …`) einer Aufgabenseite auch im PDF steht.

    python3 check-pdf-details.py <site-verzeichnis>

Chromium druckt ein geschlossenes <details> nur mit seiner Titelzeile; das
Render-Skript oeffnet deshalb vor dem Druck alle Bloecke. Diese Pruefung
haelt das fest: je Sprachwurzel (site/, site/<locale>/) wird fuer jede Seite
labs/<slug>/index.html der Anfang jedes Block-Inhalts im Text von
pdf/<slug>.pdf gesucht (pdftotext, Leerraum ignoriert). Nur Standardbibliothek
plus pdftotext (poppler-utils). Exit 1, wenn ein Block im PDF fehlt.
"""

import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path


class DetailsText(HTMLParser):
    """Text jedes aeusseren <details>-Inhalts, ohne <summary>."""

    def __init__(self):
        super().__init__()
        self.blocks, self._depth, self._in_summary, self._buf = [], 0, 0, []

    def handle_starttag(self, tag, attrs):
        if tag == "details":
            self._depth += 1
            if self._depth == 1:
                self._buf = []
        elif tag == "summary" and self._depth:
            self._in_summary += 1

    def handle_endtag(self, tag):
        if tag == "summary" and self._in_summary:
            self._in_summary -= 1
        elif tag == "details" and self._depth:
            self._depth -= 1
            if self._depth == 0:
                self.blocks.append(" ".join("".join(self._buf).split()))

    def handle_data(self, data):
        if self._depth and not self._in_summary:
            self._buf.append(data)


def squash(text):
    return re.sub(r"\s+", "", text)


def main(site):
    roots = [site] + [d for d in sorted(site.iterdir()) if (d / "labs").is_dir() and d.name != "labs"]
    total = missing = 0
    for root in roots:
        for page in sorted((root / "labs").glob("*/index.html")):
            parser = DetailsText()
            parser.feed(page.read_text(encoding="utf-8"))
            blocks = [b for b in parser.blocks if b.strip()]
            if not blocks:
                continue
            pdf = root / "pdf" / f"{page.parent.name}.pdf"
            text = subprocess.run(["pdftotext", "-q", str(pdf), "-"], capture_output=True,
                                  text=True, check=True).stdout
            for block in blocks:
                total += 1
                snippet = " ".join(block.split()[:5])
                ok = squash(snippet) in squash(text)
                missing += not ok
                print(f"{'OK    ' if ok else 'FEHLT '} {pdf.relative_to(site)}: {snippet}")
    print(f"Aufklappbare Bloecke: {total}, Inhalt im PDF fehlt: {missing}")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1] if len(sys.argv) > 1 else "site")))

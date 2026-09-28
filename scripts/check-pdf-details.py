#!/usr/bin/env python3
"""Prueft, wie aufklappbare Bloecke (<details>, in Markdown `??? …`) einer
Aufgabenseite im PDF erscheinen.

    python3 check-pdf-details.py <site-verzeichnis>

Chromium druckt ein geschlossenes <details> nur mit seiner Titelzeile. Das
Render-Skript behandelt die Bloecke deshalb vor dem Druck:

- normale Bloecke werden geoeffnet: der Anfang ihres Inhalts muss im PDF stehen;
- Bloecke mit der Klasse `druck-zu` (`??? info druck-zu "Titel"`) bleiben
  bewusst zu, z. B. ein Erwartungshorizont: im PDF muessen Titel und der
  Hinweis "Im Online-Blatt aufklappbar" stehen, ihr Inhalt dagegen NICHT.

Je Sprachwurzel (site/, site/<locale>/) wird jede Seite labs/<slug>/index.html
gegen pdf/<slug>.pdf geprueft (pdftotext, Leerraum ignoriert). Nur
Standardbibliothek plus pdftotext (poppler-utils). Exit 1 bei Abweichung.
"""

import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

HINT = "Im Online-Blatt aufklappbar"
KEEP_CLOSED = "druck-zu"


class Details(HTMLParser):
    """Alle <details> (auch verschachtelte) mit Klassen, Titel und Inhaltstext."""

    def __init__(self):
        super().__init__()
        self.blocks, self._stack, self._summary = [], [], 0

    def handle_starttag(self, tag, attrs):
        if tag == "details":
            classes = (dict(attrs).get("class") or "").split()
            self._stack.append({"classes": classes, "title": [], "body": []})
        elif tag == "summary" and self._stack:
            self._summary += 1

    def handle_endtag(self, tag):
        if tag == "summary" and self._summary:
            self._summary -= 1
        elif tag == "details" and self._stack:
            block = self._stack.pop()
            self.blocks.append({"keep_closed": KEEP_CLOSED in block["classes"],
                                "title": " ".join(" ".join(block["title"]).split()),
                                "body": " ".join(" ".join(block["body"]).split())})

    def handle_data(self, data):
        if not self._stack:
            return
        if self._summary:
            self._stack[-1]["title"].append(data)
        else:
            # Text innerer Bloecke gehoert auch zum aeusseren - ausser er steht in
            # einem inneren druck-zu-Block, der ja gerade nicht gedruckt wird.
            for i, block in enumerate(self._stack):
                if not any(KEEP_CLOSED in inner["classes"] for inner in self._stack[i + 1:]):
                    block["body"].append(data)


def squash(text):
    return re.sub(r"\s+", "", text)


def first_words(text, n=5):
    return " ".join(text.split()[:n])


def check_page(html, pdf_text):
    """(Zeilen, Anzahl Fehler) fuer eine Seite."""
    parser = Details()
    parser.feed(html)
    pdf = squash(pdf_text)
    lines, errors = [], 0
    for b in parser.blocks:
        body = first_words(b["body"])
        if b["keep_closed"]:
            title = first_words(b["title"])
            shown = squash(title) in pdf and squash(HINT) in pdf
            leaked = bool(body) and squash(body) in pdf
            ok = shown and not leaked
            why = "" if ok else (" (Inhalt im PDF!)" if leaked else " (Titel/Hinweis fehlt)")
            lines.append(f"{'OK    ' if ok else 'FEHLER'} zu    : {title}{why}")
        else:
            if not body:
                continue
            ok = squash(body) in pdf
            lines.append(f"{'OK    ' if ok else 'FEHLT '} offen : {body}")
        errors += not ok
    return lines, errors


def main(site):
    roots = [site] + [d for d in sorted(site.iterdir()) if (d / "labs").is_dir() and d.name != "labs"]
    total = errors = 0
    for root in roots:
        for page in sorted((root / "labs").glob("*/index.html")):
            html = page.read_text(encoding="utf-8")
            if "<details" not in html:
                continue
            pdf = root / "pdf" / f"{page.parent.name}.pdf"
            text = subprocess.run(["pdftotext", "-q", str(pdf), "-"], capture_output=True,
                                  text=True, check=True).stdout
            lines, n_err = check_page(html, text)
            for line in lines:
                print(f"{pdf.relative_to(site)}: {line}")
            total += len(lines)
            errors += n_err
    print(f"Aufklappbare Bloecke: {total}, Abweichungen: {errors}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1] if len(sys.argv) > 1 else "site")))

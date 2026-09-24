// Rendert die bereits per `mkdocs build` erzeugten HTML-Seiten der
// Aufgabenblaetter (docs/labs/*.md -> site/labs/<slug>/index.html) per
// Playwright zu PDF (site/pdf/<slug>.pdf). Bewusst KEIN zusaetzlicher
// LaTeX/Pandoc-Toolchain: Playwright ist ohnehin schon fuer die E2E-Tests
// vorhanden (siehe docs/challenges.md, Abschnitt "PDF-Erzeugung").
//
// Seit Einfuehrung von mkdocs-static-i18n (siehe docs/challenges.md,
// "Mehrsprachigkeit (DE/EN)") baut MkDocs die Default-Sprache (de) nach
// site/ und jede weitere Sprache nach site/<locale>/ (z. B. site/en/) -
// jeweils mit derselben labs/<slug>/index.html-Struktur darunter. Dieses
// Skript rendert daher PDFs fuer JEDE gefundene Sprachwurzel (site/ selbst
// und jedes Unterverzeichnis von site/, das ein labs/-Verzeichnis enthaelt)
// und schreibt sie jeweils lokal nach <sprachwurzel>/pdf/<slug>.pdf, damit
// die relativen "../pdf/<slug>.pdf"-Links in den Markdown-Quellen (siehe
// docs/labs/*.md und *.en.md) in jeder Sprache aufloesen.
//
// Aufruf (nach `mkdocs build` im Repo-Root, site/ existiert):
//   node scripts/render-lab-pdfs.mjs <path-to-site-dir>
//
// Muss im Verzeichnis tests/e2e ausgefuehrt werden (nutzt dessen
// node_modules/@playwright/test).

import { chromium } from '@playwright/test';
import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const siteDir = resolve(process.argv[2] ?? '../../site');

if (!existsSync(siteDir)) {
  console.error(`Kein Site-Verzeichnis unter ${siteDir} gefunden - vorher "mkdocs build" ausfuehren.`);
  process.exit(1);
}

async function findLocaleRoots(baseDir) {
  const roots = [];
  if (existsSync(join(baseDir, 'labs'))) {
    roots.push(baseDir);
  }
  const entries = await readdir(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = join(baseDir, entry.name);
    if (candidate !== join(baseDir, 'labs') && existsSync(join(candidate, 'labs'))) {
      roots.push(candidate);
    }
  }
  return roots;
}

const localeRoots = await findLocaleRoots(siteDir);

if (localeRoots.length === 0) {
  console.error(`Keine Sprachwurzel mit labs/-Verzeichnis unter ${siteDir} gefunden.`);
  process.exit(1);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const localeRoot of localeRoots) {
    const labsDir = join(localeRoot, 'labs');
    const pdfDir = join(localeRoot, 'pdf');
    await mkdir(pdfDir, { recursive: true });

    const entries = await readdir(labsDir, { withFileTypes: true });
    const slugs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    for (const slug of slugs) {
      const htmlPath = join(labsDir, slug, 'index.html');
      if (!existsSync(htmlPath)) continue;
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
      const pdfPath = join(pdfDir, `${slug}.pdf`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        printBackground: true,
      });
      console.log(`OK  ${relative(siteDir, htmlPath)} -> ${relative(siteDir, pdfPath)}`);
    }
  }
} finally {
  await browser.close();
}

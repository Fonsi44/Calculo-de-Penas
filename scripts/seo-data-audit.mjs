#!/usr/bin/env node
/**
 * Auditoría de Production — crawl del sitemap canónico + comprobaciones SEO.
 * Solo lectura. Escribe artefactos sanitizados en docs/seo/current/ y raw en
 * .secrets/seo-data/ (gitignored).
 *
 * Uso:
 *   node scripts/seo-data-audit.mjs [--json] [--dry-run]
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import {
  atomicWriteJson,
  writeDatasetsCsv,
  hasFlag,
} from "./analytics/export-utils.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(ROOT, ".env") });
config({ path: resolve(ROOT, ".env.local"), override: true });

import { canonicalOrigin } from "./seo-data-config.mjs";

const ORIGIN = canonicalOrigin();
if (!ORIGIN) {
  console.error(
    "ERROR: NEXT_PUBLIC_SITE_URL no definido en env ni .env.example",
  );
  process.exit(1);
}
const TIMEZONE = "America/Tegucigalpa";
const CONCURRENCY = 8;
const TIMEOUT = 30000;

async function fetchWithTimeout(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT),
    redirect: "follow",
  });
  const text = await res.text();
  return { status: res.status, finalUrl: res.url, text };
}

function extract(url, html, pattern) {
  const m = html.match(pattern);
  return m ? m[1] : null;
}

async function crawlSitemapSegments() {
  const index = await fetchWithTimeout(`${ORIGIN}/sitemap.xml`);
  if (index.status !== 200) return [];
  const locs = [...index.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(
    (m) => m[1],
  );
  const segments = [];
  for (const loc of locs.slice(0, 12)) {
    try {
      const seg = await fetchWithTimeout(loc);
      if (seg.status === 200) {
        const urls = [...seg.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(
          (m) => m[1],
        );
        segments.push({ loc, status: seg.status, urlCount: urls.length });
      } else {
        segments.push({ loc, status: seg.status, urlCount: 0 });
      }
    } catch (e) {
      segments.push({ loc, status: "ERR", urlCount: 0 });
    }
  }
  return segments;
}

async function audit() {
  const report = {
    generatedAt: new Date().toISOString(),
    timezone: TIMEZONE,
    origin: ORIGIN,
    segments: [],
    pages: [],
  };
  const checks = { total: 0, ok: 0, errors: [] };

  // Sitemap segments
  report.segments = await crawlSitemapSegments();
  checks.total += report.segments.length;
  checks.ok += report.segments.filter((s) => s.status === 200).length;

  // URLs objetivo: home, servicios, perfiles, FAQ, contacto, blog, artículos, landings
  const targets = [
    "/",
    "/despacho",
    "/servicios-juridicos",
    "/equipo/danilo-pineda-maradiaga",
    "/equipo/thania-marlene-paz",
    "/equipo/emil-barahona",
    "/preguntas-frecuentes",
    "/solicitar-consulta",
    "/blog",
    "/abogados-en-nacaome",
    "/abogados-en-choluteca",
    "/abogados-en-pespire",
    "/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026",
    "/blog/derecho-civil/prescripcion-deudas-plazos-honduras",
  ];

  const queue = [...targets];
  const seen = new Set();
  let idx = 0;
  const runNext = async () => {
    while (idx < queue.length) {
      const path = queue[idx++];
      if (seen.has(path)) continue;
      seen.add(path);
      const url = `${ORIGIN}${path}`;
      try {
        const { status, finalUrl, text } = await fetchWithTimeout(url);
        const canonical = extract(
          url,
          text,
          /<link rel="canonical" href="([^"]+)"\s*\/?>/,
        );
        const robots = extract(url, text, /name="robots" content="([^"]+)"/);
        const title = extract(url, text, /<title>(.*?)<\/title>/);
        const h1 = extract(url, text, /<h1[^>]*>(.*?)<\/h1>/s);
        const h1Count = (text.match(/<h1[^>]*>/g) || []).length;
        const titleLen = title ? title.length : 0;
        const page = {
          path,
          status,
          finalUrl,
          canonical,
          robots,
          titleLen,
          titleTruncated: titleLen >= 60,
          h1: h1
            ? h1
                .replace(/<[^>]+>/g, "")
                .trim()
                .slice(0, 120)
            : null,
          h1Count,
          ok: status === 200 && (!canonical || canonical.startsWith(ORIGIN)),
        };
        report.pages.push(page);
        if (!page.ok) checks.errors.push({ path, reason: `status=${status}` });
        if (h1Count !== 1)
          checks.errors.push({ path, reason: `h1Count=${h1Count}` });
        if (titleLen >= 60)
          checks.errors.push({ path, reason: `titleLen=${titleLen}` });
      } catch (e) {
        report.pages.push({
          path,
          status: "ERR",
          error: e.message.slice(0, 100),
        });
        checks.errors.push({
          path,
          reason: `fetch: ${e.message.slice(0, 80)}`,
        });
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, runNext));

  const result = checks.errors.length === 0 ? "PASS" : "PARTIAL";
  const summary = {
    generatedAt: report.generatedAt,
    origin: ORIGIN,
    result,
    pagesChecked: report.pages.length,
    errors: checks.errors.length,
    segments: report.segments,
    pages: report.pages,
  };
  if (!hasFlag("--dry-run")) {
    await atomicWriteJson(
      resolve(ROOT, ".secrets", "seo-data", "production-audit.json"),
      summary,
    );
    await writeDatasetsCsv(
      resolve(ROOT, "docs", "seo", "current", "production-audit.csv"),
      {
        pages: report.pages.map((p) => ({
          path: p.path,
          status: p.status,
          canonical: p.canonical,
          robots: p.robots,
          titleLen: p.titleLen,
          titleTruncated: p.titleTruncated,
          h1Count: p.h1Count,
        })),
      },
    );
  }
  if (hasFlag("--json"))
    console.log(
      JSON.stringify(
        {
          result,
          origin: ORIGIN,
          pagesChecked: report.pages.length,
          errors: checks.errors.length,
        },
        null,
        2,
      ),
    );
  else {
    console.log(`PRODUCTION AUDIT · ${result}`);
    console.log(`  Origen: ${ORIGIN}`);
    console.log(`  Páginas comprobadas: ${report.pages.length}`);
    console.log(`  Errores: ${checks.errors.length}`);
    for (const e of checks.errors.slice(0, 20))
      console.log(`    ✗ ${e.path} — ${e.reason}`);
    console.log("  Segmentos sitemap:");
    for (const s of report.segments)
      console.log(`    ${s.status} ${s.loc} (${s.urlCount} URLs)`);
  }
  return checks.errors.length === 0 ? 0 : 1;
}

audit()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

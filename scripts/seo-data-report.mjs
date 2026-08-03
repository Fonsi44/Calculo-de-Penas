#!/usr/bin/env node
/**
 * Generador de informes SEO — produce CSV sanitizados (sin PII) en
 * docs/seo/current/ a partir de los datasets recogidos (.secrets/seo-data/ y
 * data/google|bing). Solo lectura de fuentes; escritura de artefactos.
 *
 * Uso:
 *   node scripts/seo-data-report.mjs [--json] [--dry-run]
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

const OUT = resolve(ROOT, "docs", "seo", "current");
const TIMEZONE = "America/Tegucigalpa";

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}
const num = (v) => Number(v ?? 0);

async function main() {
  const generatedAt = new Date().toISOString();
  const status = {};
  const csvs = {};

  // ── GSC (usar 180d si existe, si no 90d/28d, si no live) ──
  let gsc =
    readJson(resolve(ROOT, ".secrets", "seo-data", "gsc-180d.json")) ||
    readJson(resolve(ROOT, ".secrets", "seo-data", "gsc-28d.json")) ||
    readJson(resolve(ROOT, "data", "google", "gsc-live.json"));
  if (gsc && gsc.status === "ok") {
    status.gsc = {
      status: "ok",
      period: `${gsc.period?.start}→${gsc.period?.end}`,
      clicks: gsc.summary?.clicks,
      impressions: gsc.summary?.impressions,
      rows: (gsc.queryPages?.length || 0) + (gsc.queries?.length || 0),
    };

    // Oportunidades: queries con impresiones y CTR bajo (posición 4-20)
    const opp = (gsc.queries || [])
      .filter(
        (q) =>
          num(q.impressions) >= 20 &&
          num(q.position) >= 4 &&
          num(q.position) <= 20,
      )
      .sort((a, b) => num(b.impressions) - num(a.impressions))
      .slice(0, 500)
      .map((q) => ({
        query: q.query,
        impressions: q.impressions,
        clicks: q.clicks,
        ctr: q.ctr,
        position: q.position,
        action: "improve_title_meta",
      }));
    csvs.gsc_opportunities = opp;

    // Canibalización: query en 2+ páginas
    const qmap = new Map();
    for (const qp of gsc.queryPages || []) {
      if (num(qp.impressions) < 10) continue;
      const key = qp.query;
      if (!qmap.has(key)) qmap.set(key, []);
      qmap
        .get(key)
        .push({
          page: qp.page,
          impressions: qp.impressions,
          clicks: qp.clicks,
        });
    }
    const cannib = [...qmap.entries()]
      .filter(
        ([, pages]) =>
          pages.length >= 2 && new Set(pages.map((p) => p.page)).size >= 2,
      )
      .slice(0, 300)
      .map(([query, pages]) => ({
        query,
        url_count: new Set(pages.map((p) => p.page)).size,
        urls: pages.map((p) => p.page).join(" | "),
        impressions_total: pages.reduce((s, p) => s + num(p.impressions), 0),
      }));
    csvs.gsc_cannibalization = cannib;

    // Páginas top (dataset para cruzar con GA4)
    csvs.gsc_pages = (gsc.pages || []).map((p) => ({
      page: p.page,
      clicks: p.clicks,
      impressions: p.impressions,
    }));

    // Bajo CTR
    csvs.gsc_low_ctr = (gsc.queries || [])
      .filter(
        (q) =>
          num(q.impressions) >= 50 &&
          num(q.position) <= 20 &&
          num(q.ctr ? parseFloat(q.ctr) : 0) < 3,
      )
      .map((q) => ({
        query: q.query,
        impressions: q.impressions,
        clicks: q.clicks,
        ctr: q.ctr,
        position: q.position,
      }));
  } else {
    status.gsc = { status: gsc?.status || "no_data" };
  }

  // ── GA4 (baseline julio 2026 si existe) ──
  const ga4 = readJson(resolve(ROOT, "data", "google", "ga4-live.json"));
  if (ga4 && ga4.status === "ok") {
    status.ga4 = {
      status: "baseline",
      propertyId: ga4.propertyId,
      measurementId: ga4.measurementId,
      period: `${ga4.period?.start}→${ga4.period?.end}`,
      users: ga4.overview?.totalUsers,
      sessions: ga4.overview?.sessions,
      keyEvents: ga4.overview?.keyEvents,
    };
    csvs.ga4_organic_conversions = (ga4.landingPages || [])
      .map((l) => ({
        landingPage: l["1"] ?? l.landingPage ?? "?",
        sessions: l["0"] ?? l.sessions ?? 0,
      }))
      .slice(0, 200);
    csvs.ga4_sources = (ga4.sources || []).map((s) => ({
      source: s["0"] ?? s.source,
      users: s["1"] ?? s.users,
    }));
    csvs.ga4_countries = (ga4.countries || []).map((c) => ({
      country: c["0"] ?? c.country,
      users: c["1"] ?? c.users,
    }));
    csvs.ga4_devices = (ga4.devices || []).map((d) => ({
      device: d["0"] ?? d.device,
      users: d["1"] ?? d.users,
    }));
  } else {
    status.ga4 = {
      status: "SKIPPED_WITH_REASON",
      reason:
        "GA4 requiere scope analytics.readonly (client OAuth propio o service account)",
    };
  }

  // ── Bing ──
  const bing = readJson(resolve(ROOT, "data", "bing", "bing-live.json"));
  if (
    bing &&
    bing.status === "ok" &&
    (bing.queries?.length || bing.crawlStats)
  ) {
    status.bing = {
      status: "ok",
      authMode: bing.authMode,
      queries: bing.queries?.length,
      crawl: bing.crawlStats,
    };
    csvs.bing_opportunities = (bing.queries || [])
      .filter((q) => num(q.impressions) >= 5)
      .map((q) => ({
        query: q.query,
        clicks: q.clicks,
        impressions: q.impressions,
        ctr: q.ctr,
        position: q.position,
      }));
  } else {
    status.bing = {
      status: "SKIPPED_WITH_REASON",
      reason:
        "Bing requiere BING_WEBMASTER_API_KEY válida (INDEXNOW_KEY devuelve vacío)",
    };
    csvs.bing_opportunities = [];
  }

  // ── CrUX ──
  const crux = readJson(resolve(ROOT, ".secrets", "seo-data", "crux.json"));
  if (crux && crux.rows?.length) {
    status.crux = { status: "ok", period: crux.period, rows: crux.rows };
    csvs.crux_performance = crux.rows;
  } else {
    status.crux = {
      status: "SKIPPED_WITH_REASON",
      reason: "Origen sin datos en Chrome UX Report (tráfico insuficiente)",
    };
    csvs.crux_performance = [];
  }

  const dataSourceStatus = { generatedAt, timezone: TIMEZONE, sources: status };
  await atomicWriteJson(
    resolve(OUT, "data-source-status.json"),
    dataSourceStatus,
  );
  // Nombres de archivo con guiones (seo:data §15).
  const DELIVERABLE = {
    gsc_opportunities: "gsc-opportunities.csv",
    gsc_cannibalization: "gsc-cannibalization.csv",
    ga4_organic_conversions: "ga4-organic-conversions.csv",
    bing_opportunities: "bing-opportunities.csv",
    crux_performance: "crux-performance.csv",
  };
  for (const [name, rows] of Object.entries(csvs)) {
    const file = DELIVERABLE[name];
    if (!file) continue;
    await writeDatasetsCsv(resolve(OUT, file), { [name]: rows });
  }

  if (hasFlag("--json"))
    console.log(
      JSON.stringify(
        {
          generatedAt,
          sources: status,
          csvs: Object.fromEntries(
            Object.entries(csvs).map(([k, v]) => [k, v.length]),
          ),
        },
        null,
        2,
      ),
    );
  else {
    console.log("SEO DATA REPORT · fuentes y filas");
    for (const [name, rows] of Object.entries(csvs))
      console.log(`  ${name}: ${rows.length} filas`);
    console.log("Estado de fuentes:");
    for (const [k, v] of Object.entries(status))
      console.log(`  ${k}: ${v.status}${v.reason ? " — " + v.reason : ""}`);
  }
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

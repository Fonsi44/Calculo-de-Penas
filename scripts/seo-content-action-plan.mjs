#!/usr/bin/env node
/**
 * Plan de acción de contenido — cruza el inventario editorial (175 artículos)
 * con métricas GSC frescas y clasifica cada URL según las reglas del bloque
 * de auditoría (§12). Solo lectura; escribe docs/seo/current/content-action-plan.csv.
 *
 * Uso: node scripts/seo-content-action-plan.mjs [--json]
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
const INVENTORY = resolve(OUT, "blog-editorial-inventory.csv");

function readCsv(path) {
  if (!fs.existsSync(path)) return [];
  const text = fs.readFileSync(path, "utf8");
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseRow(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = parseRow(l);
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}
function parseRow(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
const num = (v) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

function loadGscPages() {
  for (const f of ["gsc-180d.json", "gsc-90d.json", "gsc-28d.json"]) {
    const p = resolve(ROOT, ".secrets", "seo-data", f);
    if (fs.existsSync(p)) {
      try {
        const g = JSON.parse(fs.readFileSync(p, "utf8"));
        if (g.status === "ok" && Array.isArray(g.pages)) return g;
      } catch {
        /* next */
      }
    }
  }
  try {
    const g = JSON.parse(
      fs.readFileSync(resolve(ROOT, "data", "google", "gsc-live.json"), "utf8"),
    );
    return g.status === "ok" ? g : null;
  } catch {
    return null;
  }
}

const IMPRESSION_THRESHOLD_NOINDEX = 40; // demanda mínima para mantener indexado

function classify(row, gscByPage, pagePosition) {
  const url = row.url || "";
  const page = gscByPage.get(url);
  const clicks = page ? num(page.clicks) : num(row.clicks);
  const impressions = page ? num(page.impressions) : num(row.impressions);
  const position =
    pagePosition && pagePosition > 0 ? pagePosition : num(row.position);
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const wordCount = num(row.word_count);
  const published = row.published === "true";

  let action;
  let priority;
  let reason;

  if (impressions > 0) {
    if (impressions >= 100 && position > 0 && position <= 20 && ctr < 0.03) {
      action = "UPDATE";
      priority = "P1";
      reason = `Impresiones altas, posición ${position.toFixed(1)}, CTR bajo (${(ctr * 100).toFixed(1)}%)`;
    } else if (
      impressions >= 80 &&
      position > 0 &&
      position <= 10 &&
      wordCount > 0 &&
      wordCount < 600
    ) {
      action = "EXPAND";
      priority = "P2";
      reason = `Buen posicionamiento (${position.toFixed(1)}) con contenido escaso (${wordCount} palabras)`;
    } else if (impressions >= 50 && position > 20) {
      action = "UPDATE";
      priority = "P2";
      reason = `Posición baja (${position.toFixed(1)}) con impresiones`;
    } else if (impressions >= 10) {
      action = "KEEP";
      priority = "P3";
      reason = "Demanda moderada o tráfico estable";
    } else {
      action = "KEEP";
      priority = "P4";
      reason = "Demanda incipiente";
    }
  } else if (published && wordCount > 0 && wordCount < 400) {
    action = "NOINDEX";
    priority = "P3";
    reason = `Publicado sin demanda GSC en 180d y contenido escaso (${wordCount} palabras)`;
  } else if (published) {
    action = "DATA_REQUIRED";
    priority = "P3";
    reason = "Publicado sin demanda GSC en 180d; decidir NOINDEX/consolidación";
  } else {
    action = "NOINDEX";
    priority = "P4";
    reason = "No publicado";
  }

  return {
    clicks,
    impressions,
    position,
    ctr,
    action,
    priority,
    reason,
    wordCount,
  };
}

async function main() {
  const inventory = readCsv(INVENTORY);
  const gsc = loadGscPages();
  const gscByPage = new Map();
  if (gsc) for (const p of gsc.pages || []) gscByPage.set(p.page, p);
  // Posición por página ponderada por impresiones (desde queryPages).
  const positionByPage = new Map();
  if (gsc) {
    const acc = new Map();
    for (const qp of gsc.queryPages || []) {
      if (!qp.page) continue;
      const cur = acc.get(qp.page) || { w: 0, sum: 0 };
      cur.w += num(qp.impressions);
      cur.sum += num(qp.impressions) * num(qp.position);
      acc.set(qp.page, cur);
    }
    for (const [page, { w, sum }] of acc)
      if (w > 0) positionByPage.set(page, sum / w);
  }

  const rows = inventory.map((row) => {
    const c = classify(row, gscByPage, positionByPage.get(row.url));
    return {
      url: row.url,
      slug: row.slug,
      category: row.category,
      title: row.title_db || row.title_rendered,
      published: row.published,
      legal_review_status: row.legal_review_status_normalized,
      wordCount: c.wordCount,
      clicks: c.clicks,
      impressions: c.impressions,
      position: c.position.toFixed(1),
      ctr: (c.ctr * 100).toFixed(2),
      action: c.action,
      priority: c.priority,
      reason: c.reason,
      cannibalizationCluster: "",
    };
  });

  // Anotar clústeres de canibalización (GSC query→2+ pages)
  const cannib = readCsv(resolve(OUT, "gsc-cannibalization.csv"));
  const urlToQuery = new Map();
  if (gsc)
    for (const qp of gsc.queryPages || []) {
      if (num(qp.impressions) < 10) continue;
      if (!urlToQuery.has(qp.page)) urlToQuery.set(qp.page, []);
      urlToQuery.get(qp.page).push(qp.query);
    }
  for (const r of rows) {
    const queries = urlToQuery.get(r.url) || [];
    const clustered = queries.filter((q) => {
      let count = 0;
      for (const [page, qs] of urlToQuery) if (qs.includes(q)) count++;
      return count >= 2;
    });
    if (clustered.length) {
      r.cannibalizationCluster = [...new Set(clustered)]
        .slice(0, 3)
        .join(" | ");
      if (r.action === "KEEP") {
        r.action = "MERGE";
        r.priority = "P2";
        r.reason = "Posible canibalización: " + r.cannibalizationCluster;
      }
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    byAction: rows.reduce(
      (acc, r) => ((acc[r.action] = (acc[r.action] || 0) + 1), acc),
      {},
    ),
    gscSource: gsc ? `${gsc.period?.start}→${gsc.period?.end}` : null,
  };
  await atomicWriteJson(
    resolve(OUT, "content-action-plan-summary.json"),
    summary,
  );
  await writeDatasetsCsv(resolve(OUT, "content-action-plan.csv"), {
    content_action_plan: rows,
  });

  if (hasFlag("--json")) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`CONTENT ACTION PLAN · ${rows.length} artículos`);
    for (const [k, v] of Object.entries(summary.byAction))
      console.log(`  ${k}: ${v}`);
  }
  return 0;
}

main()
  .then((c) => process.exit(c))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

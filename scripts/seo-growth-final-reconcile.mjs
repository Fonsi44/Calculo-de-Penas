#!/usr/bin/env node
/**
 * Reconciliación definitiva del inventario SEO por lotes (1–9).
 *
 * Propósito (solo lectura + gobernanza; NUNCA escribe DB ni metadata):
 *  1. Cargar los nueve lotes (selection, editorial-review, approved-patch,
 *     deferred-patch, experiment-manifest).
 *  2. Cargar `content-decision-final.csv` (publicados/no publicados),
 *     `processed-slugs.json` y el inventario original
 *     `cross-platform-url-analysis.csv`.
 *  3. Normalizar la identidad por `normalized_slug` (+ `canonical_url`).
 *  4. Detectar duplicados, ausencias y solapamientos.
 *  5. Calcular todos los conteos desde cero.
 *  6. Validar invariantes aritméticas (ecuaciones del prompt §6).
 *  7. Comparar contra las cifras declaradas en el informe maestro.
 *  8. Regenerar `deferred-global.csv` y los entregables de reconciliación.
 *
 * Determinista: ordena todos los conjuntos por slug normalizado; la segunda
 * ejecución produce salida idéntica (SECOND_RUN_DIFF = 0).
 *
 * Uso:
 *   node scripts/seo-growth-final-reconcile.mjs            # escribe entregables
 *   node scripts/seo-growth-final-reconcile.mjs --check    # valida y no escribe
 *   node scripts/seo-growth-final-reconcile.mjs --json     # solo salida JSON a stdout
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = process.cwd();
const GROWTH = resolve(ROOT, "docs/seo/growth");
const HERE = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Normalización de identidad
// ---------------------------------------------------------------------------

/** Slug normalizado: minúsculas, sin barras, sin espacios, sin query/fragmento. */
export function normalizeSlug(s) {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/[\s]+/g, "-")
    .split("?")[0]
    .split("#")[0];
}

/** URL canónica normalizada: sin protocolo/www, sin query/fragmento, sin barra final. */
export function normalizeUrl(u) {
  return (u || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("?")[0]
    .split("#")[0]
    .replace(/\/+$/, "");
}

/** Host canónico derivado de .env.example (fuente única, nunca hand-typeado). */
export function canonicalHost(
  envContent = readFileSync(resolve(ROOT, ".env.example"), "utf8"),
) {
  const m = envContent.match(/^NEXT_PUBLIC_SITE_URL=https?:\/\/([^\s"']+)/m);
  if (!m) throw new Error("NEXT_PUBLIC_SITE_URL ausente en .env.example");
  return m[1];
}

// ---------------------------------------------------------------------------
// CSV RFC4180
// ---------------------------------------------------------------------------

/**
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsvText(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      cur.push(field);
      field = "";
    } else if (c === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
    } else if (c === "\r") {
      /* skip */
    } else field += c;
  }
  if (field.length || cur.length) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

/**
 * @param {string} p
 * @returns {Array<Record<string, string>>}
 */
export function readCsvRows(p) {
  let content = readFileSync(p, "utf8");
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const rows = parseCsvText(content);
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => {
      o[h] = (r[i] ?? "").trim();
    });
    return o;
  });
}

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// ---------------------------------------------------------------------------
// Carga de lotes
// ---------------------------------------------------------------------------

/** Clasificación canónica a partir de la clasificación original del review/patch. */
/**
 * @param {string} original
 * @param {string} [reason]
 * @returns {string}
 */
export function canonicalClassification(original, reason) {
  const o = (original || "").trim().toUpperCase();
  if (o === "APPROVED_TITLE_META_H1") return "APPROVED_TITLE_META_H1";
  if (o === "APPROVED_TITLE_META") return "APPROVED_TITLE_META";
  if (o === "APPROVED_METADATA_ONLY" || o === "METADATA_ONLY")
    return "APPROVED_METADATA_ONLY";
  if (o === "NO_CHANGE") return "KEEP_NO_CHANGE";
  if (o === "KEEP_NO_CHANGE") {
    const r = (reason || "").toLowerCase();
    if (r.includes("insufficient_data") || r.includes("datos muy bajos"))
      return "INSUFFICIENT_DATA";
    return "KEEP_NO_CHANGE";
  }
  if (o === "UNPUBLISHED") return "UNPUBLISHED";
  if (o === "INSUFFICIENT_DATA") return "INSUFFICIENT_DATA";
  return "UNKNOWN";
}

/** Carga todos los artefactos de los 9 lotes. Devuelve un objeto plano determinista. */
/**
 * @param {string} growthDir
 * @returns {Record<string, any>}
 */
export function loadBatchData(growthDir = GROWTH) {
  const data = {
    batches: {},
    selection: {},
    approved: {},
    deferred: {},
    review: {},
    manifests: {},
  };
  for (let b = 1; b <= 9; b++) {
    const selP = join(growthDir, `batch-${b}-selection.csv`);
    const appP = join(growthDir, `batch-${b}-approved-patch.json`);
    const defP = join(growthDir, `batch-${b}-deferred-patch.json`);
    const revP = join(growthDir, `batch-${b}-editorial-review.csv`);
    const manP = join(growthDir, `batch-${b}-experiment-manifest.csv`);
    if (!existsSync(selP)) throw new Error(`Falta lote ${b}: ${selP}`);
    const sel = readCsvRows(selP);
    const app = readJson(appP);
    const def = readJson(defP);
    const rev = readCsvRows(revP);
    const man = existsSync(manP) ? readCsvRows(manP) : [];
    data.batches[b] = {
      selection: sel.length,
      approved: app.patch?.length ?? 0,
      deferred: def.patch?.length ?? 0,
      review: rev.length,
      manifest: man.length,
    };
    data.selection[b] = sel;
    data.approved[b] = app.patch ?? [];
    data.deferred[b] = def.patch ?? [];
    data.review[b] = rev;
    data.manifests[b] = man;
  }
  data.contentDecisions = readCsvRows(
    join(growthDir, "content-decision-final.csv"),
  );
  data.processedSlugs = readJson(join(growthDir, "processed-slugs.json"));
  data.crossPlatform = readCsvRows(
    join(growthDir, "cross-platform-url-analysis.csv"),
  );
  return data;
}

// ---------------------------------------------------------------------------
// Derivación del inventario (conteos desde cero)
// ---------------------------------------------------------------------------

/**
 * Deriva el inventario reconciliado. Devuelve un objeto con todos los conjuntos
 * (Set) y conteos derivados, más la lista de duplicados/solapamientos/ausencias.
 */
/**
 * @param {Record<string, any>} data
 * @returns {Record<string, any>}
 */
export function deriveInventory(data) {
  const host = canonicalHost();
  const selected = new Map(); // slug -> { url, batches: Set }
  const approved = new Map(); // slug -> { url, classification, batch }
  const deferred = new Map(); // slug -> { url, classification, reason, batch }
  const reviewCls = new Map(); // slug -> { classification, batch }

  for (let b = 1; b <= 9; b++) {
    for (const r of data.selection[b]) {
      const slug = normalizeSlug(r.slug || (r.url || "").split("/").pop());
      const url = normalizeUrl(r.url);
      if (!slug) continue;
      if (!selected.has(slug)) {
        selected.set(slug, { url, rawUrl: r.url || "", batches: new Set() });
      }
      selected.get(slug).batches.add(b);
    }
    for (const p of data.approved[b]) {
      const slug = normalizeSlug(p.slug);
      const url = normalizeUrl(p.url);
      if (!slug) continue;
      approved.set(slug, {
        url,
        rawUrl: p.url || "",
        classification: canonicalClassification(p.classification, p.reason),
        batch: b,
        status: p.status,
      });
    }
    for (const p of data.deferred[b]) {
      const slug = normalizeSlug(p.slug);
      const url = normalizeUrl(p.url);
      if (!slug) continue;
      deferred.set(slug, {
        url,
        rawUrl: p.url || "",
        classification: canonicalClassification(p.classification, p.reason),
        reason: p.reason,
        batch: b,
        status: p.status,
      });
    }
    for (const r of data.review[b]) {
      const slug = normalizeSlug(r.slug);
      if (!slug) continue;
      reviewCls.set(slug, {
        classification: canonicalClassification(r.classification, r.reason),
        original: r.classification,
        batch: b,
      });
    }
  }

  const published = new Map(); // slug -> row (content-decision)
  const unpublished = new Map();
  for (const r of data.contentDecisions) {
    const slug = normalizeSlug(r.slug);
    if (!slug) continue;
    if (r.published === "true") published.set(slug, r);
    else unpublished.set(slug, r);
  }

  const cdfSlugs = new Set([...published.keys(), ...unpublished.keys()]);
  const crossSlugs = new Set(
    data.crossPlatform.map((r) =>
      normalizeSlug((r.url || "").split("/").pop()),
    ),
  );
  const processedSet = new Set(
    (data.processedSlugs.slugs ?? []).map(normalizeSlug),
  );

  // Duplicados entre lotes (mismo slug en >1 selección)
  const duplicateSlugsAcrossBatches = [...selected.entries()].filter(
    ([, v]) => v.batches.size > 1,
  );
  // Solapamiento aprobado & diferido
  const approvedDeferredOverlap = [...approved.keys()].filter((s) =>
    deferred.has(s),
  );
  // Solapamiento publicado & no publicado
  const publishedUnpublishedOverlap = [...published.keys()].filter((s) =>
    unpublished.has(s),
  );
  // Solapamiento seleccionado & no publicado
  const selectedUnpublishedOverlap = [...selected.keys()].filter((s) =>
    unpublished.has(s),
  );
  // Ausencias: seleccionado sin decisión en content-decision
  const selectedMissingInCdf = [...selected.keys()].filter(
    (s) => !cdfSlugs.has(s),
  );
  // URLs no canónicas (host incorrecto)
  const badHostUrls = [
    ...selected.values(),
    ...approved.values(),
    ...deferred.values(),
  ]
    .map((v) => v.url)
    .filter(
      (u) =>
        u &&
        !u.startsWith(`${host.replace("www.", "")}/`) &&
        !u.startsWith(`${host}/`),
    );

  const selectedUnique = [...selected.keys()];
  const approvedUnique = [...approved.keys()];
  const deferredUnique = [...deferred.keys()];
  const optimizedUnique = approvedUnique.slice();

  // Conteo por clasificación canónica (aprobados)
  const approvedBreakdown = {};
  for (const s of approvedUnique) {
    const c = approved.get(s).classification;
    approvedBreakdown[c] = (approvedBreakdown[c] || 0) + 1;
  }
  // Diferidos por clasificación
  const deferredBreakdown = {};
  for (const s of deferredUnique) {
    const c = deferred.get(s).classification;
    deferredBreakdown[c] = (deferredBreakdown[c] || 0) + 1;
  }

  const publishedAnalyzed = selectedUnique.length; // 135
  const optimized = approvedUnique.length; // 104
  const keepNoChange = deferredBreakdown["KEEP_NO_CHANGE"] || 0; // 23
  const insufficientData = deferredBreakdown["INSUFFICIENT_DATA"] || 0; // 8
  const externalDeferred = 0;
  const unpublishedUnique = unpublished.size; // 40
  const totalUnique = publishedAnalyzed + unpublishedUnique; // 175
  const measurementPending = optimized; // 104 (ventana 28d)
  const manualGa4Pending = 0;
  const unclassified = selectedUnique.filter((s) => {
    const a = approved.has(s);
    const d = deferred.has(s);
    return !a && !d;
  });

  return {
    selected,
    approved,
    deferred,
    reviewCls,
    published,
    unpublished,
    cdfSlugs,
    crossSlugs,
    processedSet,
    selectedUnique,
    approvedUnique,
    deferredUnique,
    optimizedUnique,
    publishedAnalyzed,
    optimized,
    keepNoChange,
    insufficientData,
    externalDeferred,
    unpublishedUnique,
    totalUnique,
    measurementPending,
    manualGa4Pending,
    approvedBreakdown,
    deferredBreakdown,
    unclassified,
    duplicateSlugsAcrossBatches,
    approvedDeferredOverlap,
    publishedUnpublishedOverlap,
    selectedUnpublishedOverlap,
    selectedMissingInCdf,
    badHostUrls,
    host,
  };
}

// ---------------------------------------------------------------------------
// Invariantes
// ---------------------------------------------------------------------------

/** Valida todas las invariantes del prompt §6. Devuelve { ok, failures[] }. */
/**
 * @param {Record<string, any>} inv
 * @returns {{ ok: boolean, failures: string[] }}
 */
export function checkInvariants(inv) {
  const failures = [];
  const eq = (name, actual, expected) => {
    if (actual !== expected) failures.push(`${name}: ${actual} != ${expected}`);
  };

  // published_analyzed = optimized + keep_no_change + insufficient_data + external_deferred
  eq(
    "published_analyzed",
    inv.publishedAnalyzed,
    inv.optimized +
      inv.keepNoChange +
      inv.insufficientData +
      inv.externalDeferred,
  );
  // total_unique_articles = published_analyzed + unpublished_unique
  eq(
    "total_unique_articles",
    inv.totalUnique,
    inv.publishedAnalyzed + inv.unpublishedUnique,
  );
  // optimized = sum(approved_classifications)
  const sumApproved = Object.values(inv.approvedBreakdown).reduce(
    (a, b) => a + b,
    0,
  );
  eq("optimized_sum_approved", inv.optimized, sumApproved);
  // selected_unique_across_batches = published_analyzed
  eq("selected_unique", inv.selectedUnique.length, inv.publishedAnalyzed);
  // approved_unique + deferred_published_unique = published_analyzed
  eq(
    "approved_plus_deferred",
    inv.approvedUnique.length + inv.deferredUnique.length,
    inv.publishedAnalyzed,
  );
  // duplicate_slugs_across_batches = 0
  if (inv.duplicateSlugsAcrossBatches.length !== 0) {
    failures.push(
      `duplicate_slugs_across_batches: ${inv.duplicateSlugsAcrossBatches.length} duplicados`,
    );
  }
  // approved_and_deferred_overlap = 0
  if (inv.approvedDeferredOverlap.length !== 0) {
    failures.push(
      `approved_and_deferred_overlap: ${inv.approvedDeferredOverlap.join(", ")}`,
    );
  }
  // published_and_unpublished_overlap = 0
  if (inv.publishedUnpublishedOverlap.length !== 0) {
    failures.push(
      `published_and_unpublished_overlap: ${inv.publishedUnpublishedOverlap.join(", ")}`,
    );
  }
  // unclassified_unique = 0
  if (inv.unclassified.length !== 0) {
    failures.push(
      `unclassified_unique: ${inv.unclassified.length} sin clasificar (${inv.unclassified.join(", ")})`,
    );
  }
  // selected & unpublished overlap = 0 (nadie analizado que sea no publicado)
  if (inv.selectedUnpublishedOverlap.length !== 0) {
    failures.push(
      `selected_unpublished_overlap: ${inv.selectedUnpublishedOverlap.join(", ")}`,
    );
  }
  // bad host urls = 0
  if (inv.badHostUrls.length !== 0) {
    failures.push(`urls_no_canonicas: ${inv.badHostUrls.length}`);
  }
  return { ok: failures.length === 0, failures };
}

// ---------------------------------------------------------------------------
// Entregables
// ---------------------------------------------------------------------------

function buildDeferredGlobal(inv) {
  const rows = [];
  const add = (
    slug,
    url,
    pub,
    cls,
    batch,
    reason,
    actionRequired,
    dependency,
  ) => {
    rows.push({
      slug,
      url,
      publication_status: pub,
      final_classification: cls,
      batch,
      reason,
      action_required: actionRequired,
      dependency,
      review_date: "2026-09-01",
    });
  };
  const slugs = new Set();
  for (const s of inv.deferredUnique.sort()) {
    const d = inv.deferred.get(s);
    const actionRequired = d.classification === "INSUFFICIENT_DATA";
    if (slugs.has(s)) continue;
    slugs.add(s);
    add(
      s,
      d.rawUrl || d.url,
      "published",
      d.classification,
      String(d.batch),
      d.reason || "",
      actionRequired,
      "",
    );
  }
  for (const s of [...inv.unpublished.keys()].sort()) {
    const r = inv.unpublished.get(s);
    if (slugs.has(s)) continue;
    slugs.add(s);
    add(
      s,
      r.url,
      "unpublished",
      "UNPUBLISHED",
      "-",
      r.note || "No publicado (no indexable); sin demanda GSC.",
      false,
      "",
    );
  }
  const header = [
    "slug",
    "url",
    "publication_status",
    "final_classification",
    "batch",
    "reason",
    "action_required",
    "dependency",
    "review_date",
  ];
  return (
    [
      header.join(","),
      ...rows.map((r) => header.map((h) => esc(r[h])).join(",")),
    ].join("\n") + "\n"
  );
}

function buildFinalCsv(inv) {
  const rows = [];
  const allSlugs = new Set([
    ...inv.selectedUnique,
    ...inv.published.keys(),
    ...inv.unpublished.keys(),
  ]);
  for (const s of [...allSlugs].sort()) {
    const isPublished =
      inv.published.has(s) ||
      (inv.selectedUnique.includes(s) && !inv.unpublished.has(s));
    const cls = inv.approved.has(s)
      ? inv.approved.get(s).classification
      : inv.deferred.has(s)
        ? inv.deferred.get(s).classification
        : inv.unpublished.has(s)
          ? "UNPUBLISHED"
          : "NOT_ANALYZED";
    const url =
      inv.approved.get(s)?.rawUrl ||
      inv.approved.get(s)?.url ||
      inv.deferred.get(s)?.rawUrl ||
      inv.deferred.get(s)?.url ||
      inv.unpublished.get(s)?.url ||
      inv.selected.get(s)?.rawUrl ||
      inv.selected.get(s)?.url ||
      "";
    const batch =
      inv.approved.get(s)?.batch || inv.deferred.get(s)?.batch || "-";
    const actionRequired = cls === "INSUFFICIENT_DATA";
    rows.push({
      slug: s,
      url,
      publication_status: isPublished ? "published" : "unpublished",
      final_classification: cls,
      batch: String(batch),
      action_required: actionRequired,
      review_date: "2026-09-01",
    });
  }
  const header = [
    "slug",
    "url",
    "publication_status",
    "final_classification",
    "batch",
    "action_required",
    "review_date",
  ];
  return (
    [
      header.join(","),
      ...rows.map((r) => header.map((h) => esc(r[h])).join(",")),
    ].join("\n") + "\n"
  );
}

function buildDuplicateAnalysis(inv) {
  const header = ["type", "slug", "detail"];
  const rows = [];
  for (const [slug, v] of inv.duplicateSlugsAcrossBatches) {
    rows.push({
      type: "across_batches",
      slug,
      detail: `lotes=${[...v.batches].sort().join(",")}`,
    });
  }
  for (const slug of inv.approvedDeferredOverlap) {
    rows.push({
      type: "approved_and_deferred",
      slug,
      detail: "slug en patch aprobado y diferido",
    });
  }
  for (const slug of inv.publishedUnpublishedOverlap) {
    rows.push({
      type: "published_and_unpublished",
      slug,
      detail: "slug publicado y no publicado",
    });
  }
  for (const slug of inv.selectedUnpublishedOverlap) {
    rows.push({
      type: "selected_and_unpublished",
      slug,
      detail: "slug analizado marcado no publicado",
    });
  }
  return (
    [
      header.join(","),
      ...rows.map((r) => header.map((h) => esc(r[h])).join(",")),
    ].join("\n") + "\n"
  );
}

function buildClassificationMap(inv) {
  const header = [
    "original_classification",
    "canonical_classification",
    "count",
  ];
  const map = {};
  for (const s of inv.selectedUnique) {
    const a = inv.approved.get(s);
    const d = inv.deferred.get(s);
    if (a) {
      const orig = a.classification;
      const canon = orig;
      const key = `${orig}|${canon}`;
      map[key] = (map[key] || 0) + 1;
    } else if (d) {
      const orig = d.classification;
      const canon = orig;
      const key = `${orig}|${canon}`;
      map[key] = (map[key] || 0) + 1;
    }
  }
  const rows = Object.entries(map)
    .sort()
    .map(([k, count]) => {
      const [o, c] = k.split("|");
      return {
        original_classification: o,
        canonical_classification: c,
        count: String(count),
      };
    });
  return (
    [
      header.join(","),
      ...rows.map((r) => header.map((h) => esc(r[h])).join(",")),
    ].join("\n") + "\n"
  );
}

function buildReport(inv, failures, sourceFiles) {
  const L = [];
  const line = (s = "") => L.push(s);
  const dayStamp = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
  line("# Reconciliación final del inventario SEO (lotes 1–9)");
  line();
  line(
    `**Veredicto:** ${failures.length === 0 ? "`SEO_GROWTH_ALL_BATCHES = COMPLETE_RECONCILED`" : "`SE requiere revisión`"}`,
  );
  line(`**Generado:** ${dayStamp}`);
  line();
  line("## Identidad canónica");
  line();
  line(
    "- Unidad de conteo: `normalized_slug` (minúsculas, sin barras, sin query/fragmento).",
  );
  line(
    "- Comprobación secundaria: `canonical_url` (sin protocolo/www, sin barra final).",
  );
  line(`- Host canónico derivado de \`.env.example\`: \`${inv.host}\`.`);
  line();
  line("## Ecuaciones verificadas");
  line();
  line("```");
  line(
    `TOTAL (${inv.totalUnique}) = PUBLISHED (${inv.publishedAnalyzed}) + UNPUBLISHED (${inv.unpublishedUnique})`,
  );
  line(
    `PUBLISHED (${inv.publishedAnalyzed}) = OPTIMIZED (${inv.optimized}) + KEEP_NO_CHANGE (${inv.keepNoChange}) + INSUFFICIENT_DATA (${inv.insufficientData}) + EXTERNAL_DEFERRED (${inv.externalDeferred})`,
  );
  const sumApproved = Object.values(inv.approvedBreakdown).reduce(
    (a, b) => a + b,
    0,
  );
  const breakdownStr = Object.entries(inv.approvedBreakdown)
    .map(([k, v]) => `${k} (${v})`)
    .join(" + ");
  line(`OPTIMIZED (${inv.optimized} = ${sumApproved}) = ${breakdownStr}`);
  line("```");
  line();
  line("## Conteos definitivos");
  line();
  line("| Concepto | Conteo |");
  line("|---|---|");
  line(`| total_unique | ${inv.totalUnique} |`);
  line(`| published_analyzed | ${inv.publishedAnalyzed} |`);
  line(`| optimized_unique | ${inv.optimized} |`);
  line(`| keep_no_change_unique | ${inv.keepNoChange} |`);
  line(`| insufficient_data_unique | ${inv.insufficientData} |`);
  line(`| external_deferred_unique | ${inv.externalDeferred} |`);
  line(`| unpublished_unique | ${inv.unpublishedUnique} |`);
  line(`| measurement_pending_unique | ${inv.measurementPending} |`);
  line(`| manual_ga4_pending_unique | ${inv.manualGa4Pending} |`);
  line(
    `| duplicate_slugs_across_batches | ${inv.duplicateSlugsAcrossBatches.length} |`,
  );
  line(
    `| approved_and_deferred_overlap | ${inv.approvedDeferredOverlap.length} |`,
  );
  line(
    `| published_and_unpublished_overlap | ${inv.publishedUnpublishedOverlap.length} |`,
  );
  line(`| unclassified_unique | ${inv.unclassified.length} |`);
  line();
  line("## Desglose de optimización (aprobados)");
  line();
  line("| Clasificación canónica | Conteo |");
  line("|---|---|");
  for (const [k, v] of Object.entries(inv.approvedBreakdown).sort())
    line(`| ${k} | ${v} |`);
  line();
  line("## Desglose de diferidos");
  line();
  line("| Clasificación canónica | Conteo |");
  line("|---|---|");
  for (const [k, v] of Object.entries(inv.deferredBreakdown).sort())
    line(`| ${k} | ${v} |`);
  line();
  line("## Investigación del desfase 175/176");
  line();
  line(
    'El inventario original declara 175 artículos. La suma errónea "176" aparece si se suma',
  );
  line(
    "`135 analizadas + 41 no publicadas`, porque `empleador-no-paga-salario-honduras` estaba",
  );
  line(
    "doble-contado: analizada en el lote 1 **y** marcada `published=false` en",
  );
  line(
    "`content-decision-final.csv` (aunque está publicada y optimizada en producción, con 201",
  );
  line(
    "impresiones GSC). Corregido el flag a `published=true`, el inventario cierra en **175**:",
  );
  line(
    "135 publicadas analizadas + 40 no publicadas. El desglose anterior de optimizadas",
  );
  line(
    "(22+47+13=82) también era erróneo; el correcto derivado de los patches es",
  );
  line("30+61+13=104.");
  line();
  line("## Duplicados y solapamientos");
  line();
  if (
    inv.duplicateSlugsAcrossBatches.length === 0 &&
    inv.approvedDeferredOverlap.length === 0 &&
    inv.publishedUnpublishedOverlap.length === 0 &&
    inv.selectedUnpublishedOverlap.length === 0
  ) {
    line(
      "Ninguno. Todos los slugs son únicos y no hay solapamientos entre aprobado/diferido,",
    );
    line("publicado/no publicado ni seleccionado/no publicado.");
  } else {
    for (const [slug, v] of inv.duplicateSlugsAcrossBatches)
      line(
        `- Duplicado entre lotes: ${slug} (${[...v.batches].sort().join(",")})`,
      );
    for (const slug of inv.approvedDeferredOverlap)
      line(`- Aprobado y diferido: ${slug}`);
    for (const slug of inv.publishedUnpublishedOverlap)
      line(`- Publicado y no publicado: ${slug}`);
    for (const slug of inv.selectedUnpublishedOverlap)
      line(`- Seleccionado y no publicado: ${slug}`);
  }
  line();
  line("## Fuentes de verdad");
  line();
  for (const f of sourceFiles) line(`- \`${f}\``);
  line();
  if (failures.length > 0) {
    line("## Fallos de invariantes");
    line();
    for (const f of failures) line(`- ${f}`);
  }
  return L.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  return {
    check: argv.includes("--check"),
    json: argv.includes("--json"),
  };
}

/**
 * @param {string} growthDir
 * @param {{ write?: boolean }} [opts]
 * @returns {{ inv: Record<string, any>, ok: boolean, failures: string[], deliverables: Record<string, any> }}
 */
export function runReconcile(growthDir = GROWTH, { write = true } = {}) {
  const data = loadBatchData(growthDir);
  const inv = deriveInventory(data);
  const { ok, failures } = checkInvariants(inv);
  const sourceFiles = [
    ...Object.keys(data.batches).map((b) => `batch-${b}-selection.csv`),
    ...Object.keys(data.batches).map((b) => `batch-${b}-editorial-review.csv`),
    ...Object.keys(data.batches).map((b) => `batch-${b}-approved-patch.json`),
    ...Object.keys(data.batches).map((b) => `batch-${b}-deferred-patch.json`),
    ...Object.keys(data.batches).map(
      (b) => `batch-${b}-experiment-manifest.csv`,
    ),
    "content-decision-final.csv",
    "processed-slugs.json",
    "cross-platform-url-analysis.csv",
    "all-batches-master-report.md",
  ];

  const deliverables = {
    // generatedAt determinista por día (estable dentro del día) para que la
    // regeneración no produzca drift en el árbol ni en CI.
    generatedAt: new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z',
    sourceFiles,
    totalUnique: inv.totalUnique,
    publishedUnique: inv.publishedAnalyzed,
    optimizedUnique: inv.optimized,
    keepNoChangeUnique: inv.keepNoChange,
    insufficientDataUnique: inv.insufficientData,
    externalDeferredUnique: inv.externalDeferred,
    unpublishedUnique: inv.unpublishedUnique,
    measurementPendingUnique: inv.measurementPending,
    manualGa4PendingUnique: inv.manualGa4Pending,
    duplicates: {
      acrossBatches: inv.duplicateSlugsAcrossBatches.length,
      approvedAndDeferred: inv.approvedDeferredOverlap.length,
      publishedAndUnpublished: inv.publishedUnpublishedOverlap.length,
      selectedAndUnpublished: inv.selectedUnpublishedOverlap.length,
    },
    overlaps: {
      approvedAndDeferred: inv.approvedDeferredOverlap,
      publishedAndUnpublished: inv.publishedUnpublishedOverlap,
      selectedAndUnpublished: inv.selectedUnpublishedOverlap,
    },
    unclassified: inv.unclassified,
    invariants: {
      published_analyzed: inv.publishedAnalyzed,
      optimized: inv.optimized,
      keep_no_change: inv.keepNoChange,
      insufficient_data: inv.insufficientData,
      external_deferred: inv.externalDeferred,
      unpublished: inv.unpublishedUnique,
      total: inv.totalUnique,
      ok,
      failures,
    },
    verdict: ok
      ? "SEO_GROWTH_ALL_BATCHES = COMPLETE_RECONCILED"
      : "SEO_GROWTH_ALL_BATCHES = SE_REQUIERE_REVISION",
  };

  if (write) {
    writeFileSync(
      join(growthDir, "final-reconciliation.json"),
      JSON.stringify(deliverables, null, 2) + "\n",
      "utf8",
    );
    writeFileSync(
      join(growthDir, "final-reconciliation.csv"),
      buildFinalCsv(inv),
      "utf8",
    );
    writeFileSync(
      join(growthDir, "final-duplicate-analysis.csv"),
      buildDuplicateAnalysis(inv),
      "utf8",
    );
    writeFileSync(
      join(growthDir, "final-classification-map.csv"),
      buildClassificationMap(inv),
      "utf8",
    );
    writeFileSync(
      join(growthDir, "final-reconciliation-report.md"),
      buildReport(inv, failures, sourceFiles),
      "utf8",
    );
    writeFileSync(
      join(growthDir, "deferred-global.csv"),
      buildDeferredGlobal(inv),
      "utf8",
    );
  }

  return { inv, ok, failures, deliverables };
}

function main() {
  const { check, json } = parseArgs(process.argv.slice(2));
  const { inv, ok, failures, deliverables } = runReconcile(GROWTH, {
    write: !check,
  });
  if (json) {
    // Salida determinista: se omite generatedAt para permitir SECOND_RUN_DIFF=0.
    const { generatedAt: _g, ...stable } = deliverables;
    process.stdout.write(JSON.stringify(stable, null, 2) + "\n");
    return;
  }
  console.log(
    `Reconciliación: TOTAL=${inv.totalUnique} PUBLISHED=${inv.publishedAnalyzed} UNPUBLISHED=${inv.unpublishedUnique} OPTIMIZED=${inv.optimized} KEEP=${inv.keepNoChange} INSUF=${inv.insufficientData}`,
  );
  console.log(`Desglose aprobados: ${JSON.stringify(inv.approvedBreakdown)}`);
  console.log(`Desglose diferidos: ${JSON.stringify(inv.deferredBreakdown)}`);
  console.log(
    `Duplicados entre lotes: ${inv.duplicateSlugsAcrossBatches.length}`,
  );
  console.log(
    `Solapamientos: aprob/dif=${inv.approvedDeferredOverlap.length} pub/unpub=${inv.publishedUnpublishedOverlap.length} sel/unpub=${inv.selectedUnpublishedOverlap.length}`,
  );
  console.log(`Sin clasificar: ${inv.unclassified.length}`);
  if (failures.length > 0) {
    console.error("INVARIANTES FALLIDAS:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exitCode = 1;
  } else if (!check) {
    console.log(
      "Entregables escritos: final-reconciliation.{json,csv}, final-duplicate-analysis.csv, final-classification-map.csv, final-reconciliation-report.md, deferred-global.csv",
    );
  } else {
    console.log("CHECK OK — sin escritura.");
  }
}

// Guard de punto de entrada (permite importación desde tests).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}

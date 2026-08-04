/**
 * Selección del siguiente lote de URLs de crecimiento SEO.
 *
 * Lee `docs/seo/growth/cross-platform-url-analysis.csv` (175 URLs, score
 * reproducible), excluye los slugs ya procesados en lotes previos
 * (batch-*-selection.csv) y los no publicados, y escribe
 * `docs/seo/growth/batch-N-selection.csv` con las top-M por priority_score.
 *
 * Prioridad (PROMPT §4.B): impresiones+CTR bajo, posición 4–20, title
 * truncado/desalineado, metadescripción automática, tráfico sin conversión,
 * errores inequívocos de metadata.
 *
 * Uso:
 *   node scripts/seo-growth-batch-select.mjs --batch 2 --size 15
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = process.cwd();
const GROWTH = resolve(ROOT, "docs/seo/growth");

function parseArgs(argv) {
  const get = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : undefined;
  };
  return {
    batch: Number(get("--batch") ?? 2),
    size: Number(get("--size") ?? 15),
  };
}

/** Parseo de una línea CSV respetando comillas (RFC4180: `""` escapa comilla). */
function splitLine(l) {
  const out = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (inQuotes) {
      if (c === '"') {
        if (l[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(field);
      field = "";
    } else {
      field += c;
    }
  }
  out.push(field);
  return out;
}

function readCsv(path) {
  let content = readFileSync(path, "utf8");
  // Limpiar BOM UTF-8 si existe.
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const lines = content.split("\n").filter((l) => l.trim());
  const header = splitLine(lines[0]);
  return lines.slice(1).map((l) => {
    const f = splitLine(l);
    const o = {};
    header.forEach((h, i) => {
      o[h] = (f[i] ?? "").replace(/\r$/, "");
    });
    return o;
  });
}

function main() {
  const { batch, size } = parseArgs(process.argv.slice(2));
  let analysis = readCsv(join(GROWTH, "cross-platform-url-analysis.csv"));
  const malformed = analysis.filter((r) => !r.url).length;
  if (malformed > 0) {
    console.warn(`[select] ${malformed} filas malformadas ignoradas`);
    analysis = analysis.filter((r) => r.url);
  }
  if (analysis.length !== 175) {
    console.warn(
      `[select] análisis esperado 175 filas; hay ${analysis.length}`,
    );
  }

  // Excluir slugs ya seleccionados en lotes previos.
  const processed = new Set();
  for (let n = 1; n < batch; n++) {
    const f = join(GROWTH, `batch-${n}-selection.csv`);
    try {
      readCsv(f).forEach((r) => processed.add(r.url.split("/").pop()));
    } catch {
      /* lote anterior inexistente */
    }
  }
  // Excluir no publicados (si content-decision-final los marca).
  const decisions = (() => {
    try {
      return readCsv(join(GROWTH, "content-decision-final.csv"));
    } catch {
      return [];
    }
  })();
  const unpublished = new Set(
    decisions.filter((d) => d.published === "false").map((d) => d.slug),
  );

  const candidates = analysis
    .filter((r) => {
      const slug = r.url.split("/").pop();
      return !processed.has(slug) && !unpublished.has(slug);
    })
    .sort(
      (a, b) =>
        (Number(b.priority_score) || 0) - (Number(a.priority_score) || 0),
    )
    .slice(0, size);

  if (candidates.length === 0) {
    console.log(
      `[select] No quedan candidatos para batch ${batch} (excluidos procesados + no publicados).`,
    );
    return;
  }

  mkdirSync(GROWTH, { recursive: true });
  const out = join(GROWTH, `batch-${batch}-selection.csv`);
  const header =
    "priority,url,query_cluster,score,gsc_clicks_90,gsc_impressions_90,gsc_ctr,gsc_position,bing_impressions,organic_sessions,key_events,conversion_rate,content_action,recommended_action";
  const rows = candidates.map((r, i) => {
    const esc = (v) => (String(v).includes(",") ? `"${String(v)}"` : String(v));
    return [
      String(i + 1),
      esc(r.url),
      esc(r.query_cluster),
      r.priority_score,
      r.gsc_clicks_90,
      r.gsc_impressions_90,
      r.gsc_ctr,
      r.gsc_position,
      r.bing_impressions,
      r.organic_sessions,
      r.key_events,
      r.conversion_rate,
      r.content_action,
      r.recommended_action,
    ].join(",");
  });
  writeFileSync(out, [header, ...rows].join("\n") + "\n", "utf8");

  console.log(
    `[select] batch ${batch}: ${candidates.length} URLs (procesados previos=${processed.size}, no publicados=${unpublished.size})`,
  );
  console.log(`[select] → ${out}`);
  candidates.forEach((r, i) => {
    console.log(
      `  ${String(i + 1).padStart(2)}. score=${r.priority_score} imp=${r.gsc_impressions_90} ctr=${r.gsc_ctr} pos=${r.gsc_position} | ${r.url.split("/").pop()}`,
    );
  });
}

main();

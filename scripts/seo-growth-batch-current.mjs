/**
 * Recolecta la metadata ACTUAL (title/meta/H1) de las URLs de un lote desde
 * Production (GET read-only). NO escribe en la DB.
 *
 * Uso:
 *   node scripts/seo-growth-batch-current.mjs --batch 2
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GROWTH = resolve(ROOT, "docs", "seo", "growth");

function parseArgs(argv) {
  const get = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : undefined;
  };
  return { batch: Number(get("--batch") ?? 2) };
}

/** Parser RFC4180 robusto (comillas, "" escapa, BOM, CRLF). */
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
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      out.push(field);
      field = "";
    } else field += c;
  }
  out.push(field);
  return out;
}

function readCsv(path) {
  let content = readFileSync(path, "utf8");
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

const TIMEOUT = 25000;
async function getCurrent(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) return { status: res.status, title: "", meta: "", h1: "" };
    const html = await res.text();
    const t = html.match(/<title>([^<]*)<\/title>/);
    const m = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
    );
    const h = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    return {
      status: res.status,
      title: t ? t[1].trim() : "",
      meta: m ? m[1].trim() : "",
      h1: h ? h[1].replace(/<[^>]+>/g, "").trim() : "",
    };
  } catch (err) {
    return {
      status: 0,
      title: "",
      meta: "",
      h1: "",
      error: String(err.message || err).slice(0, 80),
    };
  }
}

async function main() {
  const { batch } = parseArgs(process.argv.slice(2));
  const selFile = resolve(GROWTH, `batch-${batch}-selection.csv`);
  if (!existsSync(selFile)) {
    throw new Error(`No existe ${selFile}`);
  }
  const rows = readCsv(selFile);
  const out = [];
  for (const r of rows) {
    const url = r.url;
    const slug = url.split("/").pop();
    const cur = await getCurrent(url);
    out.push({
      url,
      slug,
      category: "",
      gsc_evidence: `score=${r.score} imp=${r.gsc_impressions_90} ctr=${r.gsc_ctr} pos=${r.gsc_position}`,
      current: cur,
    });
    console.log(
      `${cur.status === 200 ? "OK " : "ERR"} ${slug} | ${cur.title.slice(0, 60)}`,
    );
  }
  const outFile = resolve(GROWTH, `batch-${batch}-current-metadata.json`);
  mkdirSync(GROWTH, { recursive: true });
  writeFileSync(
    outFile,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), count: out.length, urls: out },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  console.log(`[current] ${out.length} URLs → ${outFile}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

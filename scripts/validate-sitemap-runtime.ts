/**
 * Validación del sitemap en runtime contra datos dinámicos (PROMPT 2 §7.3).
 *
 * Requiere la aplicación ejecutándose (next start) con una base local/staging
 * configurada (p. ej. `--env-file .env.e2e.local`). Valida:
 *   - XML bien formado y content-type correcto;
 *   - conteo de URLs y origen canónico;
 *   - sin duplicados;
 *   - sin rutas privadas;
 *   - landings NOINDEX excluidas del segmento local;
 *   - cada URL del sitemap del blog corresponde a un artículo indexable real;
 *   - coherencia con data/seo/sitemap-public-manifest.json.
 *
 * Genera:
 *   docs/seo/current/blog-sitemap-diff.csv
 *
 * Salida: exit 0 = PASS, exit 1 = FAIL, exit 2 = SKIPPED (app/base no accesible).
 *
 * Uso:
 *   npx tsx scripts/validate-sitemap-runtime.ts --base-url http://localhost:3100
 *        [--env-file .env.e2e.local]
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import {
  inspectEnvironment,
  describeEnvironment,
  loadEnvFile,
} from "@/scripts/lib/environment-guard";
import { NOINDEX_LANDING_PATHS } from "@/lib/seo/public-indexability";
import { csv } from "@/scripts/lib/dynamic-content";

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, "docs/seo/current");

const CANONICAL_ORIGIN = "https://www.pinedayasociadoshn.com";
const PRIVATE_PREFIXES = ["/admin", "/intranet", "/api", "/cargar", "/_next"];

interface SitemapCheck {
  segment: string;
  url_count: number;
  ok: boolean;
  details: string;
}

function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) locs.push(m[1].trim());
  return locs;
}

function isXml(contentType: string | null, body: string): boolean {
  return Boolean(
    (contentType && contentType.includes("xml")) ||
    body.trim().startsWith("<?xml"),
  );
}

function isPrivate(path: string): boolean {
  return PRIVATE_PREFIXES.some((p) => path.startsWith(p));
}

async function main(): Promise<void> {
  const baseUrl = process.argv.includes("--base-url")
    ? process.argv[process.argv.indexOf("--base-url") + 1]
    : "http://localhost:3100";
  const envFile = process.argv.includes("--env-file")
    ? process.argv[process.argv.indexOf("--env-file") + 1]
    : ".env.local";
  loadEnvFile(envFile);
  const inspection = inspectEnvironment();
  mkdirSync(OUT_DIR, { recursive: true });

  const failures: string[] = [];
  const infos: string[] = [];
  const checks: SitemapCheck[] = [];

  const segments = [
    "sitemap.xml",
    "sitemap-pages.xml",
    "sitemap-services.xml",
    "sitemap-blog.xml",
    "sitemap-authors.xml",
    "sitemap-local.xml",
  ];

  const fetched = new Map<
    string,
    { locs: string[]; contentType: string | null; body: string }
  >();
  for (const segment of segments) {
    const url = `${baseUrl}/${segment}`;
    try {
      const res = await fetch(url, { redirect: "manual" });
      const contentType = res.headers.get("content-type");
      const body = await res.text();
      if (res.status !== 200) {
        failures.push(`${segment}: HTTP ${res.status} (esperado 200 XML).`);
        checks.push({
          segment,
          url_count: 0,
          ok: false,
          details: `HTTP ${res.status}`,
        });
        continue;
      }
      if (res.redirected) {
        failures.push(`${segment}: redirigido a ${res.url}.`);
      }
      const locs = extractLocs(body);
      fetched.set(segment, { locs, contentType, body });
      const xmlOk = isXml(contentType, body);
      if (!xmlOk) {
        failures.push(`${segment}: content-type no XML o body no XML.`);
      }
      checks.push({
        segment,
        url_count: locs.length,
        ok: xmlOk,
        details: xmlOk ? `${locs.length} URLs` : "no XML",
      });
    } catch (err) {
      failures.push(
        `${segment}: no accesible (${(err as Error).message.slice(0, 80)}).`,
      );
      checks.push({ segment, url_count: 0, ok: false, details: "unreachable" });
    }
  }

  if (fetched.size === 0) {
    console.log("⛔ SITEMAP RUNTIME: SKIPPED_WITH_REASON (app no accesible).");
    console.log(
      `   Arranque la app con next start y vuelva a ejecutar (--base-url ${baseUrl}).`,
    );
    process.exit(2);
  }

  // ── Análisis por segmento ───────────────────────────────────────────────
  for (const [segment, { locs }] of fetched) {
    const paths = locs.map((l) => {
      try {
        return new URL(l).pathname;
      } catch {
        return l;
      }
    });

    const badOrigin = locs.filter((l) => !l.startsWith(CANONICAL_ORIGIN));
    if (badOrigin.length) {
      failures.push(
        `${segment}: ${badOrigin.length} URL(s) con origen no canónico.`,
      );
    }

    const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);
    if (dupes.length) {
      failures.push(`${segment}: ${dupes.length} URL(s) duplicada(s).`);
    }

    const privates = paths.filter(isPrivate);
    if (privates.length) {
      failures.push(
        `${segment}: rutas privadas en sitemap: ${privates.join(", ")}`,
      );
    }
  }

  // Segmento local: landings NOINDEX excluidas.
  const local = fetched.get("sitemap-local.xml");
  if (local) {
    const localPaths = local.locs.map((l) => new URL(l).pathname);
    const leaked = [...NOINDEX_LANDING_PATHS].filter((p) =>
      localPaths.includes(p),
    );
    if (leaked.length) {
      failures.push(
        `sitemap-local: landings NOINDEX presentes: ${leaked.join(", ")}`,
      );
    } else {
      infos.push(
        `sitemap-local: sin landings NOINDEX (${localPaths.length} URLs).`,
      );
    }
  }

  // ── Segmento blog: coherencia con la DB ────────────────────────────────
  const blog = fetched.get("sitemap-blog.xml");
  let indexableBySlug = new Map<string, boolean>();
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.includes("placeholder")) {
    const sql: NeonQueryFunction<false, false> = neon(dbUrl);
    const rows = (await sql`
      select slug, category from blog_posts
      where published = true and noindex is not true
        and review_status in ('published_firm_reviewed', 'reviewed')`) as Array<{
      slug: string;
      category: string;
    }>;
    indexableBySlug = new Map(
      rows.map((r) => [`/blog/${r.category}/${r.slug}`, true]),
    );
  }

  if (blog) {
    const blogPaths = blog.locs.map((l) => new URL(l).pathname);
    const articlePaths = blogPaths.filter((p) =>
      /^\/blog\/[^/]+\/[^/]+$/.test(p),
    );
    const missingInDb = articlePaths.filter((p) => !indexableBySlug.has(p));
    if (missingInDb.length) {
      failures.push(
        `sitemap-blog: ${missingInDb.length} URL(s) no corresponden a artículos indexables reales: ${missingInDb.slice(0, 5).join(", ")}${missingInDb.length > 5 ? "…" : ""}`,
      );
    }
    const manifest = JSON.parse(
      readFileSync(join(ROOT, "data/seo/sitemap-public-manifest.json"), "utf8"),
    ) as { blog: { min_indexable: number; allowed_withdrawn: string[] } };
    if (articlePaths.length < manifest.blog.min_indexable) {
      failures.push(
        `sitemap-blog: ${articlePaths.length} artículos < piso ${manifest.blog.min_indexable}.`,
      );
    }
    infos.push(
      `sitemap-blog: ${articlePaths.length} artículos (piso ${manifest.blog.min_indexable}).`,
    );

    // ── Diff → blog-sitemap-diff.csv ──────────────────────────────────────
    const diffRows = articlePaths.map((p) => ({
      segment: "blog",
      url: p,
      status: indexableBySlug.has(p) ? "EXISTS_INDEXABLE" : "MISSING_IN_DB",
      in_manifest: "n/a",
      change: "current",
    }));
    writeFileSync(
      join(OUT_DIR, "blog-sitemap-diff.csv"),
      csv(["segment", "url", "status", "in_manifest", "change"], diffRows),
    );
    infos.push(`blog-sitemap-diff.csv: ${diffRows.length} filas.`);
  }

  // ── robots.txt y llms.txt ───────────────────────────────────────────────
  try {
    const robots = await fetch(`${baseUrl}/robots.txt`);
    const robotsText = await robots.text();
    if (!robotsText.includes("sitemap")) {
      infos.push("robots.txt no referencia sitemap (revisar).");
    }
  } catch {
    infos.push("robots.txt no accesible.");
  }
  try {
    const llmsRes = await fetch(`${baseUrl}/llms.txt`);
    const llmsText = await llmsRes.text();
    if (!llmsText.includes("/sitemap.xml")) {
      failures.push("llms.txt no referencia el sitemap index.");
    }
  } catch {
    infos.push("llms.txt no accesible.");
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log(" Validación de sitemap en runtime");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Base: ${baseUrl}`);
  console.log(`Entorno: ${describeEnvironment(inspection)}`);
  for (const c of checks) {
    console.log(
      `  ${c.segment}: ${c.url_count} URLs — ${c.ok ? "OK" : "FAIL"} (${c.details})`,
    );
  }
  console.log(`Errores: ${failures.length}`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  for (const i of infos) console.log(`  ℹ ${i}`);
  if (failures.length > 0) {
    console.log("⛔ SITEMAP RUNTIME: FAIL");
    process.exit(1);
  }
  console.log("✅ SITEMAP RUNTIME: PASS");
}

const isEntry =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
  main().catch((error) => {
    console.error("[validate-sitemap-runtime]", (error as Error).message);
    process.exit(1);
  });
}

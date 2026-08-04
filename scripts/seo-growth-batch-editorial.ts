/**
 * Generador editorial genérico por lote (N).
 *
 * Lee:
 *   - docs/seo/growth/batch-N-current-metadata.json  (url, slug, current)
 *   - docs/seo/growth/batch-N-decisions.json         (decisiones curadas)
 * Escribe:
 *   - docs/seo/growth/batch-N-editorial-review.csv
 *   - docs/seo/growth/batch-N-approved-patch.json
 *   - docs/seo/growth/batch-N-deferred-patch.json
 *   - docs/seo/growth/batch-N-experiment-manifest.csv
 *
 * Validaciones: content-policy (R24), sin plantillas, sin años no
 * verificados, sin "penas", límites title<=60 / meta<=160. METADATA_ONLY:
 * no añade hechos legales nuevos.
 *
 * Uso: npx tsx scripts/seo-growth-batch-editorial.ts --batch 2
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { scanContentPolicyViolations } from "../lib/content-policy";
import { META_TITLE_MAX } from "../lib/seo";

const ROOT = process.cwd();
const GROWTH = resolve(ROOT, "docs/seo/growth");
const META_DESC_MAX = 160;
const MIN_TITLE = 20;

function parseArgs(argv: string[]) {
  const get = (name: string) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : undefined;
  };
  return { batch: Number(get("--batch") ?? 2) };
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function assertNoTemplate(slug: string, text: string) {
  const bad = [
    /\bResuelve\b/i,
    /pasos concretos, requisitos y fuentes oficiales/i,
    /sin\s+compromiso/i,
    /\b20\d{2}\b/,
    /\bpenas?\b/i,
  ];
  for (const re of bad) {
    if (re.test(text))
      throw new Error(
        `[editorial] Plantilla/prohibido en ${slug}: ${re.source}`,
      );
  }
}

function assertNoPolicy(slug: string, field: string, text: string) {
  const errors = scanContentPolicyViolations(text).filter(
    (v) => v.severity === "error",
  );
  if (errors.length > 0) {
    throw new Error(
      `[editorial] Violación de política en ${slug}.${field}: ${errors.map((e) => e.code).join(",")}`,
    );
  }
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}
const q = (s: string): string => `"${String(s).replace(/"/g, '""')}"`;

interface CurrentMeta {
  url: string;
  slug: string;
  category?: string;
  gsc_evidence: string;
  current: { title: string; meta: string; h1: string; status: number };
}
interface Decision {
  classification: string;
  keepH1?: boolean;
  title?: string;
  meta?: string;
  reason: string;
  legalNotes: string;
}

function main() {
  const { batch } = parseArgs(process.argv.slice(2));
  const metaFile = join(GROWTH, `batch-${batch}-current-metadata.json`);
  const decFile = join(GROWTH, `batch-${batch}-decisions.json`);
  const meta = JSON.parse(readFileSync(metaFile, "utf8")) as { urls: CurrentMeta[] };
  const parsed = JSON.parse(readFileSync(decFile, "utf8")) as { decisions: Record<string, Decision> };
  const decisions = parsed.decisions;

  const slugs = new Set(meta.urls.map((u) => u.slug));
  for (const slug of Object.keys(decisions)) {
    if (!slugs.has(slug))
      throw new Error(
        `[editorial] Decisión para slug no presente en el lote ${batch}: ${slug}`,
      );
  }

  const rows: string[] = [];
  const approved: Array<Record<string, unknown>> = [];
  const deferred: Array<Record<string, unknown>> = [];
  const manifest: Array<Record<string, string>> = [];
  const errors: string[] = [];

  const header = [
    "url",
    "slug",
    "gsc_evidence",
    "current_title",
    "current_meta",
    "current_h1",
    "classification",
    "approved_title",
    "approved_meta",
    "reason",
    "legal_notes",
  ];
  rows.push(header.join(","));

  for (const u of meta.urls) {
    const d = decisions[u.slug];
    if (!d) throw new Error(`[editorial] Falta decisión para ${u.slug}`);
    const cur = u.current;
    const approvedTitle = d.title ?? cur.title;
    const approvedMeta = d.meta || cur.meta;
    const isApproved = d.classification.startsWith("APPROVED");

    if (isApproved) {
      const t = normalize(approvedTitle);
      const m = normalize(approvedMeta);
      if (t.length > META_TITLE_MAX)
        errors.push(`${u.slug}: title ${t.length} > ${META_TITLE_MAX}`);
      if (t.length < MIN_TITLE)
        errors.push(`${u.slug}: title ${t.length} < ${MIN_TITLE}`);
      if (m.length > META_DESC_MAX)
        errors.push(`${u.slug}: meta ${m.length} > ${META_DESC_MAX}`);
      assertNoTemplate(u.slug, t);
      assertNoTemplate(u.slug, m);
      assertNoPolicy(u.slug, "title", t);
      assertNoPolicy(u.slug, "meta", m);
    }
    rows.push(
      [
        u.url,
        u.slug,
        q(u.gsc_evidence),
        q(cur.title),
        q(cur.meta),
        q(cur.h1),
        d.classification,
        q(approvedTitle),
        q(approvedMeta),
        q(d.reason),
        q(d.legalNotes),
      ].join(","),
    );

    const base = {
      url: u.url,
      slug: u.slug,
      category: u.category ?? "",
      gsc_evidence: u.gsc_evidence,
      classification: d.classification,
      reason: d.reason,
      legal_notes: d.legalNotes,
      legal_review: isApproved ? "METADATA_ONLY" : "NONE",
      legal_claims_added: "none",
    };

    if (isApproved) {
      const after: Record<string, string> = { metaDescription: approvedMeta, metaTitle: approvedTitle };
      if (!d.keepH1) after.title = approvedTitle;
      approved.push({
        ...base,
        status: "APPROVED",
        before: null,
        after,
        contentHash: sha256(JSON.stringify(after)),
        rowVersion: 1,
      });
      manifest.push({
        url: u.url,
        baseline_date: "2026-08-04",
        title_before: q(cur.title),
        gsc_before: u.gsc_evidence,
        title_after: q(approvedTitle),
        meta_after: q(approvedMeta),
        h1_after: d.keepH1 ? q("sin cambio (h1 intacto)") : q(approvedTitle),
        content_changes: "metadata_only",
        measurement_start: "2026-08-04",
        measurement_end: "2026-09-01",
      });
    } else {
      deferred.push({ ...base, status: d.classification });
      manifest.push({
        url: u.url,
        baseline_date: "2026-08-04",
        title_before: q(cur.title),
        gsc_before: u.gsc_evidence,
        title_after: '"(sin cambio)"',
        meta_after: '"(sin cambio)"',
        h1_after: '"(sin cambio)"',
        content_changes: "NO_CHANGE",
        measurement_start: "",
        measurement_end: "",
      });
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[editorial] Errores de validación:\n- ${errors.join("\n- ")}`,
    );
  }

  mkdirSync(GROWTH, { recursive: true });
  const out = (n: string) => join(GROWTH, `batch-${batch}-${n}`);
  writeFileSync(out("editorial-review.csv"), rows.join("\n") + "\n", "utf8");
  writeFileSync(
    out("approved-patch.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: `batch-${batch}-current-metadata.json`,
        status: "EDITORIAL_APPROVED",
        count: approved.length,
        applyPolicy: {
          columns: ["title", "metaTitle", "metaDescription"],
          dryRunDefault: true,
          productionRequires: "ALLOW_PRODUCTION_SEO_BATCH1=true",
          noSlugChanges: true,
          noRedirects: true,
          noNoindexChanges: true,
        },
        patch: approved,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  writeFileSync(
    out("deferred-patch.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: `batch-${batch}-current-metadata.json`,
        status: "DEFERRED",
        count: deferred.length,
        note: "KEEP_NO_CHANGE/INSUFFICIENT_DATA excluidos de la aplicación de producción.",
        patch: deferred,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  const mheader =
    "url,baseline_date,title_before,gsc_before,title_after,meta_after,h1_after,content_changes,measurement_start,measurement_end";
  writeFileSync(
    out("experiment-manifest.csv"),
    [
      mheader,
      ...manifest.map((m) =>
        [
          m.url,
          m.baseline_date,
          m.title_before,
          q(m.gsc_before),
          m.title_after,
          m.meta_after,
          m.h1_after,
          m.content_changes,
          m.measurement_start,
          m.measurement_end,
        ].join(","),
      ),
    ].join("\n") + "\n",
    "utf8",
  );

  console.log(
    `[editorial] batch ${batch}: aprobados=${approved.length} diferidos=${deferred.length}`,
  );
}

try {
  main();
} catch (err: unknown) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

/**
 * Resolución integral del enlazado interno (53 casos).
 *
 * Lee:
 *   - docs/seo/current/internal-link-action-report.csv (53 ACTION_REQUIRED);
 *   - docs/seo/current/internal-link-audit.csv (déficits por artículo);
 *   - la DB local/staging (SOLO lectura) para verificar el estado real de cada
 *     artículo y de los targets recomendados.
 *
 * Genera:
 *   - data/seo/article-seo-relations.json       (relaciones canónicas validadas);
 *   - docs/seo/current/internal-link-resolution.csv   (53 filas, resolución individual);
 *   - docs/seo/current/internal-links-patch.json      (patch determinista con precondiciones);
 *   - docs/seo/current/internal-links-manual-review.csv.
 *
 * Clasificación (§6.1 → §6.4):
 *   - AUTO_FIX_SOURCE / AUTO_FIX_DATABASE / GENERATED_LOGIC_FIX /
 *     MANUAL_LEGAL_REVIEW / NO_CHANGE_REQUIRED / BLOCKED_BY_MISSING_TARGET
 *   - Estado final: RESOLVED_IN_CODE / RESOLVED_IN_STAGING /
 *     READY_FOR_PRODUCTION_PATCH / REQUIRES_HUMAN_DECISION / INVALID_OR_OBSOLETE
 *
 * Rechaza producción. No escribe en la DB (solo genera artefactos). El patch
 * de enlaces en body se propone, NO se ejecuta.
 *
 * Uso:
 *   npx tsx scripts/internal-links-patch.ts --env-file .env.e2e.local
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import {
  inspectEnvironment,
  assertAllowedEnvironment,
  describeEnvironment,
  loadEnvFile,
} from '@/scripts/lib/environment-guard';
import { shortHash, csv } from '@/scripts/lib/dynamic-content';
import { BLOG_TO_SERVICE } from '@/lib/internal-links';
import {
  expectedServicePathForCategory,
  validateArticleSeoRelations,
  type ArticleSeoRelations,
  type ArticleCatalog,
} from '@/lib/seo/article-relations';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'docs/seo/current');

/** Parser CSV mínimo (respeta comillas dobles). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += char;
    } else if (char === '"') inQuotes = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell); cell = ''; rows.push(row); row = []; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

type ResolutionState =
  | 'RESOLVED_IN_CODE'
  | 'RESOLVED_IN_STAGING'
  | 'READY_FOR_PRODUCTION_PATCH'
  | 'REQUIRES_HUMAN_DECISION'
  | 'INVALID_OR_OBSOLETE';

type CauseClass =
  | 'AUTO_FIX_SOURCE'
  | 'AUTO_FIX_DATABASE'
  | 'GENERATED_LOGIC_FIX'
  | 'MANUAL_LEGAL_REVIEW'
  | 'NO_CHANGE_REQUIRED'
  | 'BLOCKED_BY_MISSING_TARGET';

interface ResolutionRow {
  url: string;
  slug: string;
  category: string;
  review_status: string;
  published: boolean;
  noindex: boolean;
  indexable: boolean;
  effective_body_links: number;
  official_sources: number;
  service_link_rendered: boolean;
  cause_classification: CauseClass;
  final_state: ResolutionState;
  primary_service: string;
  related_recommended: string;
  related_verified: string;
  official_sources_status: string;
  notes: string;
}

const REDIRECT_SOURCE_PATHS = new Set<string>([
  '/blog/derecho-laboral/despido-laboral-honduras-derechos',
  '/blog/derecho-laboral/calcular-prestaciones-laborales-honduras',
  '/blog/derecho-laboral/despido-injustificado-honduras-derechos-trabajador',
  '/blog/derecho-laboral/empleador-no-paga-salario-honduras',
  '/blog/derecho-de-familia/divorcio-honduras-pasos-requisitos',
  '/blog/derecho-de-familia/divorcio-tipos-requisitos-tiempos-honduras',
  '/blog/derecho-de-familia/divorcio-express-mutuo-acuerdo-honduras',
  '/blog/derecho-de-familia/problemas-legales-familiares-honduras',
  '/blog/derecho-de-familia/pension-alimenticia-honduras-como-solicitarla',
  '/blog/derecho-de-familia/pension-alimenticia-calcular-reclamar-honduras',
  '/blog/derecho-de-familia/guarda-custodia-menores-tipos-honduras',
  '/blog/derecho-de-familia/violencia-intrafamiliar-denuncia-proteccion-honduras',
  '/blog/practica-legal/como-elegir-buen-abogado-guia-practica-honduras',
  '/blog/practica-legal/elegir-bufete-abogados-nacaome',
  '/blog/practica-legal/elegir-bufete-multidisciplinario-ventajas-honduras',
  '/blog/derecho-civil/herencias-honduras-fallece-familiar',
  '/blog/derecho-notarial/tramites-notariales-frecuentes-honduras',
  '/blog/derechos-ciudadanos/derechos-del-detenido-guia-constitucional-honduras',
  '/blog/derecho-mercantil/contratos-mercantiles-proteger-negocio',
  '/blog/derecho-mercantil/constitucion-empresas-honduras-pasos-legales',
  '/blog/derecho-mercantil/errores-contratos-civiles-honduras',
  '/blog/derecho-mercantil/elegir-tipo-sociedad-empresa-honduras',
  '/blog/derecho-administrativo/recurso-de-amparo-para-que-sirve-honduras',
  '/blog/derecho-administrativo/despido-empleados-publicos-procedencia-defensa-honduras',
  '/blog/derecho-bancario/ejecucion-hipotecaria-que-hacer-honduras',
  '/blog/derecho-bancario/derechos-consumidor-financiero-cnbs-honduras',
  '/blog/derecho-bancario/central-riesgos-consultar-impugnar-honduras',
  '/blog/derecho-bancario/creditos-reestructuracion-deudas-bancarias-honduras',
  '/blog/noticias-legales/actualizacion-legislativa-mensual-honduras',
  '/blog/conciliacion-arbitraje/arbitraje-cuando-conviene-como-funciona-honduras',
  '/blog/derecho-ambiental/evaluacion-impacto-ambiental-paso-a-paso-honduras',
  '/blog/hondurenos-en-espana/hondurenos-en-espana-guia-legal-completa',
  '/blog/derecho-penal/abogado-penalista-choluteca',
  '/blog/practica-legal/abogados-en-choluteca',
  '/blog/practica-legal/abogados-en-san-lorenzo',
  '/blog/practica-legal/abogados-en-pespire-choluteca',
  '/blog/practica-legal/abogados-en-marcovia-choluteca',
  '/blog/practica-legal/abogados-en-san-marcos-de-colon-choluteca',
  '/blog/practica-legal/abogados-en-amapala-valle',
]);

interface CatalogPost {
  slug: string;
  category: string;
  review_status: string | null;
  published: boolean;
  noindex: boolean | null;
  body: string;
  title: string;
}

async function loadCatalog(): Promise<{ posts: Map<string, CatalogPost>; inspection: ReturnType<typeof inspectEnvironment> }> {
  const url = process.env.DATABASE_URL;
  const sql: NeonQueryFunction<false, false> = neon(url!);
  const rows = (await sql`select slug, category, review_status, published, noindex, body, title from blog_posts`) as Array<{
    slug: string; category: string; review_status: string | null; published: boolean;
    noindex: boolean | null; body: string; title: string;
  }>;
  const posts = new Map<string, CatalogPost>();
  for (const r of rows) posts.set(r.slug, { ...r });
  return { posts, inspection: inspectEnvironment() };
}

function countBodyLinks(body: string, selfUrl: string): { effective: number; official: number } {
  const hrefs: string[] = [];
  const re = /href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) hrefs.push(m[1]);
  const effective = hrefs.filter((h) => !h.startsWith('http') && h !== selfUrl).length;
  const official = hrefs.filter((h) =>
    /^(?:https?:)?\/\//i.test(h)
    && /(?:gob\.hn|poderjudicial\.gob\.hn|tse\.hn|cnbs\.gob\.hn|sar\.gob\.hn|poderjudicial)/i.test(h),
  ).length;
  return { effective, official };
}

async function main() {
  const envFile = process.argv.includes('--env-file')
    ? process.argv[process.argv.indexOf('--env-file') + 1]
    : '.env.local';
  const writeRelations = process.argv.includes('--write-relations');
  loadEnvFile(envFile);
  const inspection = inspectEnvironment();
  assertAllowedEnvironment('seo:internal-links:patch', { write: false });
  mkdirSync(OUT_DIR, { recursive: true });

  const actionText = readFileSync(join(OUT_DIR, 'internal-link-action-report.csv'), 'utf8');
  const actionRows = parseCsv(actionText).filter((r) => r.length >= 4 && r[0].startsWith('/blog/'));
  const action = actionRows.map((r) => ({
    url: r[0],
    slug: r[1],
    category: r[2],
    problema: r[3],
    service_link: r[4],
    cluster_links: r[5],
    official_sources_ausentes: r[6],
  }));

  const auditText = readFileSync(join(OUT_DIR, 'internal-link-audit.csv'), 'utf8');
  const auditRows = parseCsv(auditText).filter((r) => r.length >= 10 && r[0].startsWith('/blog/'));
  const auditByUrl = new Map(auditRows.map((r) => [r[0], {
    cluster_links: Number(r[3]) || 0,
    official_sources: Number(r[4]) || 0,
    service_link: r[1],
  }]));

  const { posts } = await loadCatalog();

  const resolutions: ResolutionRow[] = [];
  const relations: ArticleSeoRelations[] = [];

  for (const a of action) {
    const post = posts.get(a.slug);
    const audit = auditByUrl.get(a.url);
    const isRedirectSource = REDIRECT_SOURCE_PATHS.has(a.url);
    const indexable = Boolean(post)
      && post!.published === true
      && post!.noindex !== true
      && (post!.review_status === 'published_firm_reviewed' || post!.review_status === 'reviewed')
      && !isRedirectSource;

    const bodyAnalysis = post
      ? countBodyLinks(post.body, a.url)
      : { effective: 0, official: 0 };
    const effectiveBodyLinks = bodyAnalysis.effective;
    const officialSources = bodyAnalysis.official;
    const serviceLinkRendered = Boolean(BLOG_TO_SERVICE[a.category]);

    // Targets recomendados (del action report) verificados contra staging.
    const recommended = (a.cluster_links ?? '').split('|').map((s) => s.trim()).filter(Boolean);
    const verifiedTargets: string[] = [];
    for (const target of recommended) {
      if (verifiedTargets.length >= 2) break;
      const t = posts.get(target);
      const tIndexable = Boolean(t)
        && t!.published === true
        && t!.noindex !== true
        && (t!.review_status === 'published_firm_reviewed' || t!.review_status === 'reviewed');
      if (tIndexable) verifiedTargets.push(target);
    }

    const servicePath = expectedServicePathForCategory(a.category);

    let cause: CauseClass;
    let state: ResolutionState;
    let notes = '';

    if (!post) {
      cause = 'BLOCKED_BY_MISSING_TARGET';
      state = 'INVALID_OR_OBSOLETE';
      notes = 'Artículo no encontrado en staging.';
    } else if (isRedirectSource || !indexable) {
      cause = 'MANUAL_LEGAL_REVIEW';
      state = 'INVALID_OR_OBSOLETE';
      notes = isRedirectSource
        ? 'La URL es origen de redirect 301 (no indexable): el déficit no aplica a una URL pública.'
        : `Estado no indexable: published=${post.published}, noindex=${post.noindex}, review_status=${post.review_status}.`;
    } else if (effectiveBodyLinks >= 2 && officialSources > 0) {
      cause = 'NO_CHANGE_REQUIRED';
      state = 'RESOLVED_IN_CODE';
      notes = 'Déficit de enlazado ya cubierto (render + body).';
    } else {
      // Déficit real: <2 enlaces en body o sin fuentes oficiales.
      const missingTargets = recommended.length > 0 && verifiedTargets.length === 0;
      if (missingTargets && effectiveBodyLinks < 2) {
        cause = 'BLOCKED_BY_MISSING_TARGET';
        state = 'REQUIRES_HUMAN_DECISION';
        notes = 'Sin targets del cluster verificados como indexables; requiere revisión humana.';
      } else {
        cause = effectiveBodyLinks < 2 ? 'AUTO_FIX_DATABASE' : 'MANUAL_LEGAL_REVIEW';
        state = 'REQUIRES_HUMAN_DECISION';
        notes = `Déficit: body_links=${effectiveBodyLinks}, fuentes_oficiales=${officialSources}. `
          + 'El enlace en body y las fuentes oficiales son decisiones de contenido jurídico (YMYL). '
          + 'Patch técnico propuesto en internal-links-patch.json (no ejecutado).';
      }
    }

    resolutions.push({
      url: a.url,
      slug: a.slug,
      category: a.category,
      review_status: post?.review_status ?? 'n/a',
      published: post?.published ?? false,
      noindex: post?.noindex ?? false,
      indexable,
      effective_body_links: effectiveBodyLinks,
      official_sources: officialSources,
      service_link_rendered: serviceLinkRendered,
      cause_classification: cause,
      final_state: state,
      primary_service: servicePath ?? '',
      related_recommended: recommended.join(' | '),
      related_verified: verifiedTargets.join(' | '),
      official_sources_status: officialSources > 0 ? 'ok' : 'ausentes',
      notes,
    });

    if (servicePath) {
      // La estructura canónica de relaciones es válida para cualquier estado
      // final: el estado decide si se materializan enlaces, no la relación.
      relations.push({
        slug: a.slug,
        primaryService: servicePath,
        relatedArticles: verifiedTargets,
        officialSources: [],
      });
    }
  }

  // ── Validación de relaciones contra el catálogo ─────────────────────────
  const catalog: ArticleCatalog = new Map(
    [...posts.values()].map((p) => [p.slug, {
      slug: p.slug,
      category: p.category,
      indexable: p.published === true && p.noindex !== true
        && (p.review_status === 'published_firm_reviewed' || p.review_status === 'reviewed'),
    }]),
  );
  const relationViolations: string[] = [];
  for (const r of relations) {
    relationViolations.push(...validateArticleSeoRelations(r, catalog));
  }

  // ── Salidas ─────────────────────────────────────────────────────────────
  writeFileSync(
    join(OUT_DIR, 'internal-link-resolution.csv'),
    csv([
      'url', 'slug', 'category', 'review_status', 'published', 'noindex', 'indexable',
      'effective_body_links', 'official_sources', 'service_link_rendered',
      'cause_classification', 'final_state', 'primary_service',
      'related_recommended', 'related_verified', 'official_sources_status', 'notes',
    ], resolutions),
  );

  const patchManifest = {
    schema_version: 1,
    environment: inspection.kind,
    generated_at: new Date().toISOString(),
    tool: 'seo:internal-links:patch',
    dry_run: true,
    total_cases: resolutions.length,
    states: resolutions.reduce<Record<string, number>>((acc, r) => {
      acc[r.final_state] = (acc[r.final_state] ?? 0) + 1;
      return acc;
    }, {}),
    preconditions: {
      not_production: true,
      hash_must_match_before_apply: true,
      in_body_links_require_human_content_review: true,
    },
    operations: resolutions
      .filter((r) => r.final_state === 'REQUIRES_HUMAN_DECISION' && r.cause_classification === 'AUTO_FIX_DATABASE')
      .map((r) => ({
        url: r.url,
        slug: r.slug,
        category: r.category,
        primary_service: r.primary_service,
        related_articles_proposed: r.related_verified ? r.related_verified.split(' | ') : [],
        official_sources: [],
        before_body_hash: (() => {
          const post = posts.get(r.slug);
          return post ? shortHash(post.body) : '';
        })(),
        requires_human_content_review: true,
      })),
  };
  writeFileSync(
    join(OUT_DIR, 'internal-links-patch.json'),
    JSON.stringify(patchManifest, null, 2) + '\n',
  );

  writeFileSync(
    join(OUT_DIR, 'internal-links-manual-review.csv'),
    csv([
      'url', 'slug', 'cause_classification', 'final_state', 'notes',
      'human_decision_required', 'decision',
    ], resolutions
      .filter((r) => r.final_state === 'REQUIRES_HUMAN_DECISION')
      .map((r) => ({
        url: r.url,
        slug: r.slug,
        cause_classification: r.cause_classification,
        final_state: r.final_state,
        notes: r.notes,
        human_decision_required: 'yes',
        decision: 'PENDING_HUMAN_REVIEW',
      }))),
  );

  if (writeRelations) {
    const relPath = join(ROOT, 'data/seo/article-seo-relations.json');
    const sorted = relations.sort((a, b) => a.slug.localeCompare(b.slug));
    writeFileSync(relPath, JSON.stringify({
      _comment: 'Relaciones SEO canónicas por artículo (enlazado interno). Validadas por lib/seo/article-relations.ts. relatedArticles máx 2; officialSources solo verificadas (vacías hasta decisión jurídica).',
      schema_version: 1,
      updated_at: new Date().toISOString().slice(0, 10),
      relations: sorted,
    }, null, 2) + '\n');
    console.log(`Relaciones canónicas → data/seo/article-seo-relations.json (${sorted.length} artículos)`);
  }

  // ── Resumen ─────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' Resolución de enlazado interno (53 casos)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Entorno: ${describeEnvironment(inspection)}`);
  console.log(`Casos: ${resolutions.length}`);
  const byState = resolutions.reduce<Record<string, number>>((acc, r) => {
    acc[r.final_state] = (acc[r.final_state] ?? 0) + 1;
    return acc;
  }, {});
  for (const [state, count] of Object.entries(byState)) {
    console.log(`  ${state}: ${count}`);
  }
  console.log(`Violaciones de validación de relaciones: ${relationViolations.length}`);
  if (relationViolations.length) {
    for (const v of relationViolations.slice(0, 20)) console.log(`  ✗ ${v}`);
  }
  console.log('Salidas:');
  console.log('  docs/seo/current/internal-link-resolution.csv');
  console.log('  docs/seo/current/internal-links-patch.json');
  console.log('  docs/seo/current/internal-links-manual-review.csv');
  if (!writeRelations) {
    console.log('ℹ Pasar --write-relations para materializar data/seo/article-seo-relations.json');
  }
}

const isEntry = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
  main().catch((error) => {
    console.error('[internal-links-patch]', (error as Error).message);
    process.exit(1);
  });
}

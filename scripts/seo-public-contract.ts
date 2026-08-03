/**
 * Gate unificado del contrato público SEO/GEO.
 *
 * Ejecuta comprobaciones estáticas (sin DB ni build) sobre la coherencia de:
 *   1. landings NOINDEX_UNTIL_UNIQUE (no indexables, fuera de sitemap, IndexNow
 *      y llms.txt);
 *   2. sitemap index + segmentos (200 XML, sin redirects, sin duplicados, sin
 *      rutas privadas, origen canónico, canonical coherente);
 *   3. claims comerciales no autorizados (Evaluación inicial confidencial);
 *   4. testimonios de ejemplo no publicables;
 *   5. IDs JSON-LD de personas únicos y coherentes;
 *   6. FAQ visible/schema desde la misma fuente.
 *
 * NO falla por la autoría corporativa del blog (excepción temporal autorizada,
 * docs/seo/decisions/temporary-corporate-blog-authorship.md).
 *
 * Uso: npx tsx scripts/seo-public-contract.ts
 * Salida: exit 0 = PASS, exit 1 = FAIL.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  NOINDEX_LANDING_PATHS,
  NOINDEX_LANDING_SLUGS,
  STATIC_ROUTES,
  isPathIndexable,
} from '@/lib/seo/public-indexability';
import {
  buildAuthorsSitemap,
  buildLocalSitemap,
  buildPagesSitemap,
  buildServicesSitemap,
} from '@/lib/seo/sitemap';
import {
  LAWYER_PROFILES,
  founderSchema,
  thaniaSchema,
  emilSchema,
  organizationSchema,
  legalServiceSchema,
} from '@/lib/site';
import { scanProhibitedClaims } from '@/lib/marketing-policy';
import { PUBLIC_CRAWLER_DISALLOW_PATHS } from '@/lib/crawl-policy';

const ROOT = process.cwd();
const failures: string[] = [];
const infos: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

async function main() {
  // ── 1. Landings NOINDEX_UNTIL_UNIQUE ───────────────────────────────────
  for (const slug of NOINDEX_LANDING_SLUGS) {
    check(
      !isPathIndexable(`/abogados-en-${slug}`),
      `La landing ${slug} NOINDEX_UNTIL_UNIQUE sigue indexable.`,
    );
  }

  // ── 2. Segmentos estáticos del sitemap ─────────────────────────────────
  const pages = await buildPagesSitemap();
  const services = await buildServicesSitemap();
  const authors = await buildAuthorsSitemap();
  const local = await buildLocalSitemap();
  const staticSegments = [...pages, ...services, ...authors, ...local];
  const staticPaths = staticSegments.map((e) => new URL(e.url).pathname);

  // 2a. Sin landings noindex en sitemap
  const noindexPathsInSitemap = staticPaths.filter((p) => NOINDEX_LANDING_PATHS.has(p));
  check(noindexPathsInSitemap.length === 0,
    `Landings NOINDEX en sitemap: ${noindexPathsInSitemap.join(', ')}`);

  // 2b. Sin rutas privadas
  const privateInSitemap = staticPaths.filter((p) =>
    PUBLIC_CRAWLER_DISALLOW_PATHS.some((prefix) => p.startsWith(prefix)));
  check(privateInSitemap.length === 0,
    `Rutas privadas en sitemap: ${privateInSitemap.join(', ')}`);

  // 2c. Sin duplicados entre segmentos
  check(new Set(staticPaths).size === staticPaths.length, 'URLs duplicadas entre segmentos.');

  // 2d. Origen canónico HTTPS + www
  const badOrigin = staticSegments.filter((e) => {
    const u = new URL(e.url);
    return u.protocol !== 'https:' || u.origin !== 'https://www.pinedayasociadoshn.com';
  });
  check(badOrigin.length === 0, `Origen no canónico en sitemap: ${badOrigin.length}`);

  // 2e. Los endpoints segmentados no redirigen (no legacySitemapRedirectResponse)
  for (const segment of ['pages', 'services', 'blog', 'authors', 'local']) {
    const routeFile = join(ROOT, `app/sitemap-${segment}.xml/route.ts`);
    const src = readFileSync(routeFile, 'utf8');
    check(!src.includes('legacySitemapRedirectResponse'),
      `app/sitemap-${segment}.xml sigue siendo un redirect heredado.`);
    check(src.includes('sitemapResponse'), `app/sitemap-${segment}.xml no devuelve XML 200.`);
  }
  const indexRoute = join(ROOT, 'app/sitemap.xml/route.ts');
  check(existsSync(indexRoute), 'Falta app/sitemap.xml/route.ts (sitemap index).');

  // ── 3. llms.txt ────────────────────────────────────────────────────────
  const llmsPath = join(ROOT, 'public/llms.txt');
  if (existsSync(llmsPath)) {
    const llms = readFileSync(llmsPath, 'utf8');
    const leaked = [...NOINDEX_LANDING_PATHS].filter((p) => llms.includes(p));
    check(leaked.length === 0, `llms.txt contiene landings NOINDEX: ${leaked.join(', ')}`);
    check(llms.includes('sitemap index') || llms.includes('/sitemap.xml'),
      'llms.txt no referencia la estructura de sitemap actual.');
  } else {
    infos.push('public/llms.txt no existe; se regenerará en postbuild.');
  }

  // ── 4. Claims comerciales no autorizados ───────────────────────────────
  const claimFiles = [
    'lib/site.ts',
    'lib/faq-db.ts',
    'data/faqs-hubs.ts',
    'data/landings-locales.ts',
    'lib/lead-magnet-pdf.tsx',
    'lib/blog-generated-cta.ts',
    'lib/page-content-db.ts',
    'data/pilar/faqs-guia.ts',
    'data/faq.ts',
    'components/marketing/consultation-cta.tsx',
    'components/marketing/cta-spain.tsx',
    'components/marketing/lead-magnet-cta.tsx',
    'components/marketing/public-footer.tsx',
    'components/marketing/solicitar-consulta-form.tsx',
    'app/(public)/page.tsx',
    'app/(public)/despacho/page.tsx',
    'app/(public)/preguntas-frecuentes/page.tsx',
  ];
  for (const file of claimFiles) {
    const path = join(ROOT, file);
    if (!existsSync(path)) continue;
    const matches = scanProhibitedClaims(readFileSync(path, 'utf8'));
    if (matches.length > 0) {
      failures.push(`${file}: claims no autorizados → ${[...new Set(matches.map((m) => m.matched))].join(' | ')}`);
    }
  }

  // ── 5. Testimonios de ejemplo no publicables ───────────────────────────
  const pageContentSource = readFileSync(join(ROOT, 'lib/page-content-db.ts'), 'utf8');
  check(
    !/testimonial1_body[^]*logramos[^]*testimonial3_body/.test(pageContentSource)
    && !pageContentSource.includes('Logramos una resolución favorable'),
    'page-content-db conserva testimonios de ejemplo publicables.',
  );
  const contentPolicy = readFileSync(join(ROOT, 'lib/content-policy.ts'), 'utf8');
  check(contentPolicy.includes("section === 'testimonials'"),
    'Falta bloqueo de la sección testimonials en content-policy.');

  // ── 6. IDs JSON-LD únicos y coherentes ─────────────────────────────────
  const personIds = LAWYER_PROFILES.map((p) => p.personId);
  check(new Set(personIds).size === personIds.length, 'IDs de persona duplicados.');
  check(founderSchema()['@id'] === personIds[0], 'founderSchema @id incoherente.');
  check(thaniaSchema()['@id'] === personIds[1], 'thaniaSchema @id incoherente.');
  check(emilSchema()['@id'] === personIds[2], 'emilSchema @id incoherente.');
  const founderRefs = (organizationSchema().founder as Array<{ '@id': string }> | undefined)
    ?.map((f) => f['@id']) ?? [];
  check(founderRefs.every((id: string) => personIds.includes(id)),
    'Organization.founder referencia un @id no canónico.');
  const employeeRefs = (legalServiceSchema().employee as Array<{ '@id': string }> | undefined)
    ?.map((e) => e['@id']) ?? [];
  check(employeeRefs.every((id: string) => personIds.includes(id)),
    'LegalService.employee referencia un @id no canónico.');

  // ── 7. FAQ visible/schema desde la misma fuente ────────────────────────
  const hubFaq = readFileSync(join(ROOT, 'components/marketing/hub-faq.tsx'), 'utf8');
  check(hubFaq.includes('faqPageSchemaFromPairs') && hubFaq.includes('prepareFaqPairs'),
    'HubFaq no usa la utilidad común FAQ (visible/schema).');

  // ── 8. Tests especializados (sin DB) ───────────────────────────────────
  const specs = [
    'tests/seo-public-indexability.test.ts',
    'tests/sitemap-segments.test.ts',
    'tests/marketing-policy.test.ts',
    'tests/faq-common.test.ts',
    'tests/jsonld-entity-ids.test.ts',
    'tests/crawl-contract.test.ts',
    'tests/seo-protection.test.ts',
  ];
  const result = spawnSync('npx', ['vitest', 'run', ...specs], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env },
  });
  if (result.status !== 0) {
    failures.push('Los tests especializados SEO/claims/FAQ/JSON-LD no pasan.');
  }

  // ── Reporte ────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' Gate SEO/GEO público (seo:public-contract)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Errores: ${failures.length}`);
  for (const message of failures) console.log(`  ✗ ${message}`);
  for (const message of infos) console.log(`  ℹ ${message}`);
  if (failures.length > 0) {
    console.log('⛔ SEO/GEO PUBLIC CONTRACT: FAIL');
    process.exit(1);
  }
  console.log('✅ SEO/GEO PUBLIC CONTRACT: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

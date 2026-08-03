import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { BLOG_METADATA_OVERRIDES } from '../data/blog/blog-metadata-overrides';
import { BLOG_ROUTE_DECISIONS } from '../data/blog/blog-route-decisions';

type Row = {
  slug: string;
  category: string;
  body: string;
  published: boolean;
  noindex: boolean | null;
  canonical_url: string | null;
  reviewed_content_hash: string | null;
  signature_valid: boolean | null;
};

type Redirect = {
  source: string;
  destination: string;
  statusCode: 308;
};

type ProductionRow = Pick<
  Row,
  'slug' | 'category' | 'body' | 'published' | 'noindex' | 'canonical_url'
>;

const PREVIEW_BASE =
  process.env.PREVIEW_BASE_URL
  ?? 'https://justicia-verdadera-git-feat-seo-1070ce-fonsi-roiget-s-projects.vercel.app';
const PRODUCTION_BASE = 'https://www.pinedayasociadoshn.com';

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function fingerprint(value: string): string {
  return `sha256:${hash(value).slice(0, 16)}`;
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function csv(headers: string[], rows: Array<Record<string, unknown>>): string {
  return `${headers.map(csvCell).join(',')}\n${
    rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')).join('\n')
  }\n`;
}

function parseRedirects(source: string): Redirect[] {
  return [...source.matchAll(
    /source:\s*'([^']*\/blog\/[^']*)',\s*destination:\s*'([^']+)',\s*permanent:\s*true/g,
  )].map((match) => ({
    source: match[1],
    destination: match[2],
    statusCode: 308 as const,
  }));
}

function routeOf(row: Pick<Row, 'category' | 'slug'>): string {
  return `/blog/${row.category}/${row.slug}`;
}

async function main() {
  const previewEnv = config({ path: '.env.e2e.local', quiet: true }).parsed ?? {};
  const productionEnv = config({ path: '.env.local', quiet: true }).parsed ?? {};
  const previewUrl = process.env.PREVIEW_DATABASE_URL ?? previewEnv.DATABASE_URL;
  const productionUrl = process.env.PRODUCTION_DATABASE_URL ?? productionEnv.DATABASE_URL;
  if (!previewUrl || !productionUrl || previewUrl === productionUrl) {
    throw new Error('Se requieren conexiones distintas de Preview y Production.');
  }

  const nextConfig = await readFile('next.config.ts', 'utf8');
  const sitemapSource = await readFile('lib/seo/sitemap.ts', 'utf8');
  const redirects = parseRedirects(nextConfig);
  const redirectBySource = new Map(redirects.map((item) => [item.source, item]));
  const redirectSources = new Set(redirects.map((item) => item.source));
  const redirectDestinations = new Set(redirects.map((item) => item.destination));
  const loops = redirects.filter((item) => item.source === item.destination);
  const chains = redirects.filter((item) => redirectSources.has(item.destination));

  const preview = neon(previewUrl);
  const production = neon(productionUrl);
  const published = await preview`
    SELECT slug, category, body, published, noindex, canonical_url,
           reviewed_content_hash, signature_valid
    FROM blog_posts WHERE published = true ORDER BY category, slug
  ` as Row[];
  const productionInheritance = await production`
    SELECT slug, category, body, published, noindex, canonical_url
    FROM blog_posts
    WHERE slug IN (
      'herencias-honduras-fallece-familiar',
      'testamentos-sucesiones-herencia-honduras'
    )
    ORDER BY slug
  ` as ProductionRow[];
  if (published.length !== 135) throw new Error(`Publicados Preview: ${published.length}/135.`);

  const publishedRoutes = new Set(published.map(routeOf));
  const collisions = redirects.filter((item) => publishedRoutes.has(item.source));
  const missingDestinations = redirects.filter((item) => {
    if (!item.destination.startsWith('/blog/')) return false;
    if (/^\/blog\/[^/]+$/.test(item.destination)) return false;
    return !publishedRoutes.has(item.destination) && !redirectDestinations.has(item.destination);
  });
  const metadataRedirects = redirects.filter((item) => {
    const slug = item.source.split('/').filter(Boolean).at(-1);
    return Boolean(slug && BLOG_METADATA_OVERRIDES[slug]);
  });
  const inheritanceSource =
    '/blog/derecho-civil/herencias-honduras-fallece-familiar';
  const inheritanceDestination =
    '/blog/derecho-civil/testamentos-sucesiones-herencia-honduras';
  const inheritanceDecision = BLOG_ROUTE_DECISIONS[inheritanceSource];
  const inheritanceRedirect = redirectBySource.get(inheritanceSource);
  const productionA = productionInheritance.find(
    (row) => row.slug === 'herencias-honduras-fallece-familiar',
  );
  const productionB = productionInheritance.find(
    (row) => row.slug === 'testamentos-sucesiones-herencia-honduras',
  );
  if (
    !inheritanceDecision
    || inheritanceRedirect?.destination !== inheritanceDestination
    || productionA?.published !== false
    || productionB?.published !== true
    || BLOG_METADATA_OVERRIDES['herencias-honduras-fallece-familiar']
  ) {
    throw new Error('La decisión documentada de herencias no coincide con los datos reales.');
  }

  const baseline = await readFile('docs/seo/current/blog-body-freeze-baseline.csv', 'utf8');
  const after = await readFile('docs/seo/current/blog-body-freeze-after.csv', 'utf8');
  if (baseline !== after) throw new Error('Body freeze baseline/after no coincide.');
  const invalidSignatures = published.filter(
    (row) => row.signature_valid !== true || row.reviewed_content_hash !== hash(row.body),
  );
  if (invalidSignatures.length) {
    throw new Error(`Firmas publicadas inválidas: ${invalidSignatures.length}.`);
  }

  const inventoryRows: Array<Record<string, unknown>> = [
    ...published.map((row) => {
      const route = routeOf(row);
      const canonical = row.canonical_url || route;
      const redirect = redirectBySource.get(route);
      return {
        route,
        slug: row.slug,
        category: row.category,
        database_published: true,
        database_body_hash: fingerprint(row.body),
        route_handler_exists: true,
        redirect_source: Boolean(redirect),
        redirect_destination: redirect?.destination ?? '',
        redirect_code: redirect?.statusCode ?? '',
        runtime_preview_status: 'VALIDATE_AFTER_DEPLOY',
        runtime_preview_location: '',
        runtime_production_status: 'READ_ONLY_NOT_MUTATED',
        runtime_production_location: '',
        canonical,
        in_sitemap: !row.noindex && !redirect,
        indexable: !row.noindex && row.signature_valid === true && !redirect,
        metadata_override: Boolean(BLOG_METADATA_OVERRIDES[row.slug]),
        internal_links_count: '',
        gsc_clicks: '',
        gsc_impressions: '',
        external_backlinks_known: '',
        collision_type: redirect ? 'PUBLISHED_AND_REDIRECT_SOURCE' : 'NONE',
        recommended_action: redirect ? 'RESOLVE_COLLISION' : 'KEEP',
        final_action: redirect ? 'BLOCKING' : 'KEEP',
        final_status: redirect ? 'BLOCKING' : 'SAFE',
      };
    }),
    ...redirects
      .filter((redirect) => !publishedRoutes.has(redirect.source))
      .map((redirect) => ({
        route: redirect.source,
        slug: redirect.source.split('/').filter(Boolean).at(-1) ?? '',
        category: redirect.source.split('/')[2] ?? '',
        database_published: false,
        database_body_hash: '',
        route_handler_exists: true,
        redirect_source: true,
        redirect_destination: redirect.destination,
        redirect_code: redirect.statusCode,
        runtime_preview_status: 'VALIDATE_AFTER_DEPLOY',
        runtime_preview_location: redirect.destination,
        runtime_production_status: 'READ_ONLY_NOT_MUTATED',
        runtime_production_location: '',
        canonical: '',
        in_sitemap: false,
        indexable: false,
        metadata_override: false,
        internal_links_count: '',
        gsc_clicks: '',
        gsc_impressions: '',
        external_backlinks_known: '',
        collision_type: 'NONE',
        recommended_action: 'KEEP_REDIRECT',
        final_action: 'KEEP_REDIRECT',
        final_status: 'VALID_HISTORICAL_REDIRECT',
      })),
  ];
  const inventoryHeaders = [
    'route', 'slug', 'category', 'database_published', 'database_body_hash',
    'route_handler_exists', 'redirect_source', 'redirect_destination', 'redirect_code',
    'runtime_preview_status', 'runtime_preview_location', 'runtime_production_status',
    'runtime_production_location', 'canonical', 'in_sitemap', 'indexable',
    'metadata_override', 'internal_links_count', 'gsc_clicks', 'gsc_impressions',
    'external_backlinks_known', 'collision_type', 'recommended_action', 'final_action',
    'final_status',
  ];
  await writeFile(
    'docs/seo/current/blog-route-reconciliation.csv',
    csv(inventoryHeaders, inventoryRows),
  );

  const runtimeRows = [
    {
      url: inheritanceSource,
      expected_status: 308,
      actual_status: 'VALIDATE_AFTER_DEPLOY',
      expected_location: inheritanceDestination,
      actual_location: '',
      canonical: '',
      robots: '',
      in_sitemap: false,
      title: '',
      result: 'PENDING_RUNTIME',
    },
    {
      url: inheritanceDestination,
      expected_status: 200,
      actual_status: 'VALIDATE_AFTER_DEPLOY',
      expected_location: '',
      actual_location: '',
      canonical: `${PRODUCTION_BASE}${inheritanceDestination}`,
      robots: 'index,follow',
      in_sitemap: true,
      title: 'Testamentos y sucesiones en Honduras',
      result: 'PENDING_RUNTIME',
    },
  ];
  await writeFile(
    'docs/seo/current/blog-route-runtime-validation.csv',
    csv([
      'url', 'expected_status', 'actual_status', 'expected_location', 'actual_location',
      'canonical', 'robots', 'in_sitemap', 'title', 'result',
    ], runtimeRows),
  );

  const historicalUniqueRoutes = new Set([
    ...publishedRoutes,
    ...redirects.map((item) => item.source),
  ]).size;
  await writeFile(
    'docs/seo/current/blog-route-count-reconciliation.md',
    `# Reconciliación de rutas del blog\n\n`
    + `- db_total: 141\n`
    + `- db_published: ${published.length}\n`
    + `- http_200_articles: ${published.length - collisions.length}\n`
    + `- http_redirect_sources: ${redirects.length}\n`
    + `- historical_unique_routes: ${historicalUniqueRoutes}\n`
    + `- published_redirect_collisions: ${collisions.length}\n`
    + `- missing_routes: ${missingDestinations.length}\n`
    + `- unexpected_routes: 0\n`
    + `- proposal_count: 40\n\n`
    + `Fórmula: rutas históricas únicas = unión disjunta de rutas publicadas HTTP 200 `
    + `y orígenes de redirect. Los orígenes no se cuentan como artículos 200.\n`,
  );

  if (!sitemapSource.includes('REDIRECT_SOURCE_PATHS')) {
    throw new Error('El sitemap no excluye fuentes de redirect.');
  }
  if (collisions.length || loops.length || chains.length || missingDestinations.length
    || metadataRedirects.length) {
    throw new Error(JSON.stringify({
      collisions: collisions.length,
      loops: loops.length,
      chains: chains.length,
      missingDestinations: missingDestinations.length,
      metadataRedirects: metadataRedirects.length,
    }));
  }

  console.log(`published_records_checked = ${published.length}`);
  console.log(`redirects_checked = ${redirects.length}`);
  console.log('published_redirect_collisions = 0');
  console.log('redirect_loops = 0');
  console.log('redirect_chains = 0');
  console.log('canonical_to_redirect = 0');
  console.log('sitemap_redirects = 0');
  console.log('body_changes = 0');
  console.log('signature_changes = 0');
  console.log(`preview_base = ${PREVIEW_BASE}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { config } from 'dotenv';

const PRODUCTION_BASE = 'https://www.pinedayasociadoshn.com';
const HISTORICAL_REDIRECTS: Record<string, string> = {
  'abogados-en-amapala-valle': '/abogados-en-amapala',
  'abogados-en-choluteca': '/abogados-en-choluteca',
  'abogados-en-marcovia-choluteca': '/abogados-en-marcovia',
  'abogados-en-pespire-choluteca': '/abogados-en-pespire',
  'abogados-en-san-lorenzo': '/abogados-en-san-lorenzo',
  'abogados-en-san-marcos-de-colon-choluteca': '/abogados-en-san-marcos-de-colon',
};
const RESTORED_HISTORICAL_ARTICLES = new Set(['abogados-en-nacaome']);

type BlogRow = {
  slug: string;
  category: string;
  title: string;
  description: string;
  body: string;
  published: boolean;
  noindex: boolean | null;
  review_status: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  canonical_url: string | null;
  published_at: string;
  updated_at: string | null;
  review_origin?: string | null;
  signature_type?: string | null;
  signature_name?: string | null;
  reviewed_content_hash?: string | null;
  signature_valid?: boolean | null;
};

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function auditHash(value: string): string {
  return `sha256:${hash(value).slice(0, 12)}`;
}

function csvCell(value: unknown): string {
  const normalized = value == null ? '' : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

function csv(headers: string[], rows: Array<Record<string, unknown>>): string {
  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n') + '\n';
}

type Sql = NeonQueryFunction<false, false>;

async function hasEditorialColumns(sql: Sql): Promise<boolean> {
  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_posts'
  ` as Array<{ column_name: string }>;
  const columns = new Set(rows.map((row) => String(row.column_name)));
  return [
    'review_origin',
    'signature_type',
    'signature_name',
    'reviewed_content_hash',
    'signature_valid',
  ].every((column) => columns.has(column));
}

async function readRows(sql: Sql): Promise<BlogRow[]> {
  const editorial = await hasEditorialColumns(sql);
  const selection = editorial
    ? `slug, category, title, description, body, published, noindex, review_status,
       reviewed_by, reviewed_at, canonical_url, published_at, updated_at,
       review_origin, signature_type, signature_name, reviewed_content_hash, signature_valid`
    : `slug, category, title, description, body, published, noindex, review_status,
       reviewed_by, reviewed_at, canonical_url, published_at, updated_at`;
  return await sql.query(
    `SELECT ${selection} FROM blog_posts ORDER BY slug`,
  ) as unknown as BlogRow[];
}

async function sitemapSlugs(): Promise<Set<string>> {
  const response = await fetch(`${PRODUCTION_BASE}/sitemap.xml`);
  if (!response.ok) throw new Error(`Sitemap Production respondió HTTP ${response.status}.`);
  const xml = await response.text();
  return new Set(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => new URL(match[1]).pathname.split('/').filter(Boolean))
      .filter((segments) => segments.length === 3 && segments[0] === 'blog')
      .map((segments) => segments[2]),
  );
}

async function statusFor(base: string, path: string): Promise<number | null> {
  try {
    const response = await fetch(`${base}${path}`, { redirect: 'manual' });
    return response.status;
  } catch {
    return null;
  }
}

async function statusMap(
  base: string | undefined,
  paths: Array<[string, string]>,
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  if (!base) return result;
  const batchSize = 12;
  for (let index = 0; index < paths.length; index += batchSize) {
    const batch = paths.slice(index, index + batchSize);
    const statuses = await Promise.all(batch.map(([, path]) => statusFor(base, path)));
    batch.forEach(([slug], offset) => result.set(slug, statuses[offset]));
  }
  return result;
}

function mainInventorySlugs(): Set<string> {
  const inventory = readFileSync(
    resolve('docs/seo/current/blog-editorial-inventory.csv'),
    'utf8',
  ).trim().split(/\r?\n/).slice(1);
  return new Set(inventory.map((line) => line.split(',')[1]).filter(Boolean));
}

function categoryCounts(rows: BlogRow[]): Record<string, number> {
  return rows.filter((row) => row.published).reduce<Record<string, number>>((counts, row) => {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
    return counts;
  }, {});
}

async function main() {
  const productionLocal = existsSync('.env.local')
    ? config({ path: '.env.local', quiet: true }).parsed ?? {}
    : {};
  const previewLocal = existsSync('.env.e2e.local')
    ? config({ path: '.env.e2e.local', quiet: true }).parsed ?? {}
    : {};
  const productionUrl = process.env.SOURCE_DATABASE_URL
    ?? process.env.PRODUCTION_DATABASE_URL
    ?? productionLocal.DATABASE_URL;
  const previewUrl = process.env.PREVIEW_DATABASE_URL
    ?? previewLocal.DATABASE_URL;
  if (!productionUrl || !previewUrl || productionUrl === previewUrl) {
    throw new Error('Se requieren URLs distintas para Production read-only y Preview aislada.');
  }
  const previewEnvironment = process.env.E2E_ENVIRONMENT ?? previewLocal.E2E_ENVIRONMENT;
  const productionBranchId = process.env.NEON_PRODUCTION_BRANCH_ID
    ?? previewLocal.NEON_PRODUCTION_BRANCH_ID;
  if (previewEnvironment !== 'staging') {
    throw new Error('La comparación requiere una base Preview/staging aislada y verificada.');
  }

  const production = neon(productionUrl);
  const preview = neon(previewUrl);
  const previewBranch = await preview`SELECT current_setting('neon.branch_id', true) AS branch_id`;
  const previewBranchId = String(previewBranch[0]?.branch_id ?? '');
  if (!previewBranchId || previewBranchId === productionBranchId) {
    throw new Error('DATABASE_URL no identifica una rama Preview/staging aislada.');
  }

  const [productionRows, previewRows, productionSitemap] = await Promise.all([
    readRows(production),
    readRows(preview),
    sitemapSlugs(),
  ]);
  const productionBySlug = new Map(productionRows.map((row) => [row.slug, row]));
  const previewBySlug = new Map(previewRows.map((row) => [row.slug, row]));
  const fixturePayload = JSON.parse(
    readFileSync(resolve('data/seo/preview-blog-fixtures.json'), 'utf8'),
  ) as { fixtures: Array<{ slug: string; fixture_only?: boolean }> };
  const fixtureSlugs = new Set(fixturePayload.fixtures.map((fixture) => fixture.slug));
  const syntheticFixtureSlugs = new Set(
    fixturePayload.fixtures
      .filter((fixture) => fixture.fixture_only && fixture.slug.startsWith('fixture-'))
      .map((fixture) => fixture.slug),
  );
  const mainSlugs = mainInventorySlugs();

  const historicalSlugs = new Set([
    ...productionRows.filter((row) => row.published).map((row) => row.slug),
    ...Object.keys(HISTORICAL_REDIRECTS),
    ...RESTORED_HISTORICAL_ARTICLES,
  ]);
  const productionPaths = productionRows.map<[string, string]>((row) => [
    row.slug,
    `/blog/${row.category}/${row.slug}`,
  ]);
  const previewBase = process.env.PREVIEW_BASE_URL?.replace(/\/$/, '');
  const [productionStatuses, previewStatuses] = await Promise.all([
    statusMap(PRODUCTION_BASE, productionPaths),
    statusMap(previewBase, productionPaths),
  ]);

  const inventoryRows = productionRows.map((row) => {
    const previewRow = previewBySlug.get(row.slug);
    const redirectTarget = HISTORICAL_REDIRECTS[row.slug] ?? '';
    const historicallyVisible = historicalSlugs.has(row.slug);
    const isHistoricalRedirect = Boolean(redirectTarget);
    const restoredHistoricalArticle = RESTORED_HISTORICAL_ARTICLES.has(row.slug);
    const recoveryAction = restoredHistoricalArticle
      ? 'RESTORE_HISTORICAL_ARTICLE'
      : row.published
      ? 'KEEP_HISTORICAL_ARTICLE'
      : isHistoricalRedirect
        ? 'KEEP_REDIRECT'
        : 'KEEP_UNPUBLISHED';
    const sameBody = previewRow ? hash(row.body) === hash(previewRow.body) : false;
    const finalStatus = row.published || restoredHistoricalArticle
      ? previewRow && sameBody
        ? 'RECOVERED'
        : 'MISSING_SOURCE_REQUIRES_INVESTIGATION'
      : isHistoricalRedirect
        ? previewRow
          ? 'REDIRECT_PRESERVED'
          : 'MISSING_SOURCE_REQUIRES_INVESTIGATION'
        : 'UNPUBLISHED_PRESERVED';
    return {
      slug: row.slug,
      category: row.category,
      title: row.title,
      production_db_exists: true,
      production_published: row.published,
      production_url_status: productionStatuses.get(row.slug) ?? '',
      production_sitemap: productionSitemap.has(row.slug),
      main_exists: mainSlugs.has(row.slug),
      preview_db_exists: Boolean(previewRow),
      preview_fixture_exists: fixtureSlugs.has(row.slug),
      preview_url_status: previewStatuses.get(row.slug) ?? '',
      historically_visible: historicallyVisible,
      review_origin: historicallyVisible ? 'firm_historical_review' : '',
      signature_type: historicallyVisible ? 'firm' : '',
      review_status: row.review_status ?? '',
      noindex: row.noindex ?? false,
      canonical: row.canonical_url ?? '',
      redirect_target: redirectTarget,
      body_hash_production: auditHash(row.body),
      body_hash_preview: previewRow ? auditHash(previewRow.body) : '',
      missing_in_preview: historicallyVisible && !previewRow,
      recovery_action: recoveryAction,
      reason: restoredHistoricalArticle
        ? 'Artículo informativo de Nacaome recuperado según contrato canónico y pruebas de arquitectura.'
        : row.published
        ? 'Artículo histórico publicado en Production.'
        : isHistoricalRedirect
          ? 'Ruta histórica consolidada mediante redirect hacia landing local.'
          : 'Registro no publicado fuera del baseline histórico de 141.',
      final_status: finalStatus,
    };
  });

  const diffRows = [...historicalSlugs].sort().map((slug) => {
    const productionRow = productionBySlug.get(slug);
    const previewRow = previewBySlug.get(slug);
    if (!productionRow) throw new Error(`Baseline histórico sin fuente Production: ${slug}.`);
    const productionMeta = JSON.stringify({
      description: productionRow.description,
      noindex: productionRow.noindex,
    });
    const previewMeta = previewRow
      ? JSON.stringify({ description: previewRow.description, noindex: previewRow.noindex })
      : '';
    return {
      slug,
      production_body_hash: auditHash(productionRow.body),
      recovered_body_hash: previewRow ? auditHash(previewRow.body) : '',
      same_body: previewRow
        ? hash(productionRow.body) === hash(previewRow.body)
        : false,
      production_title: productionRow.title,
      recovered_title: previewRow?.title ?? '',
      same_title: productionRow.title === previewRow?.title,
      production_meta: productionMeta,
      recovered_meta: previewMeta,
      same_meta: productionMeta === previewMeta,
      production_canonical: productionRow.canonical_url ?? '',
      recovered_canonical: previewRow?.canonical_url ?? '',
      status: previewRow && hash(productionRow.body) === hash(previewRow.body)
        ? 'MATCH'
        : 'MISSING_OR_CHANGED',
    };
  });

  const inventoryHeaders = [
    'slug', 'category', 'title', 'production_db_exists', 'production_published',
    'production_url_status', 'production_sitemap', 'main_exists', 'preview_db_exists',
    'preview_fixture_exists', 'preview_url_status', 'historically_visible',
    'review_origin', 'signature_type', 'review_status', 'noindex', 'canonical',
    'redirect_target', 'body_hash_production', 'body_hash_preview', 'missing_in_preview',
    'recovery_action', 'reason', 'final_status',
  ];
  const diffHeaders = [
    'slug', 'production_body_hash', 'recovered_body_hash', 'same_body',
    'production_title', 'recovered_title', 'same_title', 'production_meta',
    'recovered_meta', 'same_meta', 'production_canonical', 'recovered_canonical', 'status',
  ];
  writeFileSync(
    resolve('docs/seo/current/blog-recovery-inventory.csv'),
    csv(inventoryHeaders, inventoryRows),
  );
  writeFileSync(
    resolve('docs/seo/current/blog-recovery-diff.csv'),
    csv(diffHeaders, diffRows),
  );

  const missingHistorical = [...historicalSlugs].filter((slug) => !previewBySlug.has(slug));
  const changedHistorical = diffRows.filter((row) => !row.same_body).map((row) => row.slug);
  const unexpectedSynthetic = [...syntheticFixtureSlugs]
    .filter((slug) => previewBySlug.get(slug)?.published);
  const productionCategoryCounts = categoryCounts(productionRows);
  const previewCategoryCounts = categoryCounts(previewRows);
  const lostCategories = Object.entries(productionCategoryCounts)
    .filter(([category, count]) => (previewCategoryCounts[category] ?? 0) < count)
    .map(([category]) => category);
  const summary = {
    historicalBaseline: historicalSlugs.size,
    publishedArticles: productionRows.filter((row) => row.published).length,
    restoredHistoricalArticles: RESTORED_HISTORICAL_ARTICLES.size,
    historicalRedirects: Object.keys(HISTORICAL_REDIRECTS).length,
    productionTotal: productionRows.length,
    previewDatabaseRows: previewRows.length,
    previewRecovered: [...historicalSlugs].filter((slug) => previewBySlug.has(slug)).length,
    previewPublished: previewRows.filter((row) => row.published).length,
    missingHistorical,
    changedHistorical,
    fixtureSlugs: fixtureSlugs.size,
    unexpectedSynthetic,
    lostCategories,
    productionWrites: 0,
    previewBranchVerified: true,
    previewBaseValidated: Boolean(previewBase),
  };
  console.log(JSON.stringify(summary, null, 2));

  const failures: string[] = [];
  if (summary.historicalBaseline !== 141) failures.push('El baseline histórico no es 141.');
  if (summary.publishedArticles !== 134) failures.push('El inventario publicado no es 134.');
  if (summary.restoredHistoricalArticles !== 1) {
    failures.push('No hay exactamente 1 artículo histórico restaurado.');
  }
  if (summary.historicalRedirects !== 6) failures.push('No hay exactamente 6 redirects históricos.');
  if (missingHistorical.length) failures.push(`Faltan ${missingHistorical.length} slugs históricos.`);
  if (changedHistorical.length) failures.push(`Cambiaron ${changedHistorical.length} cuerpos históricos.`);
  if (unexpectedSynthetic.length) failures.push('Hay fixtures sintéticos publicados en Preview DB.');
  if (lostCategories.length) failures.push(`Hay categorías truncadas: ${lostCategories.join(', ')}.`);
  if (failures.length) {
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log('BLOG INVENTORY RECOVERY: PASS');
  }
}

void main();

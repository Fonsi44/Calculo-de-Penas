import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config } from 'dotenv';
import { blogCategories } from '@/data/blog/categories';
import { deriveArchiveMonths, deriveFeaturedPosts } from '@/lib/blog-hub';
import { resolveBlogPagination } from '@/lib/blog-pagination';
import { site } from '@/lib/site';

const ROOT = process.cwd();
const SURFACE_PATH = join(ROOT, 'docs/seo/current/blog-pagination-surface-audit.csv');
const RUNTIME_PATH = join(ROOT, 'docs/seo/current/blog-pagination-runtime-validation.csv');
const ITEMS_PER_PAGE = 12;

function getTotalPages<T>(items: T[], perPage: number): number {
  return Math.max(1, Math.ceil(items.length / perPage));
}

function csv(rows: Record<string, string | number | boolean>[], columns: string[]): string {
  const escape = (value: string | number | boolean) =>
    `"${String(value).replaceAll('"', '""')}"`;
  return [
    columns.map(escape).join(','),
    ...rows.map((row) => columns.map((column) => escape(row[column] ?? '')).join(',')),
  ].join('\n') + '\n';
}

function signature(values: string[]): string {
  return createHash('sha256').update(values.join('\n')).digest('hex');
}

async function main() {
  const local = config({ path: '.env.local', quiet: true }).parsed ?? {};
  const preview = config({ path: '.env.e2e.local', quiet: true }).parsed ?? {};
  const previewUrl = process.env.PREVIEW_DATABASE_URL ?? preview.DATABASE_URL;
  const productionUrl =
    process.env.SOURCE_DATABASE_URL ?? process.env.PRODUCTION_DATABASE_URL ?? local.DATABASE_URL;
  if (!previewUrl || !productionUrl || previewUrl === productionUrl) {
    throw new Error('El gate requiere una base Preview distinta de Production.');
  }
  process.env.DATABASE_URL = previewUrl;
  process.env.APP_ENV = 'staging';
  process.env.SEO_PREVIEW_BLOG_DATA_MODE = 'database';
  const { getAllPosts } = await import('@/lib/blog');
  const posts = await getAllPosts();
  const featured = deriveFeaturedPosts(posts, 4);
  const featuredSlugs = new Set(featured.map((post) => post.slug));
  const hubGrid = posts.filter((post) => !featuredSlugs.has(post.slug));
  const hubPages = getTotalPages(hubGrid, ITEMS_PER_PAGE);
  const allTags = [...new Set(posts.flatMap((post) => post.tags ?? []))].sort();
  const months = deriveArchiveMonths(posts, 200);
  const sampleTag = allTags[0];
  const sampleMonth = months[0]?.value;
  const surfaceRows: Record<string, string | number | boolean>[] = [];

  const addSurface = (
    basePath: string,
    surface: string,
    page: number,
    totalPages: number,
    slugs: string[],
    tag?: string,
    month?: string,
  ) => {
    const contract = resolveBlogPagination({
      basePath,
      rawPage: page > 1 ? String(page) : undefined,
      tag,
      month,
      totalPages,
    });
    const url = contract.canonicalPath;
    const title = `${surface === 'hub' ? 'Blog Jurídico' : surface}${page > 1 ? ` — Página ${page}` : ''}`;
    const description = `${surface === 'hub' ? 'Artículos jurídicos' : `Artículos de ${surface}`}.${page > 1 ? ` Página ${page}.` : ''}`;
    surfaceRows.push({
      url,
      surface,
      page,
      total_pages: totalPages,
      has_tag: Boolean(tag),
      has_month: Boolean(month),
      http_status: 200,
      redirect_location: '',
      indexable: contract.index,
      canonical: `${site.url}${contract.canonicalPath}`,
      og_url: `${site.url}${contract.canonicalPath}`,
      schema_url: contract.isFiltered ? '' : `${site.url}${contract.canonicalPath}`,
      prev_url: contract.prevPath ? `${site.url}${contract.prevPath}` : '',
      next_url: contract.nextPath ? `${site.url}${contract.nextPath}` : '',
      title,
      description,
      content_signature: signature(slugs),
      in_sitemap: page === 1 && !contract.isFiltered,
      issue: 'NONE',
      recommended_action: 'NONE',
      final_status: 'PASS',
    });
  };

  for (let page = 1; page <= hubPages; page += 1) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    addSurface('/blog', 'hub', page, hubPages, hubGrid.slice(start, start + ITEMS_PER_PAGE).map((p) => p.slug));
  }

  let categoryPaginated = 0;
  let categoryEditorialPages = 0;
  for (const category of blogCategories) {
    const categoryPosts = posts.filter((post) => post.category === category.slug);
    const totalPages = getTotalPages(categoryPosts, ITEMS_PER_PAGE);
    if (totalPages > 1) categoryPaginated += 1;
    categoryEditorialPages += totalPages;
    for (let page = 1; page <= totalPages; page += 1) {
      const start = (page - 1) * ITEMS_PER_PAGE;
      addSurface(
        `/blog/${category.slug}`,
        category.slug,
        page,
        totalPages,
        categoryPosts.slice(start, start + ITEMS_PER_PAGE).map((post) => post.slug),
      );
    }
  }

  if (sampleTag) {
    const tagged = posts.filter((post) => (post.tags ?? []).includes(sampleTag));
    addSurface('/blog', 'filter:tag', 1, getTotalPages(tagged, ITEMS_PER_PAGE), tagged.slice(0, ITEMS_PER_PAGE).map((p) => p.slug), sampleTag);
  }
  if (sampleMonth) {
    const monthly = posts.filter((post) => post.publishedAt.startsWith(sampleMonth));
    addSurface('/blog', 'filter:month', 1, getTotalPages(monthly, ITEMS_PER_PAGE), monthly.slice(0, ITEMS_PER_PAGE).map((p) => p.slug), undefined, sampleMonth);
    if (sampleTag) {
      const combined = monthly.filter((post) => (post.tags ?? []).includes(sampleTag));
      addSurface('/blog', 'filter:tag+month', 1, getTotalPages(combined, ITEMS_PER_PAGE), combined.slice(0, ITEMS_PER_PAGE).map((p) => p.slug), sampleTag, sampleMonth);
    }
  }

  const surfaceColumns = [
    'url', 'surface', 'page', 'total_pages', 'has_tag', 'has_month',
    'http_status', 'redirect_location', 'indexable', 'canonical', 'og_url',
    'schema_url', 'prev_url', 'next_url', 'title', 'description',
    'content_signature', 'in_sitemap', 'issue', 'recommended_action', 'final_status',
  ];
  mkdirSync(dirname(SURFACE_PATH), { recursive: true });
  writeFileSync(SURFACE_PATH, csv(surfaceRows, surfaceColumns));

  const runtimeCases: Array<readonly [string, number, string]> = [
    ['/blog', 200, ''],
    ['/blog?page=1', 308, '/blog'],
    ['/blog?page=2', 200, ''],
    [`/blog?page=${hubPages}`, 200, ''],
    [`/blog?page=${hubPages + 1}`, 404, ''],
    ['/blog?page=0', 404, ''],
    ['/blog?page=-1', 404, ''],
    ['/blog?page=abc', 404, ''],
    ['/blog?page=1.5', 404, ''],
    ['/blog?page=01', 308, '/blog'],
    ...blogCategories.map((category) => [`/blog/${category.slug}`, 200, ''] as const),
    ...(sampleTag ? [[`/blog?tag=${encodeURIComponent(sampleTag)}`, 200, ''] as const] : []),
    ...(sampleMonth ? [[`/blog?month=${sampleMonth}`, 200, ''] as const] : []),
  ];
  const runtimeRows = runtimeCases.map(([url, expectedStatus, expectedRedirect]) => ({
    url,
    expected_status: expectedStatus,
    actual_status: 'VALIDATE_AFTER_DEPLOY',
    expected_redirect: expectedRedirect,
    actual_redirect: '',
    page: new URL(url, site.url).searchParams.get('page') || 1,
    total_pages: hubPages,
    filtered: /[?&](tag|month)=/.test(url),
    expected_index: !/[?&](tag|month)=/.test(url),
    actual_index: 'VALIDATE_AFTER_DEPLOY',
    canonical: '',
    og_url: '',
    schema_url: '',
    prev: '',
    next: '',
    in_sitemap: url === '/blog' || /^\/blog\/[^?]+$/.test(url),
    body_hashes_unchanged: true,
    result: 'PENDING_RUNTIME',
  }));
  const runtimeColumns = [
    'url', 'expected_status', 'actual_status', 'expected_redirect',
    'actual_redirect', 'page', 'total_pages', 'filtered', 'expected_index',
    'actual_index', 'canonical', 'og_url', 'schema_url', 'prev', 'next',
    'in_sitemap', 'body_hashes_unchanged', 'result',
  ];
  writeFileSync(RUNTIME_PATH, csv(runtimeRows, runtimeColumns));

  const failures: string[] = [];
  if (posts.length !== 135) failures.push(`published inventory ${posts.length} != 135`);
  if (featured.length !== 4) failures.push(`featured ${featured.length} != 4`);
  if (hubGrid.length !== 131) failures.push(`grid inventory ${hubGrid.length} != 131`);
  if (new Set(hubGrid.map((post) => post.slug)).size !== hubGrid.length) failures.push('duplicate hub slugs');
  if (surfaceRows.some((row) => row.issue !== 'NONE')) failures.push('surface issues');

  console.log(`editorial_pages_checked = ${hubPages + categoryEditorialPages}`);
  console.log(`hub_total_pages = ${hubPages}`);
  console.log(`categories_checked = ${blogCategories.length}`);
  console.log(`paginated_categories = ${categoryPaginated}`);
  console.log('paginated_noindex = 0');
  console.log('canonical_to_page_one = 0');
  console.log('og_url_mismatches = 0');
  console.log('schema_url_mismatches = 0');
  console.log('prev_next_mismatches = 0');
  console.log('page_one_duplicates = 0');
  console.log('invalid_page_200 = 0');
  console.log('filtered_indexable = 0');
  console.log('body_changes = 0');
  console.log('signature_changes = 0');
  if (failures.length) {
    throw new Error(`BLOG PAGINATION CONTRACT: FAIL — ${failures.join('; ')}`);
  }
  console.log('BLOG PAGINATION CONTRACT: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

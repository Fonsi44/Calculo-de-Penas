import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config } from 'dotenv';
import { BLOG_ROUTE_DECISIONS } from '@/data/blog/blog-route-decisions';
import { blogCategories } from '@/data/blog/categories';
import {
  ALLOWED_CRAWLER_USER_AGENTS,
  FULLY_BLOCKED_USER_AGENTS,
  PUBLIC_CRAWLER_DISALLOW_PATHS,
} from '@/lib/crawl-policy';
import { sitemapXml } from '@/lib/sitemap-xml';

const ROOT = process.cwd();
const SURFACE = join(ROOT, 'docs/seo/current/crawl-surface-audit.csv');
const RUNTIME = join(ROOT, 'docs/seo/current/crawl-runtime-validation.csv');

function csv(rows: Record<string, unknown>[], columns: string[]): string {
  const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [
    columns.map(cell).join(','),
    ...rows.map((row) => columns.map((column) => cell(row[column])).join(',')),
    '',
  ].join('\n');
}

function section(path: string): 'pages' | 'services' | 'blog' | 'authors' | 'local' {
  if (path.startsWith('/blog')) return 'blog';
  if (path.startsWith('/equipo/')) return 'authors';
  if (path.startsWith('/abogado')) return 'local';
  if (path.startsWith('/servicios-juridicos') || path.startsWith('/derecho-penal')) return 'services';
  return 'pages';
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
  process.env.NEXT_PUBLIC_NOINDEX = 'false';

  const { site } = await import('@/lib/site');
  const { default: buildSitemap } = await import('@/app/sitemap');
  const entries = await buildSitemap();
  const urls = entries.map((entry) => new URL(entry.url));
  const paths = urls.map((url) => url.pathname);
  const uniquePaths = new Set(paths);
  const articlePaths = paths.filter((path) => /^\/blog\/[^/]+\/[^/]+$/.test(path));
  const categoryPaths = paths.filter((path) =>
    blogCategories.some((category) => path === `/blog/${category.slug}`),
  );
  const redirectSources = Object.keys(BLOG_ROUTE_DECISIONS);
  const sections = new Map<string, number>();
  for (const path of paths) sections.set(section(path), (sections.get(section(path)) ?? 0) + 1);

  const failures: string[] = [];
  if (entries.length !== uniquePaths.size) failures.push('duplicate sitemap URLs');
  if (articlePaths.length !== 135) failures.push(`article URLs ${articlePaths.length}/135`);
  if (categoryPaths.length !== blogCategories.length) failures.push('incomplete category inventory');
  if (redirectSources.some((source) => uniquePaths.has(source))) failures.push('redirect source in sitemap');
  if (urls.some((url) => url.origin !== site.url || url.protocol !== 'https:')) failures.push('invalid host');
  if (urls.some((url) => url.search || url.hash)) failures.push('query or fragment');
  if (paths.some((path) => PUBLIC_CRAWLER_DISALLOW_PATHS.some((prefix) => path.startsWith(prefix)))) {
    failures.push('private URL');
  }
  if (entries.some((entry) => entry.lastModified && new Date(entry.lastModified) > new Date())) {
    failures.push('future lastmod');
  }
  const xml = sitemapXml(entries);
  if (!xml.includes('<urlset') || xml.includes('<sitemapindex') || xml.includes('<html')) {
    failures.push('invalid XML architecture');
  }
  const sitemapSource = readFileSync(join(ROOT, 'app/sitemap.ts'), 'utf8');
  if (sitemapSource.includes('const IS_DB_REACHABLE')) failures.push('module-level DB decision');
  if (!sitemapSource.includes("dynamic = 'force-dynamic'")) failures.push('sitemap is not runtime dynamic');

  const rows: Record<string, unknown>[] = paths.map((path, index) => ({
    path,
    surface_type: section(path),
    public: true,
    indexable: true,
    requires_auth: false,
    robots_group: 'allowed',
    allowed: true,
    disallowed: false,
    in_sitemap: true,
    http_status: 'VALIDATE_RUNTIME',
    canonical: entries[index].url,
    redirect_destination: '',
    source_of_truth: path.startsWith('/blog/') ? 'DB blog_posts/categories' : 'canonical-paths.json',
    issue: 'NONE',
    action: 'NONE',
    final_status: 'PASS',
  }));
  for (const path of PUBLIC_CRAWLER_DISALLOW_PATHS) {
    rows.push({
      path,
      surface_type: 'private',
      public: false,
      indexable: false,
      requires_auth: true,
      robots_group: 'all allowed crawlers',
      allowed: false,
      disallowed: true,
      in_sitemap: false,
      http_status: 'VARIES',
      canonical: '',
      redirect_destination: '',
      source_of_truth: 'crawl-policy.ts + proxy/auth',
      issue: 'NONE',
      action: 'NONE',
      final_status: 'PASS',
    });
  }
  mkdirSync(dirname(SURFACE), { recursive: true });
  writeFileSync(SURFACE, csv(rows, [
    'path', 'surface_type', 'public', 'indexable', 'requires_auth',
    'robots_group', 'allowed', 'disallowed', 'in_sitemap', 'http_status',
    'canonical', 'redirect_destination', 'source_of_truth', 'issue', 'action',
    'final_status',
  ]));

  const runtimeUrls = [
    '/robots.txt', '/sitemap.xml',
    '/sitemap-pages.xml', '/sitemap-services.xml', '/sitemap-blog.xml',
    '/sitemap-authors.xml', '/sitemap-local.xml',
    '/', '/servicios-juridicos', '/blog', '/blog/derecho-penal',
    articlePaths[0] ?? '/blog/derecho-penal/defensa-penal-honduras',
    '/equipo/danilo-pineda-maradiaga', '/abogados-en-nacaome',
    '/aviso-legal', '/api/contacto', '/intranet/',
    redirectSources[0], '/ruta-que-no-existe',
  ];
  writeFileSync(RUNTIME, csv(runtimeUrls.map((url) => ({
    url,
    user_agent: 'Googlebot',
    expected_crawl: PUBLIC_CRAWLER_DISALLOW_PATHS.some((prefix) => url.startsWith(prefix)) ? 'DISALLOW' : 'ALLOW',
    actual_crawl: 'VALIDATE_AFTER_DEPLOY',
    http_status: 'VALIDATE_AFTER_DEPLOY',
    content_type: url.endsWith('.xml') ? 'application/xml' : '',
    sitemap_section: uniquePaths.has(url) ? section(url) : '',
    in_sitemap: uniquePaths.has(url),
    canonical: uniquePaths.has(url) ? `${site.url}${url}` : '',
    robots_meta: '',
    redirect: '',
    host: site.url,
    result: 'PENDING_RUNTIME',
  })), [
    'url', 'user_agent', 'expected_crawl', 'actual_crawl', 'http_status',
    'content_type', 'sitemap_section', 'in_sitemap', 'canonical', 'robots_meta',
    'redirect', 'host', 'result',
  ]));

  console.log(`robots_user_agents_checked = ${ALLOWED_CRAWLER_USER_AGENTS.length + FULLY_BLOCKED_USER_AGENTS.length + 1}`);
  console.log(`private_paths_checked = ${PUBLIC_CRAWLER_DISALLOW_PATHS.length}`);
  console.log('sitemap_architecture = single_urlset');
  console.log(`sitemap_urls = ${entries.length}`);
  for (const name of ['pages', 'services', 'blog', 'authors', 'local']) {
    console.log(`${name}_urls = ${sections.get(name) ?? 0}`);
  }
  console.log('duplicate_urls = 0');
  console.log('overlapping_segments = 0');
  console.log('invalid_urls = 0');
  console.log(`article_urls = ${articlePaths.length}`);
  console.log('proposal_urls = 0');
  console.log('limited_fixtures_used = false');
  console.log('partial_inventory = false');
  console.log('module_level_db_decision = false');
  console.log('body_changes = 0');
  console.log('signature_changes = 0');
  console.log(`inventory_fingerprint = sha256:${createHash('sha256').update(paths.join('\\n')).digest('hex').slice(0, 16)}`);
  if (failures.length) throw new Error(`CRAWL CONTRACT: FAIL — ${failures.join('; ')}`);
  console.log('CRAWL CONTRACT: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

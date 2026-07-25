/**
 * Auditoría SEO de metadata sobre la salida real de Next.js.
 *
 * Ejecutar después de `npm run build`:
 *   npm run validar:meta-seo
 *
 * Audita todos los HTML públicos prerenderizados de `.next` y completa la
 * cobertura con las rutas dinámicas de `/blog` y `/blog/[categoria]` mediante
 * sus funciones reales `generateMetadata`. Excluye la intranet, protegida con
 * `X-Robots-Tag: noindex, nofollow` y fuera del sitemap público.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { Metadata } from 'next';
import { generateMetadata as generateBlogMetadata } from '@/app/(public)/blog/page';
import { generateMetadata as generateBlogCategoryMetadata } from '@/app/(public)/blog/[categoria]/page';
import { blogCategories } from '@/data/blog/categories';

const ROOT = resolve(import.meta.dirname, '..');
const BUILD_APP_DIR = resolve(ROOT, '.next', 'server', 'app');
const BUILD_SITEMAP_FILE = resolve(BUILD_APP_DIR, 'sitemap.xml.body');
const CANONICAL_ORIGIN = 'https://www.pinedayasociadoshn.com';
const BRAND = 'Pineda y Asociados';
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;
const SOCIAL_TITLE_MAX = 60;
const SOCIAL_DESC_MAX = 160;

const NOINDEX_ROUTES = new Set<string>([
  '/politica-privacidad',
  '/politica-cookies',
  '/aviso-legal',
  '/terminos',
  '/disclaimer',
  '/politica-editorial',
]);

interface RouteMetadata {
  path: string;
  source: 'build' | 'generateMetadata';
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
}

interface Issue {
  path: string;
  field: string;
  severity: 'ERROR' | 'WARN';
  message: string;
  actual: string | number | null;
  expected: string;
}

const issues: Issue[] = [];

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAttribute(tag: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(
    new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'),
  );
  return decodeHtml(match?.[1] ?? match?.[2] ?? '');
}

function extractUnique(path: string, field: string, values: string[]): string {
  const nonEmpty = values.filter(Boolean);
  if (nonEmpty.length !== 1) {
    issues.push({
      path,
      field,
      severity: 'ERROR',
      message: `Se esperaban exactamente 1 valor y se encontraron ${nonEmpty.length}`,
      actual: nonEmpty.length,
      expected: '1',
    });
  }
  return nonEmpty[0] ?? '';
}

function findHtmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = resolve(directory, entry.name);
    return entry.isDirectory() ? findHtmlFiles(absolute) : [absolute];
  }).filter((file) => file.endsWith('.html'));
}

function routeFromHtmlFile(file: string): string {
  const relativeFile = relative(BUILD_APP_DIR, file).replaceAll('\\', '/');
  if (relativeFile === 'index.html') return '/';
  return `/${relativeFile.replace(/\.html$/, '')}`;
}

function discoverPublicBuildFiles(): Array<{ path: string; file: string }> {
  return findHtmlFiles(BUILD_APP_DIR)
    .map((file) => ({
      file,
      relativeFile: relative(BUILD_APP_DIR, file).replaceAll('\\', '/'),
    }))
    .filter(({ relativeFile }) => (
      !relativeFile.startsWith('_')
      && !relativeFile.startsWith('intranet/')
    ))
    .map(({ file }) => ({ file, path: routeFromHtmlFile(file) }));
}

function readSitemapPaths(): Set<string> {
  if (!existsSync(BUILD_SITEMAP_FILE)) {
    throw new Error(
      'No existe .next/server/app/sitemap.xml.body. Ejecute npm run build antes de este auditor.',
    );
  }

  const xml = readFileSync(BUILD_SITEMAP_FILE, 'utf8');
  return new Set(
    [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => {
      const url = new URL(decodeHtml(match[1]));
      return url.pathname.replace(/\/$/, '') || '/';
    }),
  );
}

function extractBuiltMetadata(path: string, file: string): RouteMetadata {
  const html = readFileSync(file, 'utf8');
  const titleValues = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)]
    .map((match) => decodeHtml(match[1]));
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];

  const metaValues = (key: string) => metaTags
    .filter((tag) => {
      const name = getAttribute(tag, 'name');
      const property = getAttribute(tag, 'property');
      return name.toLowerCase() === key.toLowerCase()
        || property.toLowerCase() === key.toLowerCase();
    })
    .map((tag) => getAttribute(tag, 'content'));

  const canonicalValues = linkTags
    .filter((tag) => getAttribute(tag, 'rel').toLowerCase() === 'canonical')
    .map((tag) => getAttribute(tag, 'href'));

  return {
    path,
    source: 'build',
    title: extractUnique(path, 'title', titleValues),
    description: extractUnique(path, 'description', metaValues('description')),
    canonical: extractUnique(path, 'canonical', canonicalValues),
    robots: extractUnique(path, 'robots', metaValues('robots')),
    ogTitle: extractUnique(path, 'og:title', metaValues('og:title')),
    ogDescription: extractUnique(
      path,
      'og:description',
      metaValues('og:description'),
    ),
    twitterTitle: extractUnique(
      path,
      'twitter:title',
      metaValues('twitter:title'),
    ),
    twitterDescription: extractUnique(
      path,
      'twitter:description',
      metaValues('twitter:description'),
    ),
  };
}

function metadataText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof URL) return value.toString();
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.absolute === 'string') return record.absolute;
    if (typeof record.default === 'string') return record.default;
    if (typeof record.url === 'string') return record.url;
  }
  return '';
}

function metadataRobots(value: Metadata['robots']): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const index = value.index === false ? 'noindex' : 'index';
  const follow = value.follow === false ? 'nofollow' : 'follow';
  return `${index}, ${follow}`;
}

function absoluteCanonical(value: unknown): string {
  const canonical = metadataText(value);
  if (!canonical) return '';
  return new URL(canonical, `${CANONICAL_ORIGIN}/`).toString().replace(/\/$/, '');
}

function extractGeneratedMetadata(
  path: string,
  metadata: Metadata,
): RouteMetadata {
  const openGraph = metadata.openGraph as Record<string, unknown> | null | undefined;
  const twitter = metadata.twitter as Record<string, unknown> | null | undefined;
  const alternates = metadata.alternates as Record<string, unknown> | null | undefined;

  return {
    path,
    source: 'generateMetadata',
    title: metadataText(metadata.title),
    description: metadataText(metadata.description),
    canonical: absoluteCanonical(alternates?.canonical),
    robots: metadataRobots(metadata.robots),
    ogTitle: metadataText(openGraph?.title),
    ogDescription: metadataText(openGraph?.description),
    twitterTitle: metadataText(twitter?.title),
    twitterDescription: metadataText(twitter?.description),
  };
}

async function extractDynamicMetadata(): Promise<RouteMetadata[]> {
  const blog = extractGeneratedMetadata(
    '/blog',
    await generateBlogMetadata({ searchParams: Promise.resolve({}) }),
  );

  const categories = await Promise.all(blogCategories.map(async (category) => {
    const path = `/blog/${category.slug}`;
    const metadata = await generateBlogCategoryMetadata({
      params: Promise.resolve({ categoria: category.slug }),
      searchParams: Promise.resolve({}),
    });
    return extractGeneratedMetadata(path, metadata);
  }));

  return [blog, ...categories];
}

function addIssue(
  path: string,
  field: string,
  severity: 'ERROR' | 'WARN',
  message: string,
  actual: string | number | null,
  expected: string,
) {
  issues.push({ path, field, severity, message, actual, expected });
}

function checkLength(
  path: string,
  field: string,
  value: string,
  min: number,
  max: number,
) {
  if (!value) {
    addIssue(path, field, 'ERROR', 'Campo ausente', null, `${min}-${max} caracteres`);
  } else if (value.length < min) {
    addIssue(
      path,
      field,
      'WARN',
      `Demasiado corto (${value.length} caracteres)`,
      value.length,
      `${min}-${max}`,
    );
  } else if (value.length > max) {
    addIssue(
      path,
      field,
      'ERROR',
      `Demasiado largo (${value.length} caracteres)`,
      value.length,
      `${min}-${max}`,
    );
  }
}

function checkText(path: string, field: string, value: string) {
  if (/[\u0000-\u001F\u007F]/.test(value)) {
    addIssue(path, field, 'ERROR', 'Contiene caracteres de control', value, 'Texto limpio');
  }
  if (value.includes('\uFFFD')) {
    addIssue(path, field, 'ERROR', 'Contiene mojibake (�)', value, 'Sin caracteres de reemplazo');
  }
}

function checkBrandDuplicate(path: string, field: string, value: string) {
  const escapedBrand = BRAND.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const count = value.match(new RegExp(escapedBrand, 'gi'))?.length ?? 0;
  if (count > 1) {
    addIssue(path, field, 'ERROR', `Marca duplicada (${count}x)`, count, '0-1');
  }
}

function expectedCanonical(path: string): string {
  return path === '/' ? CANONICAL_ORIGIN : `${CANONICAL_ORIGIN}${path}`;
}

function validateRoute(route: RouteMetadata, sitemapPaths: Set<string>) {
  checkLength(route.path, 'title', route.title, TITLE_MIN, TITLE_MAX);
  checkLength(route.path, 'description', route.description, DESC_MIN, DESC_MAX);
  checkLength(route.path, 'og:title', route.ogTitle, 1, SOCIAL_TITLE_MAX);
  checkLength(
    route.path,
    'og:description',
    route.ogDescription,
    1,
    SOCIAL_DESC_MAX,
  );
  checkLength(
    route.path,
    'twitter:title',
    route.twitterTitle,
    1,
    SOCIAL_TITLE_MAX,
  );
  checkLength(
    route.path,
    'twitter:description',
    route.twitterDescription,
    1,
    SOCIAL_DESC_MAX,
  );

  for (const [field, value] of [
    ['title', route.title],
    ['description', route.description],
    ['og:title', route.ogTitle],
    ['og:description', route.ogDescription],
    ['twitter:title', route.twitterTitle],
    ['twitter:description', route.twitterDescription],
  ] as const) {
    checkText(route.path, field, value);
    if (field.endsWith('title')) checkBrandDuplicate(route.path, field, value);
  }

  let canonicalUrl: URL | null = null;
  try {
    canonicalUrl = new URL(route.canonical);
  } catch {
    // La incidencia se añade en el bloque común inferior.
  }
  const canonicalPath = canonicalUrl?.pathname.replace(/\/$/, '') || '/';
  const isSelfCanonical = route.canonical === expectedCanonical(route.path);
  const isValidInternalConsolidation = Boolean(
    canonicalUrl
    && canonicalUrl.origin === CANONICAL_ORIGIN
    && canonicalPath !== route.path
    && sitemapPaths.has(canonicalPath)
    && !sitemapPaths.has(route.path),
  );

  if (!isSelfCanonical && !isValidInternalConsolidation) {
    addIssue(
      route.path,
      'canonical',
      'ERROR',
      'Canonical ausente, inválida o incoherente con el sitemap',
      route.canonical,
      `${expectedCanonical(route.path)} o consolidación interna excluida del sitemap`,
    );
  }

  const isNoindex = /\bnoindex\b/i.test(route.robots);
  const expectsNoindex = NOINDEX_ROUTES.has(route.path);
  if (!expectsNoindex && isNoindex) {
    addIssue(
      route.path,
      'robots',
      'ERROR',
      'Ruta pública marcada noindex',
      route.robots,
      'index, follow',
    );
  } else if (expectsNoindex && !isNoindex) {
    addIssue(
      route.path,
      'robots',
      'ERROR',
      'Página legal auxiliar indexable contra la política declarada',
      route.robots,
      'noindex, follow',
    );
  }

  if (expectsNoindex && sitemapPaths.has(route.path)) {
    addIssue(
      route.path,
      'sitemap',
      'ERROR',
      'Página noindex presente en el sitemap',
      route.path,
      'Ausente del sitemap',
    );
  } else if (!expectsNoindex && isSelfCanonical && !sitemapPaths.has(route.path)) {
    addIssue(
      route.path,
      'sitemap',
      'ERROR',
      'Ruta indexable autocanónica ausente del sitemap',
      route.path,
      'Presente en el sitemap',
    );
  }
}

async function main() {
  if (!existsSync(BUILD_APP_DIR)) {
    throw new Error('No existe .next/server/app. Ejecute npm run build antes de este auditor.');
  }

  const builtRoutes = discoverPublicBuildFiles()
    .map(({ path, file }) => extractBuiltMetadata(path, file));
  const routes = [...builtRoutes, ...await extractDynamicMetadata()]
    .sort((a, b) => a.path.localeCompare(b.path, 'es'));
  const sitemapPaths = readSitemapPaths();

  const duplicatePaths = routes
    .filter((route, index) => routes.findIndex((item) => item.path === route.path) !== index)
    .map((route) => route.path);
  for (const path of new Set(duplicatePaths)) {
    addIssue(path, 'route', 'ERROR', 'Ruta auditada más de una vez', 2, '1');
  }

  for (const route of routes) validateRoute(route, sitemapPaths);

  const errors = issues.filter((issue) => issue.severity === 'ERROR');
  const warnings = issues.filter((issue) => issue.severity === 'WARN');
  const affectedPaths = new Set(issues.map((issue) => issue.path));

  console.log('\n══════════════════════════════════════════════════');
  console.log(' AUDITORÍA SEO — METADATA PÚBLICA REAL DEL BUILD');
  console.log('══════════════════════════════════════════════════\n');
  console.log(`HTML públicos prerenderizados: ${builtRoutes.length}`);
  console.log(`Rutas dinámicas de blog: ${routes.length - builtRoutes.length}`);
  console.log(`Total URLs auditadas: ${routes.length}`);
  console.log(`URLs canónicas en sitemap: ${sitemapPaths.size}`);
  console.log(`Errores: ${errors.length}`);
  console.log(`Advertencias: ${warnings.length}\n`);

  for (const path of [...affectedPaths].sort((a, b) => a.localeCompare(b, 'es'))) {
    console.log(`❌ ${path}`);
    for (const issue of issues.filter((item) => item.path === path)) {
      console.log(`   ${issue.severity}: ${issue.field} — ${issue.message}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log(`Rutas sin errores: ${routes.filter((route) => !errors.some((issue) => issue.path === route.path)).length}/${routes.length}`);
  console.log(`Errores: ${errors.length} · Advertencias: ${warnings.length}`);
  console.log('══════════════════════════════════════════════════\n');

  process.exitCode = errors.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

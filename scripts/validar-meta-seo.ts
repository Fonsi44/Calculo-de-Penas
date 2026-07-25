/**
 * Auditoría SEO de metadata sobre la salida real de Next.js.
 *
 * Ejecutar después de `npm run build`:
 *   npm run validar:meta-seo
 *
 * A diferencia del auditor histórico, este script no mantiene copias manuales
 * de titles y descriptions. Lee los HTML prerenderizados de `.next` y obtiene
 * la metadata del hub dinámico `/blog` desde su propia función exportada.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Metadata } from 'next';
import { generateMetadata as generateBlogMetadata } from '@/app/(public)/blog/page';

const ROOT = resolve(import.meta.dirname, '..');
const BUILD_APP_DIR = resolve(ROOT, '.next', 'server', 'app');
const CANONICAL_ORIGIN = 'https://www.pinedayasociadoshn.com';
const BRAND = 'Pineda y Asociados';
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 160;
const SOCIAL_TITLE_MAX = 60;
const SOCIAL_DESC_MAX = 160;

const ROUTES = [
  '/',
  '/servicios-juridicos',
  '/derecho-penal',
  '/blog',
  '/despacho',
  '/solicitar-consulta',
  '/hondurenos-en-espana',
  '/preguntas-frecuentes',
  '/como-llegar',
  '/abogados-en-nacaome',
  '/abogados-en-choluteca',
  '/abogados-en-san-lorenzo',
  '/politica-privacidad',
  '/politica-cookies',
  '/aviso-legal',
  '/terminos',
  '/disclaimer',
  '/politica-editorial',
] as const;

type RoutePath = (typeof ROUTES)[number];
const NOINDEX_ROUTES = new Set<RoutePath>([
  '/politica-privacidad',
  '/politica-cookies',
  '/aviso-legal',
  '/terminos',
  '/disclaimer',
  '/politica-editorial',
]);

interface RouteMetadata {
  path: RoutePath;
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
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return decodeHtml(match?.[1] ?? match?.[2] ?? '');
}

function extractUnique(
  html: string,
  path: RoutePath,
  field: string,
  values: string[],
): string {
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

function extractBuiltMetadata(path: Exclude<RoutePath, '/blog'>): RouteMetadata {
  const relativeFile = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
  const file = resolve(BUILD_APP_DIR, relativeFile);
  if (!existsSync(file)) {
    throw new Error(
      `No existe ${file}. Ejecute npm run build antes de validar metadata.`,
    );
  }

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
    title: extractUnique(html, path, 'title', titleValues),
    description: extractUnique(html, path, 'description', metaValues('description')),
    canonical: extractUnique(html, path, 'canonical', canonicalValues),
    robots: extractUnique(html, path, 'robots', metaValues('robots')),
    ogTitle: extractUnique(html, path, 'og:title', metaValues('og:title')),
    ogDescription: extractUnique(
      html,
      path,
      'og:description',
      metaValues('og:description'),
    ),
    twitterTitle: extractUnique(
      html,
      path,
      'twitter:title',
      metaValues('twitter:title'),
    ),
    twitterDescription: extractUnique(
      html,
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

async function extractBlogMetadata(): Promise<RouteMetadata> {
  const metadata = await generateBlogMetadata({
    searchParams: Promise.resolve({}),
  });
  const openGraph = metadata.openGraph as Record<string, unknown> | null | undefined;
  const twitter = metadata.twitter as Record<string, unknown> | null | undefined;
  const alternates = metadata.alternates as Record<string, unknown> | null | undefined;

  return {
    path: '/blog',
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

function expectedCanonical(path: RoutePath): string {
  return path === '/' ? CANONICAL_ORIGIN : `${CANONICAL_ORIGIN}${path}`;
}

function validateRoute(route: RouteMetadata) {
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

  if (route.canonical !== expectedCanonical(route.path)) {
    addIssue(
      route.path,
      'canonical',
      'ERROR',
      'Canonical ausente o distinto de la URL canónica esperada',
      route.canonical,
      expectedCanonical(route.path),
    );
  }
  const isNoindex = /\bnoindex\b/i.test(route.robots);
  const expectsNoindex = NOINDEX_ROUTES.has(route.path);
  if (!expectsNoindex && isNoindex) {
    addIssue(
      route.path,
      'robots',
      'ERROR',
      'Ruta pública prioritaria marcada noindex',
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
}

async function main() {
  if (!existsSync(BUILD_APP_DIR)) {
    throw new Error('No existe .next/server/app. Ejecute npm run build antes de este auditor.');
  }

  const staticRoutes = ROUTES
    .filter((path): path is Exclude<RoutePath, '/blog'> => path !== '/blog')
    .map(extractBuiltMetadata);
  const routes = [...staticRoutes, await extractBlogMetadata()]
    .sort((a, b) => ROUTES.indexOf(a.path) - ROUTES.indexOf(b.path));

  for (const route of routes) validateRoute(route);

  const errors = issues.filter((issue) => issue.severity === 'ERROR');
  const warnings = issues.filter((issue) => issue.severity === 'WARN');

  console.log('\n══════════════════════════════════════════════════');
  console.log(' AUDITORÍA SEO — METADATA REAL DEL BUILD');
  console.log('══════════════════════════════════════════════════\n');
  console.log(`Total URLs auditadas: ${routes.length}`);
  console.log(`Errores: ${errors.length}`);
  console.log(`Advertencias: ${warnings.length}\n`);

  for (const route of routes) {
    const routeIssues = issues.filter((issue) => issue.path === route.path);
    const icon = routeIssues.some((issue) => issue.severity === 'ERROR')
      ? '❌'
      : routeIssues.length > 0
        ? '⚠'
        : '✅';
    console.log(`${icon} ${route.path} [${route.source}]`);
    console.log(`   title (${route.title.length}c): ${route.title}`);
    console.log(`   desc  (${route.description.length}c): ${route.description}`);
    console.log(`   canonical: ${route.canonical}`);
    for (const issue of routeIssues) {
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

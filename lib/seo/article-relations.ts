/**
 * Estructura canónica de relaciones SEO por artículo (enlazado interno).
 *
 * Fuente única para representar, validar y consumir:
 *
 *   - el servicio principal de cada artículo;
 *   - hasta dos artículos realmente relacionados del mismo cluster;
 *   - fuentes oficiales cuando el contenido jurídico las requiera.
 *
 * Reglas (PROMPT 2 §6.2 y §6.3):
 *   - validar slugs existentes;
 *   - rechazar autorreferencias;
 *   - rechazar duplicados;
 *   - rechazar URLs privadas o noindex;
 *   - impedir más enlaces de los permitidos;
 *   - detectar enlaces rotos.
 *
 * El registro de relaciones vive en `data/seo/article-seo-relations.json`
 * (datos versionados, revisables) y este módulo centraliza el acceso y la
 * validación para que archivos y DB no tengan lógica divergente.
 */
import { BLOG_TO_SERVICE, PRACTICE_AREAS } from '@/lib/internal-links';

export interface ArticleSeoRelations {
  slug: string;
  /** Ruta interna del servicio principal (p. ej. /servicios-juridicos/derecho-civil-y-notarial). */
  primaryService: string;
  /** Slugs de artículos relacionados (máx 2). */
  relatedArticles: string[];
  /** URLs oficiales (gob.hn, poderjudicial, sar, cnbs, tse…) — solo verificadas. */
  officialSources: string[];
}

export const MAX_RELATED_ARTICLES = 2;

/** Rutas de servicio permitidas como primaryService (fuente única). */
export const ALLOWED_SERVICE_PATHS: ReadonlySet<string> = new Set([
  ...PRACTICE_AREAS.map((a) => a.href),
  '/servicios-juridicos',
  '/despacho',
  '/hondurenos-en-espana',
  '/blog',
]);

/** Rutas internas privadas que nunca deben enlazarse desde contenido público. */
const PRIVATE_PATH_PREFIXES = [
  '/admin',
  '/intranet',
  '/api',
  '/cargar',
  '/sitemap',
  '/_next',
];

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export interface ArticleCatalogEntry {
  slug: string;
  category: string;
  /** Indexable (publicado, no noindex, no redirect source). */
  indexable: boolean;
}

export type ArticleCatalog = ReadonlyMap<string, ArticleCatalogEntry>;

/** Valida un registro de relaciones contra el catálogo de artículos. */
export function validateArticleSeoRelations(
  relations: ArticleSeoRelations,
  catalog: ArticleCatalog,
): string[] {
  const violations: string[] = [];
  const ctx = relations.slug;

  if (!catalog.has(relations.slug)) {
    violations.push(`[${ctx}] El slug del artículo no existe en el catálogo.`);
    return violations;
  }

  // primaryService
  if (!relations.primaryService) {
    violations.push(`[${ctx}] Falta primaryService.`);
  } else if (!ALLOWED_SERVICE_PATHS.has(relations.primaryService)) {
    violations.push(`[${ctx}] primaryService no es una ruta de servicio permitida: ${relations.primaryService}`);
  } else if (isPrivatePath(relations.primaryService)) {
    violations.push(`[${ctx}] primaryService es una ruta privada.`);
  }

  // relatedArticles
  if (relations.relatedArticles.length > MAX_RELATED_ARTICLES) {
    violations.push(`[${ctx}] Máximo ${MAX_RELATED_ARTICLES} artículos relacionados permitidos (tiene ${relations.relatedArticles.length}).`);
  }
  const seen = new Set<string>();
  for (const related of relations.relatedArticles) {
    if (related === relations.slug) {
      violations.push(`[${ctx}] Autorreferencia en relatedArticles: ${related}.`);
      continue;
    }
    if (seen.has(related)) {
      violations.push(`[${ctx}] Duplicado en relatedArticles: ${related}.`);
      continue;
    }
    seen.add(related);
    const entry = catalog.get(related);
    if (!entry) {
      violations.push(`[${ctx}] Enlace roto: ${related} no existe en el catálogo.`);
      continue;
    }
    if (entry.slug === relations.slug) {
      violations.push(`[${ctx}] Autorreferencia (mismo slug distinta categoría).`);
    }
    if (!entry.indexable) {
      violations.push(`[${ctx}] relatedArticles apunta a contenido no indexable: ${related}.`);
    }
  }

  // officialSources
  for (const source of relations.officialSources) {
    if (!/^https:\/\//i.test(source)) {
      violations.push(`[${ctx}] Fuente oficial no HTTPS (o URL relativa): ${source}`);
      continue;
    }
    try {
      const u = new URL(source);
      if (isPrivatePath(u.pathname)) {
        violations.push(`[${ctx}] Fuente oficial apunta a ruta privada: ${source}`);
      }
    } catch {
      violations.push(`[${ctx}] Fuente oficial inválida: ${source}`);
    }
  }

  return violations;
}

/** Valida todos los registros y devuelve { ok, violations } global. */
export function validateAllArticleRelations(
  relations: ArticleSeoRelations[],
  catalog: ArticleCatalog,
): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const r of relations) {
    violations.push(...validateArticleSeoRelations(r, catalog));
  }
  return { ok: violations.length === 0, violations };
}

/** Resuelve el nombre legible del servicio a partir de su ruta. */
export function serviceNameFromPath(path: string): string {
  for (const area of PRACTICE_AREAS) {
    if (area.href === path) return area.titulo;
  }
  if (path === '/despacho') return 'El Despacho';
  if (path === '/servicios-juridicos') return 'Servicios Jurídicos';
  if (path === '/hondurenos-en-espana') return 'Hondureños en España';
  if (path === '/derecho-penal') return 'Defensa Penal';
  if (path === '/blog') return 'Blog Jurídico';
  return path;
}

/**
 * Devuelve los artículos relacionados canónicos (definidos en el registro)
 * que existan y sean indexables; si no hay definición canónica o los targets
 * no son válidos, devuelve [] (el llamador decide el fallback).
 */
export function getCanonicalRelatedSummaries<T extends { slug: string; category: string; noindex?: boolean | null }>(
  summaries: readonly T[],
  relations: ArticleSeoRelations | undefined,
): T[] {
  if (!relations) return [];
  const bySlug = new Map(summaries.map((s) => [s.slug, s]));
  const picks: T[] = [];
  for (const related of relations.relatedArticles) {
    const summary = bySlug.get(related);
    if (summary && summary.slug !== relations.slug && !summary.noindex) {
      picks.push(summary);
    }
  }
  return picks;
}

function isArticleSeoRelation(value: unknown): value is ArticleSeoRelations {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<ArticleSeoRelations>;
  return typeof row.slug === 'string' && Array.isArray(row.relatedArticles);
}

/**
 * Acceso de solo lectura al registro versionado.
 * Acepta el array crudo o el envoltorio `{ relations: [...] }` del JSON canónico.
 * Un objeto no-array sin `relations` no es un registro vacío a medias: es un
 * no-load (evita que el suppress YMYL quede en silencio).
 */
export function loadArticleSeoRelations(
  data: unknown,
): ArticleSeoRelations[] {
  const rows = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { relations?: unknown }).relations)
      ? (data as { relations: unknown[] }).relations
      : [];
  return rows.filter(isArticleSeoRelation);
}

/** Helper: servicio esperado de un artículo por categoría (misma fuente que el render). */
export function expectedServicePathForCategory(category: string): string | null {
  const service = BLOG_TO_SERVICE[category];
  return service?.href ?? null;
}

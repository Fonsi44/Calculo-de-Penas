/**
 * Librería compartida de auditoría de contenido público dinámico.
 *
 * Usada por:
 *   - scripts/audit-dynamic-content.ts  (inventario + auditoría de política);
 *   - scripts/remediate-commercial-claims.ts (patch idempotente dry-run).
 *
 * Proporciona:
 *   - inventario tipado de fuentes de contenido público (archivos + DB);
 *   - escaneo de políticas sobre archivos versionados (mismo motor que Admin);
 *   - lectura de solo lectura de tablas de contenido público (local/staging);
 *   - hashes y utilidades CSV.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import {
  inspectEnvironment,
  assertAllowedEnvironment,
  loadEnvFile,
  describeEnvironment,
  type EnvInspection,
} from '@/scripts/lib/environment-guard';
import {
  scanContentPolicyViolations,
  type ContentPolicyViolation,
} from '@/lib/content-policy';

export type SourceKind = 'file' | 'database' | 'seed' | 'fixture' | 'snapshot';

export interface ContentSource {
  source: SourceKind;
  table_or_file: string;
  field: string;
  public_route: string;
  content_type:
    | 'copy'
    | 'faq'
    | 'blog'
    | 'landing'
    | 'meta'
    | 'jsonld'
    | 'cta'
    | 'site_config';
  editable_from_admin: boolean;
  validation_status: string;
}

/**
 * Inventario canónico de fuentes de contenido público. Amplía lo que ya
 * existía en docs/seo/current/* (no duplica): este es el inventario tipado
 * para auditoría de política dinámica.
 */
export const VERSIONED_CONTENT_SOURCES: readonly ContentSource[] = [
  // ── Archivos versionados con copy público ───────────────────────────────
  { source: 'file', table_or_file: 'data/landings-locales.ts', field: '*', public_route: '/abogados-en-*', content_type: 'landing', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'data/faq.ts', field: '*', public_route: '/preguntas-frecuentes', content_type: 'faq', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'data/faqs-hubs.ts', field: '*', public_route: '/preguntas-frecuentes', content_type: 'faq', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'data/pilar/faqs-guia.ts', field: '*', public_route: '/guia-legal-abogados-honduras', content_type: 'faq', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'data/areas-juridicas.ts', field: '*', public_route: '/servicios-juridicos', content_type: 'copy', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'data/blog/categories.ts', field: '*', public_route: '/blog', content_type: 'copy', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'data/faq-categories.ts', field: '*', public_route: '/preguntas-frecuentes', content_type: 'faq', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'lib/site.ts', field: '*', public_route: 'global', content_type: 'site_config', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'lib/public-claims.ts', field: '*', public_route: 'global', content_type: 'site_config', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'lib/blog-generated-cta.ts', field: '*', public_route: '/blog/*', content_type: 'cta', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'lib/lead-magnet-pdf.tsx', field: '*', public_route: '/solicitar-consulta', content_type: 'cta', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'lib/page-content-db.ts', field: '*', public_route: 'admin-page-content', content_type: 'copy', editable_from_admin: true, validation_status: 'defaults' },
  { source: 'file', table_or_file: 'lib/faq-db.ts', field: '*', public_route: '/preguntas-frecuentes', content_type: 'faq', editable_from_admin: false, validation_status: 'fallback' },
  { source: 'file', table_or_file: 'components/marketing/consultation-cta.tsx', field: '*', public_route: 'global', content_type: 'cta', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'components/marketing/cta-spain.tsx', field: '*', public_route: 'global', content_type: 'cta', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'components/marketing/lead-magnet-cta.tsx', field: '*', public_route: '/solicitar-consulta', content_type: 'cta', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'components/marketing/public-footer.tsx', field: '*', public_route: 'global', content_type: 'cta', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'components/marketing/solicitar-consulta-form.tsx', field: '*', public_route: '/solicitar-consulta', content_type: 'cta', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'components/marketing/hub-faq.tsx', field: '*', public_route: '/preguntas-frecuentes', content_type: 'faq', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'components/blog/newsletter-section.tsx', field: '*', public_route: '/blog/*', content_type: 'cta', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'app/(public)/page.tsx', field: '*', public_route: '/', content_type: 'copy', editable_from_admin: true, validation_status: 'static' },
  { source: 'file', table_or_file: 'app/(public)/despacho/page.tsx', field: '*', public_route: '/despacho', content_type: 'copy', editable_from_admin: true, validation_status: 'static' },
  { source: 'file', table_or_file: 'app/(public)/preguntas-frecuentes/page.tsx', field: '*', public_route: '/preguntas-frecuentes', content_type: 'faq', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'app/(public)/solicitar-consulta/page.tsx', field: '*', public_route: '/solicitar-consulta', content_type: 'cta', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'app/(public)/guia-legal-abogados-honduras/page.tsx', field: '*', public_route: '/guia-legal-abogados-honduras', content_type: 'copy', editable_from_admin: false, validation_status: 'static' },
  { source: 'file', table_or_file: 'app/(public)/blog/page.tsx', field: '*', public_route: '/blog', content_type: 'copy', editable_from_admin: false, validation_status: 'static' },

  // ── Seeds ───────────────────────────────────────────────────────────────
  { source: 'seed', table_or_file: 'drizzle/seed.ts', field: '*', public_route: 'admin', content_type: 'copy', editable_from_admin: false, validation_status: 'seed' },
  { source: 'seed', table_or_file: 'drizzle/seed-fase2.ts', field: '*', public_route: 'admin', content_type: 'copy', editable_from_admin: false, validation_status: 'seed' },

  // ── Fixtures (sanitizados) ──────────────────────────────────────────────
  { source: 'fixture', table_or_file: 'data/seo/preview-blog-fixtures.json', field: '*', public_route: '/blog/*', content_type: 'blog', editable_from_admin: false, validation_status: 'fixture' },

  // ── Tablas de contenido administrable (DB) ──────────────────────────────
  { source: 'database', table_or_file: 'blog_posts', field: 'title', public_route: '/blog/[categoria]/[slug]', content_type: 'blog', editable_from_admin: true, validation_status: 'database' },
  { source: 'database', table_or_file: 'blog_posts', field: 'description', public_route: '/blog/[categoria]/[slug]', content_type: 'blog', editable_from_admin: true, validation_status: 'database' },
  { source: 'database', table_or_file: 'blog_posts', field: 'body', public_route: '/blog/[categoria]/[slug]', content_type: 'blog', editable_from_admin: true, validation_status: 'database' },
  { source: 'database', table_or_file: 'blog_posts', field: 'meta_title', public_route: '/blog/[categoria]/[slug]', content_type: 'blog', editable_from_admin: true, validation_status: 'database' },
  { source: 'database', table_or_file: 'blog_posts', field: 'meta_description', public_route: '/blog/[categoria]/[slug]', content_type: 'blog', editable_from_admin: true, validation_status: 'database' },
  { source: 'database', table_or_file: 'faq_entries', field: 'question', public_route: '/preguntas-frecuentes', content_type: 'faq', editable_from_admin: true, validation_status: 'database' },
  { source: 'database', table_or_file: 'faq_entries', field: 'answer', public_route: '/preguntas-frecuentes', content_type: 'faq', editable_from_admin: true, validation_status: 'database' },
  { source: 'database', table_or_file: 'page_content', field: 'content', public_route: '/admin-pages', content_type: 'copy', editable_from_admin: true, validation_status: 'database' },
  { source: 'database', table_or_file: 'configuracion_sitio', field: 'valor', public_route: 'global', content_type: 'site_config', editable_from_admin: true, validation_status: 'database' },
];

/** Archivos que contienen la DEFINICIÓN de los patrones; no son contenido. */
const PATTERN_SOURCE_FILES = new Set([
  'lib/marketing-policy.ts',
  'lib/content-policy.ts',
]);

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function shortHash(text: string, len = 16): string {
  return sha256Hex(text).slice(0, len);
}

export function csv(headers: string[], rows: readonly object[]): string {
  const quote = (value: unknown) =>
    `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [
    headers.map(quote).join(','),
    ...rows.map((row) => {
      const record = row as Record<string, unknown>;
      return headers.map((header) => quote(record[header])).join(',');
    }),
  ].join('\n') + '\n';
}

/**
 * Escanea un archivo versionado de contenido con el motor común de política.
 * Devuelve violaciones con contexto de archivo. Los archivos que definen los
 * patrones se excluyen (no son contenido).
 */
export function scanVersionedFile(
  relPath: string,
  context: string,
): ContentPolicyViolation[] {
  if (PATTERN_SOURCE_FILES.has(relPath)) return [];
  const source = readFileSync(relPath, 'utf8');
  return scanContentPolicyViolations(source, {
    field: relPath,
    context,
    mode: 'script',
  });
}

export interface DatabaseRow {
  table: string;
  record_id: string;
  field: string;
  content: string;
  route: string;
}

export interface DatabaseReadResult {
  ok: boolean;
  rows: DatabaseRow[];
  reason?: string;
  inspection: EnvInspection;
}

/**
 * Lee (solo lectura) las tablas de contenido público de local/staging.
 * Bloquea producción y entornos desconocidos (fail-closed). No escribe nada.
 */
export async function readPublicContentTables(
  envFile?: string,
): Promise<DatabaseReadResult> {
  loadEnvFile(envFile);
  const inspection = inspectEnvironment();

  if (inspection.kind === 'production' || inspection.kind === 'unknown') {
    return {
      ok: false,
      rows: [],
      reason: `entorno no permitido para lectura: ${inspection.kind} (${describeInspection(inspection)})`,
      inspection,
    };
  }
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('placeholder')) {
    return {
      ok: false,
      rows: [],
      reason: 'sin DATABASE_URL configurada (usar --env-file con local/staging)',
      inspection,
    };
  }

  const sql: NeonQueryFunction<false, false> = neon(url);
  const rows: DatabaseRow[] = [];

  const postRows = (await sql`select id, slug, title, description, body, meta_title, meta_description, category, noindex from blog_posts`) as Array<{
    id: string; slug: string; title: string; description: string; body: string;
    meta_title: string | null; meta_description: string | null; category: string;
    noindex: boolean | null;
  }>;
  for (const r of postRows) {
    const route = `/blog/${r.category}/${r.slug}`;
    for (const [field, value] of Object.entries({
      title: r.title,
      description: r.description,
      body: r.body,
      meta_title: r.meta_title ?? '',
      meta_description: r.meta_description ?? '',
    })) {
      rows.push({
        table: 'blog_posts',
        record_id: r.id,
        field,
        content: value,
        route,
      });
    }
  }

  const faqRows = (await sql`
    select id, question, answer, category from faq_entries`) as Array<{ id: string; question: string; answer: string; category: string }>;
  for (const r of faqRows) {
    rows.push({ table: 'faq_entries', record_id: r.id, field: 'question', content: r.question, route: `/preguntas-frecuentes#${r.category}` });
    rows.push({ table: 'faq_entries', record_id: r.id, field: 'answer', content: r.answer, route: `/preguntas-frecuentes#${r.category}` });
  }

  const pcRows = (await sql`
    select id, page, section, field, content from page_content`) as Array<{ id: string; page: string; section: string; field: string; content: string }>;
  for (const r of pcRows) {
    rows.push({ table: 'page_content', record_id: r.id, field: `${r.section}.${r.field}`, content: r.content, route: `/${r.page}` });
  }

  const confRows = (await sql`
    select id, clave, valor from configuracion_sitio`) as Array<{ id: string; clave: string; valor: string }>;
  for (const r of confRows) {
    rows.push({ table: 'configuracion_sitio', record_id: r.id, field: r.clave, content: r.valor, route: 'global' });
  }

  return { ok: true, rows, inspection };
}

function describeInspection(inspection: EnvInspection): string {
  return [
    inspection.kind,
    inspection.host ? `host=${inspection.host}` : '',
    inspection.database ? `base=${inspection.database}` : '',
  ].filter(Boolean).join(' | ');
}

export {
  inspectEnvironment,
  assertAllowedEnvironment,
  loadEnvFile,
  describeEnvironment,
};

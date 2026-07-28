import 'dotenv/config';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';
import sanitizeHtml from 'sanitize-html';
import { getEditorialResponsibility } from '../lib/legal-review';

const ALLOWED_SLUGS = [
  'derechos-detenido-honduras-guia-constitucional',
  'demanda-laboral-choluteca',
  'pension-alimenticia-porcentaje-honduras-2026',
  'cobro-deudas-choluteca',
] as const;

const PUBLIC_COLUMNS = [
  'slug', 'category', 'title', 'description', 'meta_title', 'meta_description',
  'body', 'cover_image', 'og_image', 'tags', 'published_at', 'updated_at',
  'canonical_url', 'noindex', 'reading_time',
] as const;

type PublicFixtureRow = {
  slug: string;
  category: string;
  title: string;
  description: string;
  meta_title: string | null;
  meta_description: string | null;
  body: string;
  cover_image: string | null;
  og_image: string | null;
  tags: string[] | null;
  published_at: string;
  updated_at: string | null;
  canonical_url: string | null;
  noindex: boolean | null;
  reading_time: string | null;
};

type PreviewFixtureRow = PublicFixtureRow & {
  author: string;
  review_status: 'pending' | 'verified';
  reviewed_by: string | null;
  reviewed_at: string | null;
  published: true;
  fixture_only: true;
};

function sanitizePublicFixtureBody(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'aside']),
    allowedAttributes: {
      a: ['href', 'title', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      aside: ['class'],
      '*': ['id'],
    },
    allowedSchemes: ['https', 'http'],
    exclusiveFilter(frame) {
      if (frame.tag !== 'a') return false;
      const href = frame.attribs.href ?? '';
      return /(?:wa\.me|whatsapp|mailto:|tel:)/i.test(href);
    },
  })
    .replace(/\+?504[\s-]?\d{4}[\s-]?\d{4}/g, '[contacto retirado]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[correo retirado]');
}

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    throw new Error('DATABASE_URL no configurada para exportación read-only.');
  }

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql.query(
    `SELECT ${PUBLIC_COLUMNS.join(', ')}
     FROM blog_posts
     WHERE published = true AND slug = ANY($1)
     ORDER BY category, slug`,
    [ALLOWED_SLUGS],
  ) as unknown as PublicFixtureRow[];
  if (rows.length !== ALLOWED_SLUGS.length) {
    throw new Error(`Snapshot incompleto: esperados ${ALLOWED_SLUGS.length}, obtenidos ${rows.length}.`);
  }

  const fixtures: PreviewFixtureRow[] = rows.map((row) => {
    const responsibility = getEditorialResponsibility(row.category);
    return {
      ...row,
      body: sanitizePublicFixtureBody(String(row.body)),
      author: responsibility.author || 'Asignación humana pendiente',
      review_status: 'pending' as const,
      reviewed_by: null,
      reviewed_at: null,
      published: true,
      fixture_only: true as const,
    };
  });

  const penal = fixtures.find((row) => row.category === 'derecho-penal');
  if (!penal) throw new Error('Falta fixture penal base.');
  fixtures.push({
    ...penal,
    slug: 'fixture-preview-articulo-verificado',
    title: '[Fixture Preview] Artículo verificado para validar schema',
    description: 'Fixture exclusivamente no productivo para probar indexación y Article schema.',
    meta_title: '[Fixture Preview] Validación técnica de Article',
    meta_description: 'Contenido sintético no productivo para validar el contrato técnico de revisión.',
    body: '<aside><strong>FIXTURE NO PRODUCTIVO.</strong> No constituye revisión jurídica real y nunca debe migrarse a Production.</aside>' + penal.body,
    review_status: 'verified' as const,
    reviewed_by: 'Fixture técnico no productivo',
    reviewed_at: '2026-07-28T00:00:00.000Z',
  });

  const payload = {
    version: 1,
    generated_at: '2026-07-28',
    source: 'read-only allowlist blog_posts public fields',
    production_import_forbidden: true,
    allowed_columns: [...PUBLIC_COLUMNS],
    fixtures,
  };
  const canonical = JSON.stringify(payload);
  const output = {
    ...payload,
    sha256: createHash('sha256').update(canonical).digest('hex'),
  };
  writeFileSync(
    resolve('data/seo/preview-blog-fixtures.json'),
    `${JSON.stringify(output, null, 2)}\n`,
    { encoding: 'utf8', flag: 'w' },
  );
  console.log(`Preview fixtures: ${fixtures.length}; sha256=${output.sha256}`);
}

void main();

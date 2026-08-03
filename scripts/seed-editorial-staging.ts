import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const HISTORICAL_REDIRECT_SLUGS = [
  'abogados-en-amapala-valle',
  'abogados-en-choluteca',
  'abogados-en-marcovia-choluteca',
  'abogados-en-nacaome',
  'abogados-en-pespire-choluteca',
  'abogados-en-san-lorenzo',
  'abogados-en-san-marcos-de-colon-choluteca',
] as const;
const RESTORED_HISTORICAL_ARTICLE_SLUGS = new Set(['abogados-en-nacaome']);

type PublicBlogRow = {
  slug: string;
  title: string;
  description: string;
  body: string;
  published_at: Date | string;
  updated_at: Date | string | null;
  category: string;
  tags: string[] | null;
  author: string | null;
  reading_time: string | null;
  cover_image: string | null;
  featured: boolean | null;
  published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  noindex: boolean | null;
  canonical_url: string | null;
  review_status: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | string | null;
  legal_review_notes: string | null;
};

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL ?? '';
  const targetUrl = process.env.DATABASE_URL ?? '';
  if (!sourceUrl || !targetUrl || sourceUrl === targetUrl) throw new Error('Fuente y destino deben ser distintos.');
  if (process.env.E2E_ENVIRONMENT !== 'staging' || process.env.ALLOW_TEST_DATABASE !== 'true') {
    throw new Error('La carga pública solo se permite en staging aislado.');
  }

  const source = neon(sourceUrl);
  const target = neon(targetUrl);
  const targetMeta = await target`SELECT current_setting('neon.branch_id', true) AS branch_id`;
  const targetBranch = String(targetMeta[0]?.branch_id ?? '');
  if (!targetBranch || targetBranch === process.env.NEON_PRODUCTION_BRANCH_ID) {
    throw new Error('El destino no es una rama Neon staging verificable.');
  }

  const rows = await source`
    SELECT slug, title, description, body, published_at, updated_at, category,
           tags, author, reading_time, cover_image, featured, published,
           meta_title, meta_description, og_image, noindex, canonical_url,
           review_status, reviewed_by, reviewed_at, legal_review_notes
    FROM blog_posts
    WHERE published = true
       OR slug = ANY(${HISTORICAL_REDIRECT_SLUGS})
    ORDER BY slug
  ` as PublicBlogRow[];
  if (rows.length !== 141) {
    throw new Error(`Inventario histórico inesperado: ${rows.length}; esperado 141.`);
  }

  const recoveredRows = rows.map((row) => ({
    ...row,
    published: row.published === true || RESTORED_HISTORICAL_ARTICLE_SLUGS.has(String(row.slug)),
  }));
  const results = await target.transaction((tx) => recoveredRows.map((row) => tx`
    INSERT INTO blog_posts (
      slug, title, description, body, published_at, updated_at, category,
      tags, author, reading_time, cover_image, featured, published,
      meta_title, meta_description, og_image, noindex, canonical_url,
      review_status, reviewed_by, reviewed_at, legal_review_notes
    ) VALUES (
      ${row.slug}, ${row.title}, ${row.description}, ${row.body},
      ${row.published_at}, ${row.updated_at}, ${row.category},
      ${row.tags}, ${row.author}, ${row.reading_time}, ${row.cover_image},
      ${row.featured}, ${row.published}, ${row.meta_title},
      ${row.meta_description}, ${row.og_image}, ${row.noindex},
      ${row.canonical_url}, ${row.review_status}, ${row.reviewed_by},
      ${row.reviewed_at}, ${row.legal_review_notes}
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      body = EXCLUDED.body,
      published_at = EXCLUDED.published_at,
      updated_at = EXCLUDED.updated_at,
      category = EXCLUDED.category,
      tags = EXCLUDED.tags,
      author = EXCLUDED.author,
      reading_time = EXCLUDED.reading_time,
      cover_image = EXCLUDED.cover_image,
      featured = EXCLUDED.featured,
      published = EXCLUDED.published,
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      og_image = EXCLUDED.og_image,
      noindex = EXCLUDED.noindex,
      canonical_url = EXCLUDED.canonical_url,
      review_status = EXCLUDED.review_status,
      reviewed_by = EXCLUDED.reviewed_by,
      reviewed_at = EXCLUDED.reviewed_at,
      legal_review_notes = EXCLUDED.legal_review_notes
    RETURNING slug
  `), { isolationLevel: 'Serializable' });
  const affected = results.reduce((total, result) => total + result.length, 0);
  if (affected !== 141) throw new Error(`Carga incompleta: ${affected}/141.`);
  console.log(JSON.stringify({
    mode: 'historical-public-blog-to-staging',
    targetBranchVerified: true,
    sourceRows: rows.length,
    productionPublishedArticles: rows.filter((row) => row.published === true).length,
    restoredHistoricalArticles: recoveredRows.filter((row) => (
      row.published === true && rows.find((source) => source.slug === row.slug)?.published !== true
    )).length,
    previewPublishedArticles: recoveredRows.filter((row) => row.published === true).length,
    historicalRedirects: recoveredRows.filter((row) => row.published !== true).length,
    affected,
    privateTablesCopied: 0,
  }, null, 2));
}

void main();

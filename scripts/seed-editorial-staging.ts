import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

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
    ORDER BY slug
  `;
  if (rows.length !== 134) throw new Error(`Inventario público inesperado: ${rows.length}; esperado 134.`);

  const results = await target.transaction((tx) => rows.map((row) => tx`
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
  if (affected !== 134) throw new Error(`Carga incompleta: ${affected}/134.`);
  console.log(JSON.stringify({
    mode: 'public-blog-to-staging',
    targetBranchVerified: true,
    sourceRows: rows.length,
    affected,
    privateTablesCopied: 0,
  }, null, 2));
}

void main();

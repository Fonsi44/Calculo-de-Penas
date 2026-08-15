/**
 * Upsert de artículos editoriales versionados en data/blog/articles/.
 * Dry-run por defecto. Rechaza producción (environment-guard).
 *
 *   npx tsx scripts/upsert-editorial-article.ts
 *   npx tsx scripts/upsert-editorial-article.ts --slug audiencia-inicial-juzgados-valle
 *   npx tsx scripts/upsert-editorial-article.ts --aplicar   # solo local/staging autorizado
 */
import { neon } from '@neondatabase/serverless';
import {
  EDITORIAL_ARTICLES,
  getEditorialArticle,
  type EditorialArticle,
} from '@/data/blog/articles';
import {
  assertAllowedEnvironment,
  loadEnvFile,
} from './lib/environment-guard';

const APPLY = process.argv.includes('--aplicar');
const slugFlag = process.argv.find((arg) => arg.startsWith('--slug='));
const slugIndex = process.argv.indexOf('--slug');
const requestedSlug = slugFlag
  ? slugFlag.slice('--slug='.length)
  : slugIndex >= 0
    ? process.argv[slugIndex + 1]
    : undefined;

function toPayload(article: EditorialArticle) {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    category: article.category,
    tags: [...article.tags],
    author: article.author,
    reading_time: article.readingTime,
    cover_image: article.coverImage,
    published: article.published,
    meta_title: article.metaTitle,
    meta_description: article.metaDescription,
    noindex: article.noindex,
    canonical_url: `https://www.pinedayasociadoshn.com${article.canonicalPath}`,
    review_status: article.reviewStatus,
    published_at: article.publishedAt,
  };
}

async function main() {
  loadEnvFile(process.env.ENV_FILE);
  const articles = requestedSlug
    ? [getEditorialArticle(requestedSlug)]
    : [...EDITORIAL_ARTICLES];

  console.log(JSON.stringify({
    mode: APPLY ? 'aplicar' : 'dry-run',
    slugs: articles.map((article) => article.slug),
    count: articles.length,
  }, null, 2));

  if (!APPLY) {
    console.log('Dry-run: no se escribió la base. Use --aplicar solo en local/staging autorizado.');
    return;
  }

  assertAllowedEnvironment('upsert-editorial-article', { write: true });
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL ausente.');
  const sql = neon(url);

  for (const article of articles) {
    const payload = toPayload(article);
    await sql`
      INSERT INTO blog_posts (
        slug, title, description, body, published_at, updated_at, category,
        tags, author, reading_time, cover_image, featured, published,
        meta_title, meta_description, noindex, canonical_url, review_status
      ) VALUES (
        ${payload.slug}, ${payload.title}, ${payload.description}, ${payload.body},
        ${payload.published_at}, ${payload.published_at}, ${payload.category},
        ${payload.tags}, ${payload.author}, ${payload.reading_time}, ${payload.cover_image},
        false, ${payload.published}, ${payload.meta_title}, ${payload.meta_description},
        ${payload.noindex}, ${payload.canonical_url}, ${payload.review_status}
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        body = EXCLUDED.body,
        updated_at = EXCLUDED.updated_at,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        author = EXCLUDED.author,
        reading_time = EXCLUDED.reading_time,
        cover_image = EXCLUDED.cover_image,
        published = EXCLUDED.published,
        meta_title = EXCLUDED.meta_title,
        meta_description = EXCLUDED.meta_description,
        noindex = EXCLUDED.noindex,
        canonical_url = EXCLUDED.canonical_url,
        review_status = EXCLUDED.review_status
    `;
  }
  console.log(JSON.stringify({ applied: true, slugs: articles.map((article) => article.slug) }, null, 2));
}

void main();

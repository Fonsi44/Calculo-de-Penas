import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
import { normalizeReviewStatus } from '../lib/legal-review';

type QueryPage = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

const SITE = 'https://www.pinedayasociadoshn.com';
const HUMAN_ASSIGNMENT = new Set([
  'derecho-bancario',
  'tributario',
  'derecho-aduanero',
  'regulacion-sanitaria',
  'derecho-ambiental',
]);

const responsibility: Record<string, [string, string]> = {
  'derecho-penal': ['Danilo Pineda Maradiaga', 'Emil Barahona'],
  'proceso-penal': ['Danilo Pineda Maradiaga', 'Emil Barahona'],
  'derecho-laboral': ['Emil Barahona', 'Thania Marlene Paz'],
  'derecho-de-familia': ['Thania Marlene Paz', ''],
  'derecho-civil': ['Thania Marlene Paz', 'Emil Barahona'],
  'derecho-notarial': ['Thania Marlene Paz', 'Emil Barahona'],
  'derecho-mercantil': ['Thania Marlene Paz', 'Emil Barahona'],
  'derecho-administrativo': ['Thania Marlene Paz', ''],
  'hondurenos-en-espana': ['Thania Marlene Paz', ''],
};

function csv(value: unknown): string {
  const raw = value == null ? '' : String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

function wordCount(html: string): number {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

async function main() {
  config({ path: path.join(process.cwd(), '.env.local'), quiet: true });
  config({ path: path.join(process.cwd(), '.env'), quiet: true });
  const [{ db }, { blogPosts }] = await Promise.all([
    import('../lib/db'),
    import('../lib/schema'),
  ]);
  const gsc = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data/google/gsc-live.json'), 'utf8'),
  ) as { queryPages: QueryPage[] };
  const byPage = new Map<string, QueryPage[]>();
  for (const row of gsc.queryPages) {
    byPage.set(row.page, [...(byPage.get(row.page) ?? []), row]);
  }

  const posts = await db.select().from(blogPosts);
  const headers = [
    'id', 'slug', 'url', 'title_db', 'title_rendered', 'meta_title',
    'meta_description', 'h1', 'category', 'primary_intent', 'primary_query',
    'author_current', 'author_proposed', 'reviewer_current', 'reviewer_proposed',
    'legal_review_status_raw', 'legal_review_status_normalized', 'published',
    'indexable', 'sitemap', 'word_count', 'source_count',
    'official_source_count', 'internal_links', 'service_link',
    'canonical_target', 'clicks', 'impressions', 'ctr', 'position', 'action',
  ];
  const lines = [headers.join(',')];

  for (const post of posts) {
    const url = `${SITE}/blog/${post.category}/${post.slug}`;
    const rows = byPage.get(url) ?? [];
    const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
    const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
    const weightedPosition = impressions
      ? rows.reduce((sum, row) => sum + row.position * row.impressions, 0) / impressions
      : 0;
    const topQuery = [...rows].sort((a, b) => b.impressions - a.impressions)[0]?.query ?? '';
    const normalized = normalizeReviewStatus(post.reviewStatus);
    const indexable = post.published === true && post.noindex !== true && normalized === 'verified';
    const assignment = responsibility[post.category];
    const authorProposed = HUMAN_ASSIGNMENT.has(post.category)
      ? 'HUMAN_ASSIGNMENT_REQUIRED'
      : assignment?.[0] ?? 'HUMAN_ASSIGNMENT_REQUIRED';
    const reviewerProposed = HUMAN_ASSIGNMENT.has(post.category) ? '' : assignment?.[1] ?? '';
    const links = post.body.match(/<a\b[^>]*href=/gi)?.length ?? 0;
    const sourceLinks = post.body.match(/https?:\/\/[^"' <]+/gi) ?? [];
    const officialSources = sourceLinks.filter((link) =>
      /\.(gob\.hn|hn)(?:\/|$)/i.test(link) || /poderjudicial|congresonacional/i.test(link),
    ).length;
    let action = indexable ? 'KEEP' : 'NOINDEX_PENDING_REVIEW';
    if (indexable && impressions >= 20 && clicks / impressions < 0.03) action = 'METADATA_UPDATE';
    if (indexable && weightedPosition >= 3 && weightedPosition <= 15) action = 'CONTENT_UPDATE';

    lines.push([
      post.id, post.slug, url, post.title, post.title, post.metaTitle ?? post.title,
      post.metaDescription ?? post.description, post.title, post.category,
      'informational', topQuery, post.author ?? '', authorProposed,
      post.reviewedBy ?? '', reviewerProposed, post.reviewStatus ?? '',
      normalized === 'verified' ? 'lawyer_verified' : 'lawyer_review_pending',
      post.published === true, indexable, indexable, wordCount(post.body),
      sourceLinks.length, officialSources, links, '', post.canonicalUrl ?? url,
      clicks, impressions, impressions ? (clicks / impressions).toFixed(4) : '0.0000',
      weightedPosition.toFixed(2), action,
    ].map(csv).join(','));
  }

  fs.mkdirSync(path.join(process.cwd(), 'docs/seo/current'), { recursive: true });
  fs.writeFileSync(
    path.join(process.cwd(), 'docs/seo/current/blog-editorial-inventory.csv'),
    `${lines.join('\n')}\n`,
  );
  const verified = posts.filter((post) => normalizeReviewStatus(post.reviewStatus) === 'verified');
  const summary = {
    total_records: posts.length,
    published_records: posts.filter((post) => post.published === true).length,
    unpublished_records: posts.filter((post) => post.published !== true).length,
    indexable_records: verified.filter(
      (post) => post.published === true && post.noindex !== true,
    ).length,
    sitemap_records: verified.filter(
      (post) => post.published === true && post.noindex !== true,
    ).length,
    lawyer_verified_records: verified.length,
    lawyer_review_pending_records: posts.length - verified.length,
    outdated_records: posts.filter(
      (post) => post.reviewStatus === 'needs_update' || post.reviewStatus === 'outdated',
    ).length,
    withdrawn_records: posts.filter((post) => post.reviewStatus === 'withdrawn').length,
    legacy_reviewed_records: posts.filter((post) => post.reviewStatus === 'reviewed').length,
    generic_author_records: posts.filter(
      (post) => !post.author || post.author === 'Pineda y Asociados',
    ).length,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

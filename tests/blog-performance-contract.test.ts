import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  getPublishedPostDetailBySlug,
  getPublishedPostSummaries,
  publicBlogPostDetailSelection,
  publicBlogPostParamsSelection,
  publicBlogPostSummarySelection,
} from '@/lib/blog-db';
import {
  createBlogReadLoaders,
  getRelatedPostsFromSummaries,
  getTotalPages,
} from '@/lib/blog';
import {
  deriveArchiveMonths,
  deriveCategoryCounts,
  deriveFeaturedPosts,
  derivePopularPosts,
  deriveRecentPosts,
  toCardData,
} from '@/lib/blog-hub';
import { resolvePreviewBlogDataMode } from '@/lib/preview-blog-fixtures';
import type { BlogPostSummary, Post } from '@/data/blog/types';
import { parseCsv } from '@/lib/csv';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const detailPageSource = read('app/(public)/blog/[categoria]/[slug]/page.tsx');
const hubSource = read('app/(public)/blog/page.tsx');
const categorySource = read('app/(public)/blog/[categoria]/page.tsx');
const sitemapSource = read('lib/seo/sitemap.ts');
const feedSource = read('app/(public)/blog/feed.xml/route.ts');
const blogSource = read('lib/blog.ts');

async function withLimitedFixtures<T>(run: () => Promise<T>): Promise<T> {
  const previousMode = process.env.SEO_PREVIEW_BLOG_DATA_MODE;
  const previousEnvironment = process.env.VERCEL_ENV;
  process.env.SEO_PREVIEW_BLOG_DATA_MODE = 'limited-test-fixtures';
  delete process.env.VERCEL_ENV;
  try {
    return await run();
  } finally {
    if (previousMode === undefined) delete process.env.SEO_PREVIEW_BLOG_DATA_MODE;
    else process.env.SEO_PREVIEW_BLOG_DATA_MODE = previousMode;
    if (previousEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousEnvironment;
  }
}

describe('contrato de rendimiento de lecturas del blog', () => {
  it('separa proyecciones detail, summary y params', () => {
    expect(publicBlogPostDetailSelection).toHaveProperty('body');
    expect(publicBlogPostSummarySelection).not.toHaveProperty('body');
    expect(publicBlogPostSummarySelection).not.toHaveProperty('legalReviewNotes');
    expect(publicBlogPostSummarySelection).not.toHaveProperty('signatureCandidate');
    expect(Object.keys(publicBlogPostParamsSelection).sort()).toEqual(['category', 'slug']);
  });

  it('el snapshot summary conserva inventario y elimina contenido pesado', async () => {
    const summaries = await withLimitedFixtures(() => getPublishedPostSummaries());
    expect(summaries.length).toBeGreaterThan(0);
    expect(JSON.stringify(summaries)).not.toContain('"body":');
    expect(JSON.stringify(summaries)).not.toContain('legalReviewNotes');
    expect(JSON.stringify(summaries)).not.toContain('reviewedContentHash');
  });

  it('el detalle recupera exactamente un artículo con body', async () => {
    const summaries = await withLimitedFixtures(() => getPublishedPostSummaries());
    const detail = await withLimitedFixtures(
      () => getPublishedPostDetailBySlug(summaries[0].slug),
    );
    expect(detail?.body).toBeTruthy();
    expect(Array.isArray(detail)).toBe(false);
  });

  it('metadata y página comparten el mismo loader de detalle', () => {
    expect(detailPageSource.match(/getPostBySlug\(slug\)/g)).toHaveLength(2);
    expect(detailPageSource).toContain("import {\n  getAllPostParams,");
    expect(blogSource).toContain('getPostBySlug: cacheFn(dependencies.detail)');
  });

  it('deduplica detalle e inventario dentro del mismo alcance', async () => {
    const detail = vi.fn(async (slug: string) => ({ slug }) as unknown as Post);
    const summaries = vi.fn(async () => [] as BlogPostSummary[]);
    const memoize = ((fn: (...args: unknown[]) => unknown) => {
      const values = new Map<string, unknown>();
      return (...args: unknown[]) => {
        const key = JSON.stringify(args);
        if (!values.has(key)) values.set(key, fn(...args));
        return values.get(key);
      };
    }) as typeof import('react').cache;
    const loaders = createBlogReadLoaders(memoize, { detail, summaries });

    await Promise.all([
      loaders.getPostBySlug('uno'),
      loaders.getPostBySlug('uno'),
      loaders.getAllPosts(),
      loaders.getAllPosts(),
    ]);

    expect(detail).toHaveBeenCalledTimes(1);
    expect(summaries).toHaveBeenCalledTimes(1);
    await loaders.getPostBySlug('dos');
    expect(detail).toHaveBeenCalledTimes(2);
  });

  it('relacionados es puro, estable y no consulta internamente', () => {
    const summaries: BlogPostSummary[] = [
      summary('actual', 'penal', ['a'], '2026-04-01'),
      summary('b', 'penal', ['a'], '2026-03-01'),
      summary('a', 'penal', ['a'], '2026-03-01'),
      summary('c', 'familia', ['a'], '2026-05-01'),
    ];
    expect(getRelatedPostsFromSummaries(
      summaries,
      'actual',
      'penal',
      ['a'],
      3,
    ).map((post) => post.slug)).toEqual(['a', 'b', 'c']);
    expect(getRelatedPostsFromSummaries(
      summaries,
      'actual',
      'penal',
      ['sin-solape'],
      3,
    )).toEqual([]);
    expect(detailPageSource).not.toContain('async function getRelatedPosts(');
    expect(detailPageSource.match(/getAllPosts\(\)/g)).toHaveLength(1);
  });

  it('hub, categoría, sidebar, RSS y sitemap consumen summaries', () => {
    expect(hubSource).toContain('const allPosts = await getAllPosts()');
    expect(categorySource).toContain('await getPostsByCategory(categoria)');
    expect(detailPageSource).toContain('deriveCategoryCounts(allPosts)');
    expect(feedSource).toContain('await getAllPosts()');
    expect(sitemapSource).toContain('await getAllPosts()');
    for (const source of [hubSource, categorySource, detailPageSource, feedSource, sitemapSource]) {
      expect(source).not.toContain('getPublishedPosts(');
    }
  });

  it('static params usa exclusivamente slug y categoría', () => {
    expect(detailPageSource).toContain('const posts = await getAllPostParams()');
    expect(detailPageSource).not.toContain(
      'generateStaticParams() {\n  const posts = await getAllPosts()',
    );
  });

  it('conserva inventario, destacados, grid y paginación canónicos', async () => {
    const summaries = canonicalPublishedSummaries();
    const featured = deriveFeaturedPosts(summaries, 4);
    expect(summaries).toHaveLength(135);
    expect(featured).toHaveLength(4);
    expect(summaries.filter((post) => !new Set(featured.map((p) => p.slug)).has(post.slug)))
      .toHaveLength(131);
    expect(getTotalPages(summaries.slice(4), 12)).toBe(11);
    expect(deriveCategoryCounts(summaries).reduce((sum, item) => sum + item.count, 0))
      .toBe(135);
  });

  it('mantiene derivaciones de sidebar y payload mínimo', async () => {
    const summaries = canonicalPublishedSummaries();
    expect(derivePopularPosts(summaries, 5)).toHaveLength(5);
    expect(deriveRecentPosts(summaries, 5)).toHaveLength(5);
    expect(deriveArchiveMonths(summaries, 8).length).toBeGreaterThan(0);
    const payload = summaries.map(toCardData);
    expect(payload).toHaveLength(135);
    expect(JSON.stringify(payload)).not.toContain('"body":');
    expect(JSON.stringify(payload)).not.toContain('legalReviewNotes');
  });

  it('fixtures limitados no pueden aprobar una Preview canónica', () => {
    expect(() => resolvePreviewBlogDataMode({
      NODE_ENV: 'production',
      VERCEL_ENV: 'preview',
      SEO_PREVIEW_BLOG_DATA_MODE: 'limited-test-fixtures',
    })).toThrow(/solo se permite en tests/i);
  });
});

function canonicalPublishedSummaries(): BlogPostSummary[] {
  const matrix = parseCsv(read('docs/seo/current/blog-body-freeze-baseline.csv'));
  const [headers, ...rows] = matrix;
  const slugIndex = headers.indexOf('slug');
  const stateIndex = headers.indexOf('publication_state');
  const categoryIndex = headers.indexOf('category');
  return rows
    .filter((row) => row[stateIndex] === 'PUBLISHED')
    .map((row, index) => summary(
      row[slugIndex],
      row[categoryIndex],
      [],
      new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
    ));
}

function summary(
  slug: string,
  category: string,
  tags: string[],
  publishedAt: string,
): BlogPostSummary {
  return {
    slug,
    title: slug,
    description: slug,
    publishedAt,
    category,
    tags,
    author: 'Pineda y Asociados',
    readingTime: '5 min',
    featured: false,
    editoriallyIndexable: true,
  };
}

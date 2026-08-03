import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getLimitedTestBlogFixtures,
  resolvePreviewBlogDataMode,
} from '@/lib/preview-blog-fixtures';

afterEach(() => vi.unstubAllEnvs());

describe('fixtures públicos sanitizados de Preview', () => {
  it('usa database por defecto en Production', () => {
    expect(resolvePreviewBlogDataMode({ VERCEL_ENV: 'production' })).toBe('database');
  });

  it('obliga a declarar una fuente completa en Preview/staging', () => {
    expect(() => resolvePreviewBlogDataMode({ VERCEL_ENV: 'preview' })).toThrow(
      /requiere SEO_PREVIEW_BLOG_DATA_MODE/,
    );
    expect(resolvePreviewBlogDataMode({
      APP_ENV: 'staging',
      SEO_PREVIEW_BLOG_DATA_MODE: 'database',
    })).toBe('database');
  });

  it('prohíbe fixtures limitados en la Preview canónica', () => {
    expect(() => resolvePreviewBlogDataMode({
      VERCEL_ENV: 'preview',
      SEO_PREVIEW_BLOG_DATA_MODE: 'limited-test-fixtures',
    })).toThrow(/solo se permite en tests/);
  });

  it('cubren penal, laboral, familia y civil', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SEO_PREVIEW_BLOG_DATA_MODE', 'limited-test-fixtures');
    const fixtures = getLimitedTestBlogFixtures();
    expect(new Set(fixtures.map((fixture) => fixture.category))).toEqual(new Set([
      'derecho-penal',
      'derecho-laboral',
      'derecho-de-familia',
      'derecho-civil',
      'derecho-mercantil',
    ]));
  });

  it('incluyen pending y un verified inequívocamente no productivo', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('SEO_PREVIEW_BLOG_DATA_MODE', 'limited-test-fixtures');
    const fixtures = getLimitedTestBlogFixtures();
    expect(fixtures.some((fixture) => fixture.reviewStatus === 'pending')).toBe(true);
    const verified = fixtures.find((fixture) => fixture.reviewStatus === 'verified');
    expect(verified?.slug).toBe('fixture-preview-articulo-verificado');
    expect(verified?.title).toMatch(/Fixture Preview/);
    expect(verified?.legalReviewNotes).toMatch(/no equivale a revisión jurídica/i);
  });
});

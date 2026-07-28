import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getPreviewBlogFixtures,
  previewFixturesEnabled,
} from '@/lib/preview-blog-fixtures';

afterEach(() => vi.unstubAllEnvs());

describe('fixtures públicos sanitizados de Preview', () => {
  it('nunca se habilitan en Production', () => {
    expect(previewFixturesEnabled({ VERCEL_ENV: 'production' })).toBe(false);
  });

  it('se habilitan exclusivamente en Preview/staging', () => {
    expect(previewFixturesEnabled({ VERCEL_ENV: 'preview' })).toBe(true);
    expect(previewFixturesEnabled({ APP_ENV: 'staging' })).toBe(true);
  });

  it('cubren penal, laboral, familia y civil', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const fixtures = getPreviewBlogFixtures();
    expect(new Set(fixtures.map((fixture) => fixture.category))).toEqual(new Set([
      'derecho-penal',
      'derecho-laboral',
      'derecho-de-familia',
      'derecho-civil',
      'derecho-mercantil',
    ]));
  });

  it('incluyen pending y un verified inequívocamente no productivo', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const fixtures = getPreviewBlogFixtures();
    expect(fixtures.some((fixture) => fixture.reviewStatus === 'pending')).toBe(true);
    const verified = fixtures.find((fixture) => fixture.reviewStatus === 'verified');
    expect(verified?.slug).toBe('fixture-preview-articulo-verificado');
    expect(verified?.title).toMatch(/Fixture Preview/);
    expect(verified?.legalReviewNotes).toMatch(/no equivale a revisión jurídica/i);
  });
});

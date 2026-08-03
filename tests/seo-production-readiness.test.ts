import { describe, expect, it } from 'vitest';
import {
  requiresVerifiedEditorialStatus,
  resolveEditorialIndexingMode,
} from '@/lib/editorial-cutover';
import { calculateReadiness } from '@/lib/production-readiness';

describe('editorial production cutover', () => {
  it('mantiene Production en modo legacy sin doble aprobación', () => {
    expect(resolveEditorialIndexingMode({ VERCEL_ENV: 'production' })).toBe('legacy-preserve');
    expect(resolveEditorialIndexingMode({
      VERCEL_ENV: 'production',
      SEO_EDITORIAL_CUTOVER: 'approved',
    })).toBe('legacy-preserve');
  });

  it('activa el contrato estricto solo con aprobación trazable', () => {
    expect(requiresVerifiedEditorialStatus({
      VERCEL_ENV: 'production',
      SEO_EDITORIAL_CUTOVER: 'approved',
      SEO_EDITORIAL_CUTOVER_APPROVAL_ID: 'SEO-2026-001',
    })).toBe(true);
  });

  it('Preview valida siempre el contrato estricto', () => {
    expect(resolveEditorialIndexingMode({ VERCEL_ENV: 'preview' })).toBe('strict-review');
  });

  it('reconoce la revisión institucional histórica sin exigir abogado individual', () => {
    const { summary, failures } = calculateReadiness([{
      slug: 'institucional',
      category: 'derecho-penal',
      author: 'Pineda y Asociados',
      body: '<p>Versión histórica revisada.</p>',
      review_status: 'pending',
      published: true,
      noindex: false,
      canonical_url: null,
    }], 1);
    expect(summary.firm_reviewed).toBe(1);
    expect(summary.indexable_after_cutover).toBe(1);
    expect(summary.urls_removed).toBe(0);
    expect(failures).toEqual([]);
  });

  it('excluye una propuesta pending_resignature sin retirar la versión histórica', () => {
    const { summary } = calculateReadiness([
      {
        slug: 'verificado',
        category: 'derecho-penal',
        author: 'Danilo Pineda Maradiaga',
        body: '<p>Versión firmada.</p>',
        review_status: 'verified',
        reviewed_by: 'Danilo Pineda Maradiaga',
        reviewed_at: '2026-07-01',
        published: true,
        noindex: false,
        canonical_url: null,
      },
      {
        slug: 'propuesta',
        category: 'derecho-penal',
        author: 'Danilo Pineda Maradiaga',
        body: '<p>Versión nueva.</p>',
        review_status: 'pending_resignature',
        published: true,
        noindex: false,
        canonical_url: null,
      },
    ], 1);
    expect(summary.indexable_after_cutover).toBe(1);
  });
});

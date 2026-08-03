/**
 * Tests de política comercial única (Evaluación inicial confidencial).
 *
 * Verifica que:
 *   - existe la formulación canónica neutra;
 *   - el escáner detecta las variantes prohibidas;
 *   - ninguna superficie pública ejecutable contiene claims de gratuidad no
 *     confirmados.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EVALUACION_INICIAL_CONFIDENCIAL,
  scanProhibitedClaims,
  assertNoProhibitedClaims,
  PROHIBITED_CONSULTATION_CLAIM_PATTERNS,
} from '@/lib/marketing-policy';
import { PUBLIC_CLAIMS } from '@/lib/public-claims';

describe('formulación canónica', () => {
  it('existe una única formulación comercial neutral', () => {
    expect(EVALUACION_INICIAL_CONFIDENCIAL).toBe('Evaluación inicial confidencial');
  });

  it('el claim de gratuidad no está confirmado ni es público', () => {
    const claim = PUBLIC_CLAIMS.find((c) => c.key === 'firstConsultationFree');
    expect(claim?.value).toBeNull();
    expect(claim?.status).toBe('unconfirmed');
    expect(claim?.public).toBe(false);
  });
});

describe('escáner de variantes prohibidas', () => {
  const forbidden = [
    'consulta gratuita',
    'consulta sin costo',
    'primera consulta gratis',
    'primera consulta sin costo',
    'primera consulta es gratuita',
    'evaluación gratuita',
    'evaluación inicial sin costo',
    'consulta inicial sin costo',
    'la primera consulta de evaluación no tiene costo',
    'Consulta confidencial y sin compromiso',
    'primera consulta confidencial y sin compromiso',
    'Evaluamos su caso sin costo y le damos un presupuesto',
    'Primera evaluación sin compromiso',
  ];

  it.each(forbidden)('detecta la variante: %s', (text) => {
    expect(scanProhibitedClaims(text).length).toBeGreaterThan(0);
    expect(() => assertNoProhibitedClaims(text)).toThrow(/marketing-policy/);
  });

  it('permite la formulación canónica', () => {
    expect(scanProhibitedClaims(EVALUACION_INICIAL_CONFIDENCIAL)).toHaveLength(0);
  });

  it('permite textos jurídicos legítimos sobre trámites públicos', () => {
    expect(scanProhibitedClaims(
      'La asistencia de la Procuraduría de Trabajo es gratuita para los trabajadores.',
    )).toHaveLength(0);
  });

  it('tiene un número finito y acotado de patrones', () => {
    expect(PROHIBITED_CONSULTATION_CLAIM_PATTERNS.length).toBeGreaterThan(0);
  });
});

describe('superficies públicas sin claims no confirmados', () => {
  const files = [
    'lib/site.ts',
    'lib/faq-db.ts',
    'data/faqs-hubs.ts',
    'data/landings-locales.ts',
    'lib/lead-magnet-pdf.tsx',
    'lib/blog-generated-cta.ts',
    'lib/page-content-db.ts',
    'data/pilar/faqs-guia.ts',
    'components/marketing/consultation-cta.tsx',
    'components/marketing/cta-spain.tsx',
    'components/marketing/lead-magnet-cta.tsx',
    'components/marketing/public-footer.tsx',
    'components/marketing/solicitar-consulta-form.tsx',
    'app/(public)/page.tsx',
    'app/(public)/despacho/page.tsx',
    'app/(public)/preguntas-frecuentes/page.tsx',
  ];

  it.each(files)('%s no contiene claims de gratuidad no autorizados', (file) => {
    const content = readFileSync(file, 'utf8');
    const matches = scanProhibitedClaims(content);
    expect(matches).toEqual([]);
  });
});

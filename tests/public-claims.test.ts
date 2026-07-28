import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FOUNDER_PROFILE,
  THANIA_PROFILE,
  founderSchema,
  organizationSchema,
  site,
} from '@/lib/site';

const publicClaimFiles = [
  'app/(public)/page.tsx',
  'app/(public)/despacho/page.tsx',
  'app/(public)/derecho-penal/page.tsx',
  'app/(public)/abogado-penalista-nacaome/page.tsx',
  'app/(public)/abogado-penalista-choluteca/page.tsx',
  'app/(public)/blog/[categoria]/[slug]/page.tsx',
  'app/(public)/servicios-juridicos/[slug]/page.tsx',
  'components/marketing/public-footer.tsx',
  'components/marketing/trust-bar.tsx',
  'components/marketing/live-widgets.tsx',
  'lib/site.ts',
].map((file) => readFileSync(file, 'utf8')).join('\n');

describe('afirmaciones institucionales confirmadas por el titular', () => {
  it('conserva la antigüedad y la colegiación confirmadas', () => {
    expect(publicClaimFiles).toMatch(/más de 15 años|\+15 años/i);
    expect(publicClaimFiles).toMatch(/registro profesional vigente/i);
  });

  it('publica el año y los fundadores confirmados en Organization', () => {
    const organization = organizationSchema() as Record<string, unknown>;
    expect(organization.foundingDate).toBe('2010');
    expect(organization.founder).toEqual([
      { '@id': `${site.url}/#danilo-pineda-maradiaga` },
      { '@id': `${site.url}/#thania` },
    ]);
  });

  it('mantiene la condición fundacional en los perfiles del equipo', () => {
    expect(FOUNDER_PROFILE.description).not.toMatch(/\b\d+\+?\s*años|más de \d+\s*años/i);
    expect(FOUNDER_PROFILE.description).toMatch(/abogado penalista y socio director/i);
    expect(THANIA_PROFILE.jobTitle).toBe('Abogada · Socia fundadora');
    expect(THANIA_PROFILE.description).toMatch(/fundadora/i);
  });

  it('usa un identificador de persona descriptivo para el socio director', () => {
    const person = founderSchema() as Record<string, unknown>;
    expect(person['@id']).toBe(`${site.url}/#danilo-pineda-maradiaga`);
  });

  it('no atribuye la condición de notario, que no fue confirmada', () => {
    expect(publicClaimFiles).not.toMatch(/notario colegiado/i);
  });
});

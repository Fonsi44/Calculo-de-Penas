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

describe('afirmaciones públicas pendientes de verificación', () => {
  it('no publica una antigüedad concreta ni vigencia registral incondicional', () => {
    expect(publicClaimFiles).not.toMatch(/más de 15 años|\+15 años/i);
    expect(publicClaimFiles).not.toMatch(/registro profesional vigente/i);
  });

  it('no publica año ni fundadores en Organization hasta disponer de evidencia', () => {
    const organization = organizationSchema() as Record<string, unknown>;
    expect(organization.foundingDate).toBeUndefined();
    expect(organization.founder).toBeUndefined();
  });

  it('mantiene perfiles de equipo sin atribuir condición fundacional', () => {
    expect(FOUNDER_PROFILE.description).not.toMatch(/más de 15 años|colegiado/i);
    expect(THANIA_PROFILE.jobTitle).toBe('Abogada · Socia');
    expect(THANIA_PROFILE.description).not.toMatch(/fundadora/i);
  });

  it('usa un identificador de persona descriptivo para el socio director', () => {
    const person = founderSchema() as Record<string, unknown>;
    expect(person['@id']).toBe(`${site.url}/#danilo-pineda-maradiaga`);
  });
});

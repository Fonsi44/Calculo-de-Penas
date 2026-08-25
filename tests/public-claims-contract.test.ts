import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FOUNDER_PROFILE,
  LAWYER_PROFILES,
  legalServiceSchema,
  organizationSchema,
  founderSchema,
  site,
} from '@/lib/site';
import {
  PUBLIC_SERVICE_CATALOG,
  publicServiceOfferCatalog,
} from '@/lib/public-service-catalog';
import { PUBLIC_CLAIMS } from '@/lib/public-claims';

const hubSource = readFileSync(
  join(process.cwd(), 'app/(public)/servicios-juridicos/page.tsx'),
  'utf8',
);
const faqSource = readFileSync(join(process.cwd(), 'data/faqs-hubs.ts'), 'utf8');
const footerSource = readFileSync(
  join(process.cwd(), 'components/marketing/public-footer.tsx'),
  'utf8',
);

describe('contrato de claims públicos y entidades', () => {
  const legal = legalServiceSchema();
  const organization = organizationSchema();

  it.each([
    'priceRange',
    'paymentAccepted',
    'currenciesAccepted',
    'numberOfEmployees',
  ])('no emite el campo comercial no confirmado %s', (property) => {
    expect(legal).not.toHaveProperty(property);
    expect(organization).not.toHaveProperty(property);
    expect(PUBLIC_CLAIMS.find((claim) => claim.key === property)?.public).toBe(false);
  });

  it('no infiere plantilla desde los tres perfiles', () => {
    expect(LAWYER_PROFILES).toHaveLength(3);
    expect(JSON.stringify([legal, organization])).not.toContain('numberOfEmployees');
  });

  it('separa X personal de las entidades corporativas', () => {
    expect(legal.sameAs).not.toContain(site.social.x);
    expect(organization.sameAs).not.toContain(site.social.x);
    expect(founderSchema().sameAs).toContain(site.social.x);
    expect(footerSource).toContain(
      'Perfil personal de X de Danilo Pineda Maradiaga',
    );
    expect(footerSource).not.toContain(
      'aria-label={`Perfil de X de ${site.name}`}',
    );
  });

  it('Google Business aparece solo en entidades corporativas', () => {
    expect(legal.sameAs).toContain(site.googleBusiness);
    expect(organization.sameAs).toContain(site.googleBusiness);
    expect(founderSchema().sameAs).not.toContain(site.googleBusiness);
  });

  it('sameAs está deduplicado, sin tracking y usa HTTPS', () => {
    const trackingParameters = ['fbclid', 'gclid', 'dclid', 'msclkid', 'mc_cid', 'mc_eid'];
    for (const urls of [legal.sameAs as string[], organization.sameAs as string[], founderSchema().sameAs]) {
      expect(new Set(urls).size).toBe(urls.length);
      for (const url of urls) {
        const parsed = new URL(url);
        expect(parsed.protocol).toBe('https:');
        expect(parsed.hash).toBe('');
        expect([...parsed.searchParams.keys()].some(
          (key) => key.startsWith('utm_') || trackingParameters.includes(key),
        )).toBe(false);
      }
    }
    expect(organization.sameAs).toContain(site.social.facebook);
    expect(new URL(site.social.facebook!).searchParams.get('id')).toBe('61590934058125');
  });

  it('OfferCatalog deriva exactamente del catálogo visible', () => {
    const offerCatalog = legal.hasOfferCatalog as ReturnType<typeof publicServiceOfferCatalog>;
    expect(offerCatalog.itemListElement).toHaveLength(PUBLIC_SERVICE_CATALOG.length);
    expect(offerCatalog.itemListElement.map((offer) => offer.itemOffered.name))
      .toEqual(PUBLIC_SERVICE_CATALOG.map((item) => item.name));
    expect(offerCatalog.itemListElement.map((offer) => offer.itemOffered.url))
      .toEqual(PUBLIC_SERVICE_CATALOG.map((item) => `${site.url}${item.href}`));
  });

  it('catálogo tiene 14 páginas únicas publicadas', () => {
    expect(PUBLIC_SERVICE_CATALOG).toHaveLength(14);
    expect(new Set(PUBLIC_SERVICE_CATALOG.map((item) => item.slug)).size).toBe(14);
    expect(new Set(PUBLIC_SERVICE_CATALOG.map((item) => item.href)).size).toBe(14);
    expect(PUBLIC_SERVICE_CATALOG.every((item) => item.published)).toBe(true);
  });

  it('la UI, buscador e ItemList consumen la fuente canónica', () => {
    expect(hubSource).toContain('const areas = PUBLIC_SERVICE_CATALOG');
    expect(hubSource).toContain('areas.map((area');
    expect(hubSource).toContain('itemListElement: areas.map');
    expect(hubSource).toContain('buildJuridicosCatalog');
    expect(hubSource).not.toContain('getAreasUnified');
  });

  it('responsables confirmados coinciden con perfiles canónicos', () => {
    const profileNames = new Set(LAWYER_PROFILES.map((profile) => profile.name));
    const assigned = PUBLIC_SERVICE_CATALOG.filter((item) => item.individualResponsible);
    expect(assigned).toHaveLength(6);
    for (const item of assigned) {
      expect(profileNames.has(item.individualResponsible!)).toBe(true);
      expect(item.responsibilityEvidence).toBeTruthy();
      expect(item.responsibleProfileHref).toMatch(/^\/equipo\//);
    }
  });

  it('áreas sin responsable no muestran especialistas automáticos', () => {
    expect(PUBLIC_SERVICE_CATALOG.filter((item) => !item.individualResponsible)).toHaveLength(8);
    expect(hubSource).not.toContain('el profesional asignado según la materia');
    expect(hubSource).not.toContain('Cada caso lo dirige el abogado especialista');
  });

  it('copy expresa coordinación como posibilidad y no garantiza punto único', () => {
    expect(hubSource).toContain('el equipo puede coordinar su análisis internamente');
    expect(hubSource).not.toContain('el cliente tiene un único punto de contacto');
    expect(faqSource).not.toContain('Cada área la dirige un especialista');
    expect(faqSource).not.toContain('no duplica gestiones');
  });

  it('conserva fundación y fundadores; la gratuidad de la consulta NO está confirmada', () => {
    expect(organization.foundingDate).toBe('2010');
    expect(organization.founder).toEqual([
      { '@id': `${site.url}/#danilo-pineda-maradiaga` },
      { '@id': `${site.url}/#thania-marlene-paz` },
    ]);
    // Decisión 2026-08-03: el propietario no ha confirmado que todas las
    // consultas sean gratuitas. El claim pasa a unconfirmed y no público.
    const freeClaim = PUBLIC_CLAIMS.find((claim) => claim.key === 'firstConsultationFree');
    expect(freeClaim?.value).toBeNull();
    expect(freeClaim?.status).toBe('unconfirmed');
    expect(freeClaim?.public).toBe(false);
  });

  it('knowsAbout institucional coincide con el catálogo', () => {
    expect(legal.knowsAbout).toEqual(PUBLIC_SERVICE_CATALOG.map((item) => item.name));
    expect(organization.knowsAbout).toEqual(PUBLIC_SERVICE_CATALOG.map((item) => item.name));
  });

  it('áreas personales siguen limitadas a perfiles confirmados', () => {
    expect(founderSchema().knowsAbout).toContain('Derecho Penal');
    expect(founderSchema().knowsAbout.length).toBeLessThan(PUBLIC_SERVICE_CATALOG.length);
    expect(FOUNDER_PROFILE.description).not.toMatch(/casos ganados|porcentaje de éxito/i);
  });

  it('no publica garantías de resultado ni experiencia personal inventada', () => {
    const sources = `${hubSource}\n${faqSource}`;
    expect(sources).not.toMatch(/garantizamos? (?:el|un) resultado/i);
    expect(sources).not.toMatch(/\d+ años de experiencia de (?:Danilo|Thania|Emil)/i);
  });
});

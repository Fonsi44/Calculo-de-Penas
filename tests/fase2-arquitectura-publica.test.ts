import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { categoriasFaq, totalPreguntas } from '@/data/faq';
import { landingsLocales } from '@/data/landings-locales';
import { parseCsv } from '@/lib/csv';
import { LAWYER_PROFILES, site } from '@/lib/site';
import { sitemapXml } from '@/lib/sitemap-xml';
import { areasGenerales, hubPenal } from '@/data/areas-juridicas';
import { PUBLIC_SERVICE_CATALOG } from '@/lib/public-service-catalog';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Fase 2 — contratos de arquitectura pública', () => {
  it('mantiene la home como URL dominante para la intención comercial de Nacaome', () => {
    const home = read('app/(public)/page.tsx');
    expect(site.tagline).toBe('Abogados en Nacaome, Valle | Pineda y Asociados');
    expect(site.description).toBe(
      'Abogados en Nacaome para defensa penal y asuntos de familia, laborales, civiles y mercantiles. Atención directa y presupuesto por escrito.',
    );
    expect(home).toContain('Defensa penal y asesoría jurídica en Nacaome y Honduras');
  });

  it('separa la intención comercial de la guía informativa sobre elegir abogado', () => {
    const metadata = read('data/blog/blog-metadata-overrides.ts');
    const generatedCta = read('lib/blog-generated-cta.ts');
    const redirects = read('next.config.ts');
    expect(metadata).toContain(
      'Cómo Elegir Abogado en Nacaome: 10 Criterios antes de Contratar',
    );
    expect(generatedCta).toContain('consultar con un abogado en Nacaome');
    expect(generatedCta).toContain('href="/"');
    expect(redirects).toMatch(
      /source:\s*'\/blog\/practica-legal\/abogados-en-nacaome',\s*destination:\s*'\/abogados-en-nacaome'/,
    );
  });

  it('mantiene la landing de Nacaome como información operativa secundaria', () => {
    const landing = landingsLocales.find((item) => item.slug === 'nacaome');
    expect(landing?.title).toBe('Oficina en Nacaome | Ubicación y Atención Presencial');
    expect(landing?.heroTitle).toBe('Sede en Nacaome: dirección, horario y visita');
    expect(landing?.description).toMatch(/Dirección, referencia de llegada, horario/);
    expect(landing?.title).not.toMatch(/^Abogados en Nacaome/i);
    expect(landing?.heroTitle).not.toMatch(/^Abogados en Nacaome/i);
    const queryMap = read('docs/seo/current/query-url-map.csv');
    expect(queryMap).toContain('"abogados en Nacaome","https://www.pinedayasociadoshn.com/"');
    expect(queryMap).toContain('PRIMARY_COMMERCIAL');
    expect(queryMap).toContain('SECONDARY_OPERATIONAL');
    expect(queryMap).toContain('PRIMARY_INFORMATIONAL');
  });

  it('enlaza los tres perfiles desde home, despacho y áreas', () => {
    const home = read('app/(public)/page.tsx');
    const despacho = read('app/(public)/despacho/page.tsx');
    const areas = read('app/(public)/servicios-juridicos/[slug]/page.tsx');
    expect(home).toContain('LAWYER_PROFILES.map');
    expect(home).toContain('href={`/equipo/${profile.slug}`}');
    for (const profile of LAWYER_PROFILES) {
      expect(despacho).toContain(`/equipo/${profile.slug}`);
      expect(areas).toContain(`/equipo/${profile.slug}`);
    }
  });

  it('la FAQ conserva todas las preguntas actuales y asigna destino a cada una', () => {
    expect(totalPreguntas).toBeGreaterThanOrEqual(73);
    const inventory = parseCsv(read('docs/seo/current/faq-inventory.csv'));
    const [header, ...rows] = inventory;
    const targetIndex = header.indexOf('target_url');
    expect(rows).toHaveLength(totalPreguntas);
    expect(rows.every((row) => row[targetIndex] && row[targetIndex] !== 'HUMAN_REVIEW')).toBe(true);
  });

  it('la FAQ general contiene entre 10 y 15 preguntas corporativas sin duplicados', () => {
    const general = categoriasFaq.find((category) => category.slug === 'bufete-honorarios');
    expect(general).toBeDefined();
    expect(general!.preguntas.length).toBeGreaterThanOrEqual(10);
    expect(general!.preguntas.length).toBeLessThanOrEqual(15);
    const normalized = general!.preguntas.map((faq) => faq.pregunta.trim().toLowerCase());
    expect(new Set(normalized).size).toBe(normalized.length);
  });

  it('ninguna landing distinta de Nacaome declara sede física', () => {
    expect(landingsLocales.filter((landing) => landing.sedeFisica)).toHaveLength(1);
    expect(landingsLocales.find((landing) => landing.sedeFisica)?.ciudad).toBe('Nacaome');
    for (const landing of landingsLocales.filter((item) => !item.sedeFisica)) {
      expect(landing.servedFrom).toMatch(/Nacaome/i);
    }
  });

  it('el formulario advierte contra el envío de información sensible', () => {
    const contact = read('app/(public)/solicitar-consulta/page.tsx');
    expect(contact).toContain('No envíe confesiones ni documentos sensibles');
    expect(contact).toContain('secreto profesional');
    expect(contact).not.toMatch(/Legal Gratuita|Confidencial · Sin costo/);
  });

  it('publica sitemap index y segmentos XML reales (200, sin redirects)', () => {
    const robots = read('app/robots.ts');
    expect(robots).toContain('/sitemap.xml');
    expect(read('app/sitemap.xml/route.ts')).toContain('sitemapIndexResponse');
    for (const name of ['pages', 'services', 'blog', 'authors', 'local']) {
      const route = read(`app/sitemap-${name}.xml/route.ts`);
      expect(route).not.toContain('legacySitemapRedirectResponse');
      expect(route).toContain('sitemapResponse');
    }
    const xml = sitemapXml([{
      url: `${site.url}/equipo/danilo-pineda-maradiaga?x=1&y=2`,
      changeFrequency: 'monthly',
      priority: 0.8,
    }]);
    expect(xml).toContain('&amp;');
    expect(xml).toContain('<priority>0.8</priority>');
  });

  it('las seis áreas prioritarias exponen la arquitectura editorial completa', () => {
    const areas = [
      hubPenal,
      ...[
        'derecho-de-familia',
        'derecho-laboral',
        'derecho-civil-y-notarial',
        'derecho-mercantil-empresarial',
        'derecho-administrativo-y-servicio-civil',
      ].map((slug) => areasGenerales.find((area) => area.slug === slug)!),
    ];
    expect(areas).toHaveLength(6);
    for (const area of areas) {
      expect(area.respuestaDirecta).toBeTruthy();
      expect(area.documentosIniciales?.items.length).toBeGreaterThanOrEqual(5);
      expect(area.proceso?.pasos.length).toBeGreaterThanOrEqual(6);
      expect(area.faqs.length).toBeGreaterThanOrEqual(2);
      expect(area.fuentesGenerales?.length).toBeGreaterThanOrEqual(2);
      expect(area.ctaContextual?.href).toContain('/solicitar-consulta');
    }
  });

  it('las tarjetas centrales identifican responsable y CTA específico', () => {
    const services = read('app/(public)/servicios-juridicos/page.tsx');
    for (const profile of LAWYER_PROFILES) {
      expect(PUBLIC_SERVICE_CATALOG.some(
        (item) => item.individualResponsible === profile.name,
      )).toBe(true);
    }
    expect(services).toContain('responsible={area.individualResponsible}');
    for (const label of [
      'Ver servicios de defensa penal',
      'Consultar asuntos de familia',
      'Revisar un conflicto laboral',
      'Revisar contrato, propiedad o herencia',
      'Solicitar revisión mercantil',
      'Consultar un procedimiento administrativo',
    ]) {
      expect(services).toContain(label);
    }
  });
});

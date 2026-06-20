/**
 * Tests de protección SEO y de rutas privadas.
 *
 * Cubre los hallazgos ME-TEST-01 de la auditoría: verificar que ninguna ruta
 * privada (/intranet, /calculadora, /casos, /cp, /delitos, /atajos, /admin, /api)
 * se filtra como pública en el proxy, en robots.txt o en el JSON-LD base.
 *
 * Estos tests NO requieren DB: trabajan sobre las constantes y funciones puras
 * de proxy.ts, app/robots.ts (vía site.noindex=false), app/sitemap.ts
 * (constantes estáticas) y lib/site.ts (schemas).
 */
import { describe, it, expect } from 'vitest';
import { isPublicApiPath, isPublicPagePath } from '@/proxy';
import { legalServiceSchema, organizationSchema, websiteSchema, site } from '@/lib/site';
import { areaSchemas, faqPageSchema } from '@/lib/schemas/legal-page';
import robotsFn from '@/app/robots';
import { PUBLIC_ROUTES, THIN_POST_SLUGS } from '@/app/sitemap';

// Rutas que NUNCA deben ser públicas, indexables ni enlazadas (AGENTS.md reglas 17-19).
const PRIVATE_PREFIXES = ['/intranet/', '/admin/', '/calculadora', '/casos/', '/cp/', '/delitos/', '/atajos'];

const PRIVATE_PAGE_PATHS = [
  '/intranet',
  '/intranet/admin',
  '/intranet/dashboard',
  '/intranet/calculadora',
  '/calculadora',
  '/casos',
  '/casos/123',
  '/cp',
  '/cp/1',
  '/delitos',
  '/delitos/abc',
  '/atajos',
  '/admin',
];

interface RobotsRule {
  userAgent: string;
  allow?: string | string[];
  disallow?: string | string[];
}

describe('proxy.ts — clasificación de rutas', () => {
  it('las rutas privadas de páginas NO se clasifican como públicas', () => {
    for (const p of PRIVATE_PAGE_PATHS) {
      expect(isPublicPagePath(p), `${p} no debería ser página pública`).toBe(false);
    }
  });

  it('las rutas /api privadas NO se clasifican como API pública', () => {
    const privateApis = ['/api/calcular', '/api/admin/blog', '/api/seed', '/api/casos', '/api/calculos'];
    for (const p of privateApis) {
      expect(isPublicApiPath(p), `${p} no debería ser API pública`).toBe(false);
    }
  });

  it('las rutas /api públicas SÍ se clasifican como tal', () => {
    const publicApis = ['/api/health', '/api/whatsapp', '/api/delitos/count', '/api/indexnow-key', '/api/contacto'];
    for (const p of publicApis) {
      expect(isPublicApiPath(p), `${p} debería ser API pública`).toBe(true);
    }
  });

  it('las páginas públicas conocidas SÍ se clasifican como tal', () => {
    const publicPages = ['/', '/blog', '/despacho', '/servicios-juridicos', '/derecho-penal', '/preguntas-frecuentes'];
    for (const p of publicPages) {
      expect(isPublicPagePath(p), `${p} debería ser página pública`).toBe(true);
    }
  });
});

describe('app/sitemap.ts — sin rutas privadas en PUBLIC_ROUTES', () => {
  it('PUBLIC_ROUTES no contiene ninguna ruta privada', () => {
    for (const route of PUBLIC_ROUTES) {
      for (const prefix of PRIVATE_PREFIXES) {
        expect(
          route.path.startsWith(prefix),
          `PUBLIC_ROUTES contiene ruta privada: ${route.path}`,
        ).toBe(false);
      }
    }
  });

  it('THIN_POST_SLUGS es un Set no vacío (mitigación activa)', () => {
    expect(THIN_POST_SLUGS).toBeInstanceOf(Set);
    expect(THIN_POST_SLUGS.size).toBeGreaterThan(0);
  });

  it('PUBLIC_ROUTES tiene prioridades válidas (0-1)', () => {
    for (const route of PUBLIC_ROUTES) {
      expect(route.priority).toBeGreaterThanOrEqual(0);
      expect(route.priority).toBeLessThanOrEqual(1);
    }
  });
});

describe('app/robots.ts — bloquea rutas privadas y bots de IA', () => {
  // site.noindex es false en test (no hay NEXT_PUBLIC_NOINDEX=true), así que
  // robots() devuelve la regla de producción.
  const robots = robotsFn();
  const rules: RobotsRule[] = Array.isArray(robots.rules) ? (robots.rules as RobotsRule[]) : [robots.rules as RobotsRule];
  const wildcardRule = rules.find((r) => r.userAgent === '*');

  const asArray = (v: string | string[] | undefined): string[] =>
    Array.isArray(v) ? v : v ? [v] : [];

  it('la regla * bloquea /intranet/, /api/, /login (rutas privadas)', () => {
    expect(wildcardRule).toBeDefined();
    const disallow = asArray(wildcardRule?.disallow);
    for (const blocked of ['/intranet/', '/api/', '/login']) {
      expect(disallow, `debería bloquear ${blocked}`).toContain(blocked);
    }
  });

  it('la regla * NO bloquea /_next/ (assets de render necesarios para Googlebot)', () => {
    // SEO técnico (Jun 2026): /_next/ contiene el CSS y JS de Next.js que
    // Googlebot necesita para renderizar la SPA/RSC. Bloquearlo produce
    // "Disallowed internal resources" y degrada el rendering service.
    expect(wildcardRule).toBeDefined();
    const disallow = asArray(wildcardRule?.disallow);
    expect(disallow, '/_next/ NO debe bloquearse').not.toContain('/_next/');
  });

  it('la regla * NO bloquea rutas públicas (allow: /)', () => {
    expect(wildcardRule?.allow).toEqual('/');
  });

  it('bloquea bots de IA (GPTBot, ClaudeBot, PerplexityBot, CCBot)', () => {
    const blockedBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'CCBot', 'anthropic-ai'];
    for (const bot of blockedBots) {
      const rule = rules.find((r) => r.userAgent === bot);
      expect(rule, `debería tener regla para ${bot}`).toBeDefined();
      expect(asArray(rule?.disallow)).toEqual(['/']);
    }
  });

  it('declara el sitemap', () => {
    expect(robots.sitemap).toBe(`${site.url}/sitemap.xml`);
  });
});

describe('lib/site.ts — JSON-LD principal válido', () => {
  it('legalServiceSchema tiene campos obligatorios', () => {
    const s = legalServiceSchema();
    expect(s['@context']).toBe('https://schema.org');
    expect(s['@type']).toContain('LegalService');
    expect(s['@type']).toContain('LocalBusiness');
    expect(s.name).toBe(site.name);
    expect(s.telephone).toBe(site.phone);
    expect(s.url).toBe(site.url);
    const address = s.address as Record<string, unknown>;
    expect(address.addressCountry).toBe('HN');
    const geo = s.geo as Record<string, unknown>;
    expect(geo['@type']).toBe('GeoCoordinates');
    expect(Array.isArray(s.knowsAbout)).toBe(true);
    expect((s.knowsAbout as unknown[]).length).toBeGreaterThan(0);
  });

  it('organizationSchema tiene contactPoint y address', () => {
    const s = organizationSchema();
    expect(s['@type']).toBe('Organization');
    expect(s.name).toBe(site.name);
    expect(Array.isArray(s.contactPoint)).toBe(true);
    expect((s.contactPoint as unknown[]).length).toBeGreaterThan(0);
    const address = s.address as Record<string, unknown>;
    expect(address.addressLocality).toBe(site.address.city);
  });

  it('websiteSchema referencia al publisher (Organization)', () => {
    // Convención Schema.org: el publisher de un WebSite es la Organization.
    // Antes apuntaba a LegalService (válido pero inusual y dificultaba la
    // vinculación entidad→sitio en el Knowledge Graph).
    const s = websiteSchema();
    expect(s['@type']).toBe('WebSite');
    expect(s.url).toBe(site.url);
    const publisher = s.publisher as Record<string, unknown>;
    expect(publisher['@id']).toBe(`${site.url}/#organization`);
  });

  it('organizationSchema incluye image (necesaria para Knowledge Graph)', () => {
    const s = organizationSchema();
    expect(s.image).toBeDefined();
    expect(String(s.image)).toMatch(/^https:\/\//);
  });

  it('sameAs incluye redes sociales y Google Business Profile configurados', () => {
    const s = legalServiceSchema();
    // googleBusiness siempre tiene valor por defecto, así que sameAs debe existir.
    expect(Array.isArray(s.sameAs)).toBe(true);
    expect((s.sameAs as unknown[]).length).toBeGreaterThan(0);
    // Verifica que Google Business Profile esté incluido
    expect(s.sameAs).toContain(site.googleBusiness);
  });
});

describe('SEO on-page — home page (página raíz)', () => {
  // Valores por defecto definidos en getEditablePagesMeta() de lib/page-content-db.ts.
  const H1_DEFAULT = 'Defensa penal y asesoría jurídica en Nacaome y Honduras';
  const SUBTITLE_DEFAULT = 'Defensa penal y asesoría jurídica integral de la mano de abogados con presencia activa en los juzgados de Nacaome, Valle y todo Honduras. En Pineda y Asociados recibirá comunicación clara y un equipo coordinado en cada rama del derecho.';
  const CHECK2_DEFAULT = 'Atención directa de abogados en Nacaome';

  it('el H1 por defecto contiene "defensa penal" y "asesoría jurídica" de forma natural', () => {
    expect(H1_DEFAULT.toLowerCase()).toContain('defensa penal');
    expect(H1_DEFAULT.toLowerCase()).toContain('asesoría jurídica');
  });

  it('el H1 por defecto menciona Nacaome y Honduras', () => {
    expect(H1_DEFAULT.toLowerCase()).toContain('nacaome');
    expect(H1_DEFAULT.toLowerCase()).toContain('honduras');
  });

  it('el subtítulo por defecto incluye todas las keywords del title: defensa penal, asesoría jurídica, abogados, Nacaome, Valle, Honduras, Pineda y Asociados', () => {
    const text = SUBTITLE_DEFAULT.toLowerCase();
    expect(text).toContain('defensa penal');
    expect(text).toContain('asesoría jurídica');
    expect(text).toContain('abogados');
    expect(text).toContain('nacaome');
    expect(text).toContain('valle');
    expect(text).toContain('honduras');
    expect(text).toContain('pineda y asociados');
  });

  it('el check2 por defecto incluye "abogados" y "Nacaome" juntos', () => {
    expect(CHECK2_DEFAULT.toLowerCase()).toContain('abogados en nacaome');
  });

  it('el title del sitio (tagline) incluye los términos clave y tiene ≤65 caracteres', () => {
    const title = site.tagline;
    expect(title).toContain('Abogados');
    expect(title).toContain('Nacaome');
    expect(title).toContain('Valle');
    expect(title).toContain('Honduras');
    expect(title).toContain('Pineda y Asociados');
    expect(title.length).toBeLessThanOrEqual(65);
  });

  it('el title (tagline) tiene palabras que aparecen en el H1 y viceversa (coherencia semántica)', () => {
    const titleWords = site.tagline.toLowerCase();
    const h1Words = H1_DEFAULT.toLowerCase();
    // Palabras compartidas entre title y H1
    expect(titleWords).toContain('nacaome');
    expect(h1Words).toContain('nacaome');
    expect(titleWords).toContain('honduras');
    expect(h1Words).toContain('honduras');
    // "Abogados" del title aparece en el subtítulo (no en H1)
    const subWords = SUBTITLE_DEFAULT.toLowerCase();
    expect(subWords).toContain('abogados');
    // "Pineda y Asociados" aparece en subtítulo
    expect(subWords).toContain('pineda y asociados');
    // "Asesoría jurídica" del H1 aparece en subtítulo
    expect(subWords).toContain('asesoría jurídica');
  });
});

describe('lib/schemas/legal-page.ts — structured data de áreas (auditoría Jun 2026)', () => {
  it('areaSchemas NO emite BreadcrumbList (lo hace el componente <Breadcrumbs>)', () => {
    // Antes el helper emitía un BreadcrumbList Y el componente <Breadcrumbs>
    // otro → duplicado en derecho-penal, derecho-penal/[slug], hondurenos-en-
    // espana y su [slug]. Ahora el helper solo emite Service + FAQPage.
    const schemas = areaSchemas({
      service: {
        slug: 'test',
        name: 'Test',
        description: 'desc',
        serviceType: 'Defensa Penal',
        url: `${site.url}/test`,
      },
      faqs: [{ pregunta: '¿P?', respuesta: 'R.' }],
      breadcrumbs: [
        { name: 'Inicio', url: `${site.url}/` },
        { name: 'Test', url: `${site.url}/test` },
      ],
      url: `${site.url}/test`,
    });
    const types = schemas.map((s: Record<string, unknown>) => s['@type']);
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');
    expect(types, 'BreadcrumbList debe emitirlo solo el componente <Breadcrumbs>').not.toContain('BreadcrumbList');
  });

  it('faqPageSchema sanitiza HTML en acceptedAnswer.text (Google exige texto plano)', () => {
    const s = faqPageSchema(
      [{ pregunta: '¿<b>Pregunta</b>?', respuesta: 'Respuesta <a href="x">con link</a> & ampersand' }],
      `${site.url}/test`,
    );
    const question = (s.mainEntity as Array<Record<string, unknown>>)[0];
    const answer = question.acceptedAnswer as Record<string, unknown>;
    expect(String(question.name)).not.toMatch(/<[^>]*>/);
    expect(String(answer.text)).not.toMatch(/<[^>]*>/);
    expect(String(answer.text)).toContain('&');
    expect(String(answer.text)).not.toContain('&amp;');
  });
});

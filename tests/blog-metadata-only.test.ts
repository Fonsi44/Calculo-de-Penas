import { describe, expect, it } from 'vitest';
import { BLOG_METADATA_CHANGE_PLAN } from '@/data/blog/blog-metadata-change-plan';
import { BLOG_METADATA_OVERRIDES } from '@/data/blog/blog-metadata-overrides';
import {
  GENERATED_LEGAL_CTA_COPY,
  MID_POST_CTA_SLUGS,
  injectMidArticleCta,
} from '@/lib/blog-generated-cta';
import { sanitizeBlogRenderedHtml } from '@/lib/blog-html-sanitizer';

describe('contrato metadata-only del blog', () => {
  it('solo admite campos SEO autorizados', () => {
    const allowed = new Set([
      'title', 'metaTitle', 'description', 'metaDescription', 'ogTitle', 'ogDescription',
    ]);
    for (const override of Object.values(BLOG_METADATA_OVERRIDES)) {
      expect(Object.keys(override).every((key) => allowed.has(key))).toBe(true);
    }
  });

  it.each(['body', 'slug', 'category', 'publishedAt', 'reviewedContentHash', 'signatureValid'])(
    'no contiene el campo prohibido %s',
    (field) => {
      expect(Object.values(BLOG_METADATA_OVERRIDES).every((item) => !(field in item))).toBe(true);
    },
  );

  it('separa las dos intenciones hereditarias', () => {
    const changes = Object.values(BLOG_METADATA_CHANGE_PLAN);
    expect(changes).toHaveLength(1);
    expect(BLOG_METADATA_OVERRIDES['herencias-honduras-fallece-familiar']).toBeUndefined();
    expect(BLOG_METADATA_OVERRIDES['testamentos-sucesiones-herencia-honduras'])
      .toBeDefined();
  });

  it('mantiene metatítulos dentro del rango orientativo', () => {
    for (const item of Object.values(BLOG_METADATA_CHANGE_PLAN)) {
      expect(item.after.metaTitle.length).toBeGreaterThanOrEqual(35);
      expect(item.after.metaTitle.length).toBeLessThanOrEqual(65);
    }
  });

  it('mantiene metadescripciones prudentes y únicas', () => {
    const descriptions = Object.values(BLOG_METADATA_CHANGE_PLAN)
      .map((item) => item.after.metaDescription);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const description of descriptions) {
      expect(description.length).toBeGreaterThanOrEqual(100);
      expect(description.length).toBeLessThanOrEqual(165);
      expect(description).not.toMatch(/ganar[aá]|garantizad|tiene derecho a|mejor abogado/i);
    }
  });
});

describe('CTA jurídico generado', () => {
  it('usa un registro mínimo de 35 slugs', () => {
    expect(MID_POST_CTA_SLUGS.size).toBe(37);
    expect([...MID_POST_CTA_SLUGS].every((slug) => !/\s/.test(slug))).toBe(true);
  });

  it.each([
    ['evaluación inicial confidencial', /evaluaci[oó]n inicial confidencial/i],
    ['confidencial', /confidencial/i],
    ['sin claim gratuito', /consulta gratuita|sin costo|gratuit[oa]/i],
    ['sin garantía', /no se garantizan resultados/i],
  ])('incluye %s', (_label, pattern) => {
    const text = Object.values(GENERATED_LEGAL_CTA_COPY).join(' ');
    if (pattern.source.includes('consulta gratuita|sin costo')) {
      // Decisión 2026-08-03: no puede contener claims de gratuidad no confirmados.
      expect(text).not.toMatch(/consulta\s+gratuit[oa]|sin\s+costo|primera\s+consulta\s+es\s+gratuita/i);
    } else {
      expect(text).toMatch(pattern);
    }
  });

  it('no incluye promesas absolutas', () => {
    const text = Object.values(GENERATED_LEGAL_CTA_COPY)
      .join(' ')
      .replace(/no se garantizan resultados/gi, '');
    expect(text).not.toMatch(/ganar[aá]|garantiz(?:a|amos)|tiene derecho a|indemnizaci[oó]n asegurada/i);
  });

  it('conserva tracking y disclosures tras sanitización', () => {
    const html = injectMidArticleCta(
      '<p>Uno.</p><p>Dos.</p><p>Tres.</p><p>Cuatro.</p>',
      'defensa-penal-honduras',
    );
    const final = sanitizeBlogRenderedHtml(html).html;
    expect(final).toContain('seo_blog_cta_click');
    expect(final).toContain('blog_inline');
    expect(final).toContain('evaluación inicial confidencial');
    expect(final).toContain('/solicitar-consulta#formulario');
  });

  it('no altera artículos fuera del registro', () => {
    const body = '<p>Contenido jurídico congelado.</p>';
    expect(injectMidArticleCta(body, 'sin-cta')).toBe(body);
  });
});

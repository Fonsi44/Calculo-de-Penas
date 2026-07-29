import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LAWYER_PROFILES,
  founderSchema,
  thaniaSchema,
  emilSchema,
  site,
} from '@/lib/site';
import {
  attributionForProfile,
  projectPublicAttribution,
  type ArticleAttributionRow,
} from '@/lib/blog-attribution';

const pageSource = readFileSync(
  join(process.cwd(), 'app/(public)/equipo/[slug]/page.tsx'),
  'utf8',
);
const dbSource = readFileSync(join(process.cwd(), 'lib/blog-db.ts'), 'utf8');

function row(overrides: Partial<ArticleAttributionRow> = {}): ArticleAttributionRow {
  return {
    slug: 'articulo',
    title: 'Artículo',
    category: 'derecho-penal',
    publishedAt: new Date('2026-01-01'),
    author: 'Danilo Pineda Maradiaga',
    published: true,
    noindex: false,
    reviewStatus: 'verified',
    reviewedBy: 'Danilo Pineda Maradiaga',
    reviewOrigin: 'individual_lawyer_review',
    signatureType: 'lawyer',
    signatureName: 'Danilo Pineda Maradiaga',
    signatureCandidate: null,
    signatureValid: true,
    hashValid: true,
    redirected: false,
    ...overrides,
  };
}

describe('contrato de autoridad de perfiles', () => {
  it('mantiene exactamente tres perfiles canónicos', () => {
    expect(LAWYER_PROFILES).toHaveLength(3);
  });

  it.each(LAWYER_PROFILES)('$slug tiene una imagen WebP real', (profile) => {
    expect(profile.image).toMatch(/^\/images\/equipo\/.+\.webp$/);
    expect(existsSync(join(process.cwd(), 'public', profile.image))).toBe(true);
    expect(profile.imageAlt).toContain(profile.name);
  });

  it('Hero usa next/image con src y alt canónicos', () => {
    expect(pageSource).toContain("import Image from 'next/image'");
    expect(pageSource).toContain('src={profile.image}');
    expect(pageSource).toContain('alt={profile.imageAlt}');
    expect(pageSource).toContain('sizes=');
  });

  it('metadata usa el mismo asset y alt', () => {
    expect(pageSource).toContain('ogImage: profile.image');
    expect(pageSource).toContain('ogImageAlt: profile.imageAlt');
  });

  it('ProfilePage enlaza al Person canónico', () => {
    expect(pageSource).toContain("mainEntity: { '@id': profile.personId }");
    expect(pageSource).toContain('url: `${site.url}/equipo/${profile.slug}`');
  });

  it('cada Person usa imagen canónica, worksFor y URL pública coherente', () => {
    const schemas = [founderSchema(), thaniaSchema(), emilSchema()];
    for (const [index, schema] of schemas.entries()) {
      expect(schema.image).toBe(`${site.url}${LAWYER_PROFILES[index].image}`);
      expect(schema.worksFor).toEqual({ '@id': `${site.url}/#organization` });
      expect(LAWYER_PROFILES[index].personId).toBe(schema['@id']);
    }
  });

  it('las credenciales son condicionales y no hay placeholders', () => {
    expect(pageSource).toContain('credentials.cah &&');
    expect(pageSource).not.toMatch(/CAH:\s*(000|123|pendiente)/i);
  });

  it('la consulta ligera no selecciona body ni notas', () => {
    const selection = dbSource.slice(
      dbSource.indexOf('const attributionSelection'),
      dbSource.indexOf('function snapshotAttributionRows'),
    );
    expect(selection).not.toContain('body: blogPosts.body');
    expect(selection).not.toContain('legalReviewNotes');
    expect(selection).toContain('hashValid: sql<boolean>');
  });

  it('firma institucional nunca cuenta como revisión individual', () => {
    const result = projectPublicAttribution(row({
      reviewOrigin: 'firm_historical_review',
      signatureType: 'firm',
      signatureName: 'Pineda y Asociados',
    }), 'MIGRATED_SIGNATURE_MODE');
    expect(result.institutionalReview).toBe(true);
    expect(result.individualReviewerName).toBeNull();
  });

  it('firma individual válida cuenta y firma/hash inválidos no cuentan', () => {
    expect(projectPublicAttribution(row(), 'MIGRATED_SIGNATURE_MODE').individualReviewerName)
      .toBe('Danilo Pineda Maradiaga');
    expect(projectPublicAttribution(row({ hashValid: false }), 'MIGRATED_SIGNATURE_MODE').indexable)
      .toBe(false);
    expect(projectPublicAttribution(row({ signatureValid: false }), 'MIGRATED_SIGNATURE_MODE').indexable)
      .toBe(false);
  });

  it.each([
    { reviewStatus: 'pending_resignature' },
    { reviewStatus: 'lawyer_review_pending', signatureCandidate: 'Danilo Pineda Maradiaga' },
    { noindex: true },
    { redirected: true },
    { published: false },
  ])('excluye estados no públicos %#', (override) => {
    expect(projectPublicAttribution(row(override), 'MIGRATED_SIGNATURE_MODE').indexable)
      .toBe(false);
  });

  it('autoría exige coincidencia exacta y no atribuye al bufete', () => {
    const exact = projectPublicAttribution(row(), 'MIGRATED_SIGNATURE_MODE');
    const alias = projectPublicAttribution(row({ author: 'Danilo Pineda' }), 'MIGRATED_SIGNATURE_MODE');
    const firm = projectPublicAttribution(row({ author: 'Pineda y Asociados' }), 'MIGRATED_SIGNATURE_MODE');
    expect(attributionForProfile([exact], 'Danilo Pineda Maradiaga').authored).toHaveLength(1);
    expect(attributionForProfile([alias, firm], 'Danilo Pineda Maradiaga').authored).toHaveLength(0);
  });

  it('listados son navegables, limitados y sin body', () => {
    expect(pageSource).toContain('authored.slice(0, 6)');
    expect(pageSource).toContain('reviewed.slice(0, 6)');
    expect(pageSource).toContain('href={article.href}');
    expect(pageSource).not.toContain('article.body');
  });

  it('el estado vacío no inventa atribuciones', () => {
    expect(pageSource).toContain('según la evidencia editorial disponible');
    expect(pageSource).not.toContain('Autor de {authored}');
  });
});

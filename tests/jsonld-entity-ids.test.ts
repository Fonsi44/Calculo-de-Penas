/**
 * Tests de unicidad y coherencia de IDs de entidades JSON-LD.
 *
 * Verifica que cada abogado tenga UN único @id canónico y que todos los
 * grafo (Organization, LegalService, WebSite, Person, BlogPosting) apunten al
 * mismo nodo.
 */
import { describe, expect, it } from 'vitest';
import {
  LAWYER_PROFILES,
  founderSchema,
  thaniaSchema,
  emilSchema,
  organizationSchema,
  legalServiceSchema,
  site,
} from '@/lib/site';
import { blogPostSchema } from '@/lib/schemas/blog';

const ORIGIN = site.url;

describe('IDs de Person únicos y estables', () => {
  it('cada perfil tiene un @id Person descriptivo y distinto', () => {
    const ids = LAWYER_PROFILES.map((p) => p.personId);
    expect(ids).toEqual([
      `${ORIGIN}/#danilo-pineda-maradiaga`,
      `${ORIGIN}/#thania-marlene-paz`,
      `${ORIGIN}/#emil-barahona`,
    ]);
    expect(new Set(ids).size).toBe(3);
  });

  it('los schemas de persona usan el mismo @id que LAWYER_PROFILES', () => {
    expect(founderSchema()['@id']).toBe(LAWYER_PROFILES[0].personId);
    expect(thaniaSchema()['@id']).toBe(LAWYER_PROFILES[1].personId);
    expect(emilSchema()['@id']).toBe(LAWYER_PROFILES[2].personId);
  });

  it('Organization.founder apunta a los nodos Person canónicos', () => {
    expect(organizationSchema().founder).toEqual([
      { '@id': `${ORIGIN}/#danilo-pineda-maradiaga` },
      { '@id': `${ORIGIN}/#thania-marlene-paz` },
    ]);
  });

  it('LegalService.employee apunta a los nodos Person canónicos', () => {
    expect(legalServiceSchema().employee).toEqual([
      { '@id': `${ORIGIN}/#danilo-pineda-maradiaga` },
      { '@id': `${ORIGIN}/#thania-marlene-paz` },
      { '@id': `${ORIGIN}/#emil-barahona` },
    ]);
  });

  it('el schema de artículo enlaza a los nodos Person canónicos', () => {
    const schema = blogPostSchema({
      slug: 'prueba',
      title: 'Prueba',
      description: 'Descripción.',
      body: '<p>Contenido.</p>',
      publishedAt: '2026-01-01T00:00:00.000Z',
      category: 'derecho-penal',
      tags: [],
      author: 'Danilo Pineda Maradiaga',
      readingTime: '5 min',
      featured: false,
      coverImage: undefined,
      updatedAt: undefined,
    });
    expect(schema.author['@id']).toBe(`${ORIGIN}/#danilo-pineda-maradiaga`);
  });
});

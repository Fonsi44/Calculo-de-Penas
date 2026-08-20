/**
 * Tests de la estructura canónica de relaciones SEO de artículos
 * (lib/seo/article-relations.ts) — PROMPT 2 §6.2/§6.3.
 */
import { describe, expect, it } from 'vitest';
import articleSeoRelationsData from '@/data/seo/article-seo-relations.json';
import {
  MAX_RELATED_ARTICLES,
  validateArticleSeoRelations,
  validateAllArticleRelations,
  getCanonicalRelatedSummaries,
  expectedServicePathForCategory,
  isPrivatePath,
  loadArticleSeoRelations,
  type ArticleSeoRelations,
  type ArticleCatalog,
} from '@/lib/seo/article-relations';

const catalog: ArticleCatalog = new Map([
  ['a', { slug: 'a', category: 'derecho-civil', indexable: true }],
  ['b', { slug: 'b', category: 'derecho-civil', indexable: true }],
  ['c', { slug: 'c', category: 'derecho-civil', indexable: true }],
  ['noindex-x', { slug: 'noindex-x', category: 'derecho-penal', indexable: false }],
]);

describe('validateArticleSeoRelations', () => {
  it('acepta una relación válida', () => {
    const rel: ArticleSeoRelations = {
      slug: 'a',
      primaryService: '/servicios-juridicos/derecho-civil-y-notarial',
      relatedArticles: ['b', 'c'],
      officialSources: ['https://www.poderjudicial.gob.hn/'],
    };
    expect(validateArticleSeoRelations(rel, catalog)).toEqual([]);
  });

  it('rechaza autorreferencias', () => {
    const rel: ArticleSeoRelations = {
      slug: 'a', primaryService: '/servicios-juridicos/derecho-civil-y-notarial',
      relatedArticles: ['a'], officialSources: [],
    };
    expect(validateArticleSeoRelations(rel, catalog).some((v) => /Autorreferencia/.test(v))).toBe(true);
  });

  it('rechaza duplicados en relatedArticles', () => {
    const rel: ArticleSeoRelations = {
      slug: 'a', primaryService: '/servicios-juridicos/derecho-civil-y-notarial',
      relatedArticles: ['b', 'b'], officialSources: [],
    };
    expect(validateArticleSeoRelations(rel, catalog).some((v) => /Duplicado/.test(v))).toBe(true);
  });

  it('rechaza más de 2 artículos relacionados', () => {
    const rel: ArticleSeoRelations = {
      slug: 'a', primaryService: '/servicios-juridicos/derecho-civil-y-notarial',
      relatedArticles: ['b', 'c', 'a'], officialSources: [],
    };
    expect(validateArticleSeoRelations(rel, catalog)
      .some((v) => v.includes(`Máximo ${MAX_RELATED_ARTICLES}`))).toBe(true);
  });

  it('detecta enlaces rotos (slug inexistente)', () => {
    const rel: ArticleSeoRelations = {
      slug: 'a', primaryService: '/servicios-juridicos/derecho-civil-y-notarial',
      relatedArticles: ['no-existe'], officialSources: [],
    };
    expect(validateArticleSeoRelations(rel, catalog).some((v) => /Enlace roto/.test(v))).toBe(true);
  });

  it('rechaza targets no indexables', () => {
    const rel: ArticleSeoRelations = {
      slug: 'a', primaryService: '/servicios-juridicos/derecho-civil-y-notarial',
      relatedArticles: ['noindex-x'], officialSources: [],
    };
    expect(validateArticleSeoRelations(rel, catalog)
      .some((v) => /no indexable/.test(v))).toBe(true);
  });

  it('rechaza primaryService privado o no permitido', () => {
    const relPrivate: ArticleSeoRelations = {
      slug: 'a', primaryService: '/admin/configuracion', relatedArticles: [], officialSources: [],
    };
    expect(validateArticleSeoRelations(relPrivate, catalog)
      .some((v) => /privada|permitida/.test(v))).toBe(true);
    const relUnknown: ArticleSeoRelations = {
      slug: 'a', primaryService: '/ruta-inventada', relatedArticles: [], officialSources: [],
    };
    expect(validateArticleSeoRelations(relUnknown, catalog)
      .some((v) => /no es una ruta de servicio permitida/.test(v))).toBe(true);
  });

  it('valida fuentes oficiales HTTPS y no privadas', () => {
    const rel: ArticleSeoRelations = {
      slug: 'a', primaryService: '/servicios-juridicos/derecho-civil-y-notarial',
      relatedArticles: [], officialSources: [
        'http://insegura.example.com',
        '/admin/x',
        'https://www.pinedayasociadoshn.com/intranet/dashboard',
      ],
    };
    const violations = validateArticleSeoRelations(rel, catalog);
    expect(violations.some((v) => /no HTTPS/.test(v))).toBe(true); // http y relativa
    expect(violations.some((v) => /ruta privada/.test(v))).toBe(true); // https /intranet
  });

  it('valida la colección completa', () => {
    const ok = validateAllArticleRelations([{
      slug: 'a', primaryService: '/servicios-juridicos/derecho-civil-y-notarial',
      relatedArticles: ['b'], officialSources: [],
    }], catalog);
    expect(ok.ok).toBe(true);
    const bad = validateAllArticleRelations([{
      slug: 'a', primaryService: '/servicios-juridicos/derecho-civil-y-notarial',
      relatedArticles: ['fantasma'], officialSources: [],
    }], catalog);
    expect(bad.ok).toBe(false);
    expect(bad.violations.length).toBeGreaterThan(0);
  });
});

describe('isPrivatePath / getCanonicalRelatedSummaries', () => {
  it('detecta rutas privadas', () => {
    expect(isPrivatePath('/intranet/dashboard')).toBe(true);
    expect(isPrivatePath('/api/admin')).toBe(true);
    expect(isPrivatePath('/admin')).toBe(true);
    expect(isPrivatePath('/blog/derecho-penal/x')).toBe(false);
  });

  it('devuelve solo summaries canónicos existentes e indexables', () => {
    const summaries = [
      { slug: 'b', category: 'derecho-civil', noindex: false },
      { slug: 'noindex-x', category: 'derecho-penal', noindex: true },
      { slug: 'c', category: 'derecho-civil', noindex: false },
    ];
    const rel: ArticleSeoRelations = {
      slug: 'a', primaryService: '/servicios-juridicos/derecho-civil-y-notarial',
      relatedArticles: ['b', 'noindex-x'], officialSources: [],
    };
    const picks = getCanonicalRelatedSummaries(summaries, rel);
    expect(picks.map((p) => p.slug)).toEqual(['b']); // noindex-x excluido
  });

  it('devuelve [] sin relaciones definidas', () => {
    expect(getCanonicalRelatedSummaries([], undefined)).toEqual([]);
  });
});

describe('expectedServicePathForCategory', () => {
  it('resuelve el servicio de una categoría de blog', () => {
    expect(expectedServicePathForCategory('derecho-civil')).toBe('/servicios-juridicos/derecho-civil-y-notarial');
    expect(expectedServicePathForCategory('derecho-penal')).toBe('/derecho-penal');
    expect(expectedServicePathForCategory('hondurenos-en-espana')).toBe('/hondurenos-en-espana');
    expect(expectedServicePathForCategory('inexistente')).toBeNull();
  });
});

describe('loadArticleSeoRelations', () => {
  it('acepta el array crudo', () => {
    const rows = loadArticleSeoRelations([
      { slug: 'a', primaryService: '/derecho-penal', relatedArticles: [], officialSources: [] },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.slug).toBe('a');
  });

  it('desenvuelve el JSON canónico { relations: [...] }', () => {
    const loaded = loadArticleSeoRelations(articleSeoRelationsData);
    expect(loaded.length).toBe(articleSeoRelationsData.relations.length);
    expect(loaded.length).toBeGreaterThan(0);
    expect(loaded.map((row) => row.slug)).toEqual(
      expect.arrayContaining(['estafas-fraudes-tipos-penales-honduras']),
    );
  });

  it('devuelve [] si el objeto no trae relations', () => {
    expect(loadArticleSeoRelations({ schema_version: 1 })).toEqual([]);
    expect(loadArticleSeoRelations(null)).toEqual([]);
    expect(loadArticleSeoRelations(undefined)).toEqual([]);
  });
});

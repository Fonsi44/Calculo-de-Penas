import { describe, expect, it } from 'vitest';
import {
  buildJuridicosCatalog,
  buildPenalCatalog,
  buildPublicCatalog,
} from '@/lib/service-search-catalog';
import {
  groupSearchResults,
  normalizeSearchText,
  searchServiceIndex,
} from '@/lib/service-search-index';
import { hubPenal } from '@/data/areas-juridicas';
import { PUBLIC_SERVICE_CATALOG } from '@/lib/public-service-catalog';

describe('service-search-index', () => {
  const juridicos = buildJuridicosCatalog();
  const penal = buildPenalCatalog();

  it('normaliza acentos para comparar consultas', () => {
    expect(normalizeSearchText('Divorcio')).toBe(normalizeSearchText('divorcio'));
    expect(normalizeSearchText('Audiencia')).toBe(normalizeSearchText('audiencia'));
  });

  it('ignora puntuación al comparar consultas', () => {
    expect(normalizeSearchText('asesinato, parricidio')).toBe('asesinato parricidio');
  });

  it('encuentra un alias publicado sin crear URLs nuevas', () => {
    const hits = searchServiceIndex(
      [
        {
          title: 'Pensión de alimentos',
          description: 'Demanda, cuantificación y ejecución.',
          aliases: ['aumento de pensión', 'salarios caídos'],
          areaSlug: 'derecho-de-familia',
          areaLabel: 'Derecho de Familia',
          areaHref: '/servicios-juridicos/derecho-de-familia',
          icon: 'heart',
        },
      ],
      'aumento de pensión',
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]?.areaHref).toBe('/servicios-juridicos/derecho-de-familia');
  });

  it('indexa servicios de las áreas publicadas sin crear URLs nuevas', () => {
    const hrefs = new Set(juridicos.entries.map((entry) => entry.areaHref));
    for (const item of PUBLIC_SERVICE_CATALOG) {
      if (item.slug === 'derecho-penal') {
        expect([...hrefs].some((href) => href.startsWith('/derecho-penal/'))).toBe(true);
        continue;
      }
      expect(hrefs.has(item.href)).toBe(true);
    }
    expect(PUBLIC_SERVICE_CATALOG).toHaveLength(14);
  });

  it('encuentra «contrato» en varias áreas jurídicas', () => {
    const hits = searchServiceIndex(juridicos.entries, 'contrato');
    const groups = groupSearchResults(hits);
    expect(hits.length).toBeGreaterThan(3);
    expect(groups.length).toBeGreaterThan(1);
    expect(groups.some((group) => group.areaHref.includes('civil'))).toBe(true);
  });

  it('encuentra «defensa» en grupos penales y enlaza al grupo publicado', () => {
    const hits = searchServiceIndex(penal.entries, 'defensa');
    const groups = groupSearchResults(hits);
    expect(hits.length).toBeGreaterThan(0);
    expect(groups.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.areaHref.startsWith('/derecho-penal/'))).toBe(true);
  });

  it('el índice penal cubre los 7 grupos publicados', () => {
    const slugs = new Set(penal.entries.map((entry) => entry.areaSlug));
    expect(slugs.size).toBe(hubPenal.grupos.length);
    expect(hubPenal.grupos).toHaveLength(7);
  });

  it('el catálogo público une servicios, penal y España', () => {
    const catalog = buildPublicCatalog();
    const hrefs = catalog.entries.map((entry) => entry.areaHref);
    expect(hrefs.some((href) => href.startsWith('/servicios-juridicos/'))).toBe(true);
    expect(hrefs.some((href) => href.startsWith('/derecho-penal/'))).toBe(true);
    expect(hrefs.some((href) => href.startsWith('/hondurenos-en-espana/'))).toBe(true);
    expect(searchServiceIndex(catalog.entries, 'teletrabajo')[0]?.areaHref).toBe(
      '/servicios-juridicos/derecho-laboral',
    );
    expect(searchServiceIndex(catalog.entries, 'visas consultadas').length).toBeGreaterThan(0);
  });
});

/**
 * Contrato: cada ítem del CATÁLOGO MAESTRO DE SERVICIOS.docx está
 * publicado como subservicio (título, descripción o alias), es
 * encontrable en la barra de buscar y enlaza a una URL del sitemap
 * de servicios. No crea URLs nuevas.
 */
import { describe, expect, it } from 'vitest';
import catalogo from '@/tests/fixtures/catalogo-maestro-servicios.json';
import {
  areasGenerales,
  hubMigrantes,
  hubPenal,
  getAreaBySlug,
  getMigranteSubareaBySlug,
  getPenalGrupoBySlug,
} from '@/data/areas-juridicas';
import type { Subservicio } from '@/data/areas-juridicas';
import { buildJuridicosCatalog } from '@/lib/service-search-catalog';
import {
  normalizeSearchText,
  searchServiceIndex,
} from '@/lib/service-search-index';
import {
  getSitemapSegment,
  INDEXABLE_STATIC_PATHS,
} from '@/lib/seo/public-indexability';

type CatalogItem = {
  readonly areaSlug: string;
  readonly areaHref: string;
  readonly title: string;
  readonly query: string;
};

const items = catalogo.items as CatalogItem[];

function haystackOf(services: readonly Subservicio[]): string {
  return normalizeSearchText(
    services
      .map((service) =>
        [service.titulo, service.descripcion, ...(service.aliases ?? [])].join(' '),
      )
      .join(' '),
  );
}

function publishedServices(slug: string): readonly Subservicio[] {
  const general = getAreaBySlug(slug);
  if (general) return general.subservicios;
  const penal = getPenalGrupoBySlug(slug);
  if (penal) return penal.subservicios;
  const migrante = getMigranteSubareaBySlug(slug);
  if (migrante) return migrante.subservicios;
  return [];
}

describe('catálogo maestro — inventario congelado', () => {
  it('el fixture existe y cubre las áreas publicadas', () => {
    expect(items.length).toBeGreaterThan(200);
    const slugs = new Set(items.map((item) => item.areaSlug));
    for (const area of areasGenerales) {
      expect(slugs.has(area.slug), area.slug).toBe(true);
    }
    for (const grupo of hubPenal.grupos) {
      expect(slugs.has(grupo.slug), grupo.slug).toBe(true);
    }
    for (const subarea of hubMigrantes.subareas) {
      expect(slugs.has(subarea.slug), subarea.slug).toBe(true);
    }
  });

  it('el fixture declara el documento fuente del catálogo maestro', () => {
    expect(catalogo.source).toContain('CAT');
    expect(catalogo.source).toContain('MAESTRO');
    expect(catalogo.source).toMatch(/\.docx$/i);
  });
});

describe('catálogo maestro — contenido, búsqueda y sitemap', () => {
  const catalog = buildJuridicosCatalog();

  it.each(items)(
    '$areaSlug · $query',
    ({ areaSlug, areaHref, query }) => {
      const q = normalizeSearchText(query);
      expect(q.length, 'consulta vacía').toBeGreaterThan(3);

      const services = publishedServices(areaSlug);
      expect(services.length, `área desconocida: ${areaSlug}`).toBeGreaterThan(0);
      expect(
        haystackOf(services).includes(q),
        `«${query}» no aparece en subservicios de ${areaSlug}`,
      ).toBe(true);

      const hits = searchServiceIndex(catalog.entries, query);
      expect(
        hits.some((hit) => hit.areaHref === areaHref),
        `buscar «${query}» no enlaza a ${areaHref}`,
      ).toBe(true);

      expect(INDEXABLE_STATIC_PATHS).toContain(areaHref);
      expect(getSitemapSegment(areaHref)).toBe('services');
    },
  );
});

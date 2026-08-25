/**
 * Construcción del índice de búsqueda a partir de `data/areas-juridicas.ts`.
 * Solo debe importarse desde Server Components o tests.
 */

import {
  areasGenerales,
  hubMigrantes,
  hubPenal,
} from '@/data/areas-juridicas';
import type { ServiceSearchEntry } from '@/lib/service-search-index';

function entriesFromArea(params: {
  readonly slug: string;
  readonly titulo: string;
  readonly href: string;
  readonly icono: string;
  readonly subservicios: readonly {
    readonly titulo: string;
    readonly descripcion: string;
    readonly aliases?: readonly string[];
  }[];
}): ServiceSearchEntry[] {
  return params.subservicios.map((service) => ({
    title: service.titulo,
    description: service.descripcion,
    aliases: service.aliases,
    areaSlug: params.slug,
    areaLabel: params.titulo,
    areaHref: params.href,
    icon: params.icono,
  }));
}

export function buildJuridicosCatalog(): { readonly entries: ServiceSearchEntry[] } {
  const entries: ServiceSearchEntry[] = [];

  for (const grupo of hubPenal.grupos) {
    entries.push(
      ...entriesFromArea({
        slug: grupo.slug,
        titulo: grupo.titulo,
        href: `/derecho-penal/${grupo.slug}`,
        icono: grupo.icono,
        subservicios: grupo.subservicios,
      }),
    );
  }

  for (const area of areasGenerales) {
    entries.push(
      ...entriesFromArea({
        slug: area.slug,
        titulo: area.titulo,
        href: `/servicios-juridicos/${area.slug}`,
        icono: area.icono,
        subservicios: area.subservicios,
      }),
    );
  }

  for (const subarea of hubMigrantes.subareas) {
    entries.push(
      ...entriesFromArea({
        slug: subarea.slug,
        titulo: subarea.titulo,
        href: `/hondurenos-en-espana/${subarea.slug}`,
        icono: subarea.icono,
        subservicios: subarea.subservicios,
      }),
    );
  }

  return { entries };
}

export function buildPenalCatalog(): { readonly entries: ServiceSearchEntry[] } {
  return {
    entries: hubPenal.grupos.flatMap((grupo) =>
      entriesFromArea({
        slug: grupo.slug,
        titulo: grupo.titulo,
        href: `/derecho-penal/${grupo.slug}`,
        icono: grupo.icono,
        subservicios: grupo.subservicios,
      }),
    ),
  };
}

/** Catálogo unificado para el buscador global del header. */
export function buildPublicCatalog(): { readonly entries: ServiceSearchEntry[] } {
  return buildJuridicosCatalog();
}

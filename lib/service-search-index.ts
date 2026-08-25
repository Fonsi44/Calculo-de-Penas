/**
 * Funciones puras de búsqueda del catálogo de servicios.
 *
 * Sin importar el catálogo de áreas: el cliente (header y widget)
 * solo recibe entradas ya construidas en el servidor.
 * Los builders viven en `lib/service-search-catalog.ts`.
 */

export type ServiceSearchEntry = {
  title: string;
  description: string;
  aliases?: readonly string[];
  areaSlug: string;
  areaLabel: string;
  areaHref: string;
  icon: string;
};

export type GroupedSearchHit = {
  areaSlug: string;
  areaLabel: string;
  areaHref: string;
  icon: string;
  items: ServiceSearchEntry[];
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchServiceIndex(
  entries: readonly ServiceSearchEntry[],
  query: string,
): ServiceSearchEntry[] {
  const q = normalizeSearchText(query);
  if (!q) return [];
  return entries.filter((entry) => {
    const haystack = normalizeSearchText(
      `${entry.title} ${entry.description} ${(entry.aliases ?? []).join(' ')} ${entry.areaLabel}`,
    );
    return haystack.includes(q);
  });
}

export function groupSearchResults(
  hits: readonly ServiceSearchEntry[],
): GroupedSearchHit[] {
  const order: string[] = [];
  const byArea = new Map<string, GroupedSearchHit>();
  for (const hit of hits) {
    const existing = byArea.get(hit.areaSlug);
    if (existing) {
      existing.items.push(hit);
      continue;
    }
    order.push(hit.areaSlug);
    byArea.set(hit.areaSlug, {
      areaSlug: hit.areaSlug,
      areaLabel: hit.areaLabel,
      areaHref: hit.areaHref,
      icon: hit.icon,
      items: [hit],
    });
  }
  return order.map((slug) => byArea.get(slug)!);
}

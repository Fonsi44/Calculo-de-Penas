'use client';

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import {
  groupSearchResults,
  searchServiceIndex,
  type ServiceSearchEntry,
} from '@/lib/service-search-index';
import { getIcon } from '@/lib/icon-map';

type ServiceItem = {
  href: string;
  title: string;
  description: string;
  group?: string;
};

type Props = {
  items?: ServiceItem[];
  entries?: readonly ServiceSearchEntry[];
  placeholder?: string;
  domain: string;
  /**
   * - "inline": card con borde bajo el hero (legacy).
   * - "hero": barra blanca redondeada dentro del PageHero; resultados en panel absolute.
   */
  placement?: 'inline' | 'hero';
};

function toEllipsis(value: string): string {
  return `${value.replace(/(\.{3}|…)$/, '')}…`;
}

function highlightMatch(text: string, query: string, matcher: RegExp | null): ReactNode {
  const trimmed = query.trim();
  if (!trimmed || !matcher) return text;
  const parts = text.split(matcher);
  return parts.map((part, index) =>
    part.toLowerCase().startsWith(trimmed.toLowerCase()) ? (
      <strong key={`${part}-${index}`} className="font-semibold text-primary">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function toEntries(items: ServiceItem[]): ServiceSearchEntry[] {
  return items.map((item) => ({
    title: item.title,
    description: item.description,
    areaSlug: item.group ?? item.href,
    areaLabel: item.group ?? item.title,
    areaHref: item.href,
    icon: 'scale',
  }));
}

export function ServiceSearch({
  items,
  entries,
  placeholder,
  domain,
  placement = 'inline',
}: Props) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const catalog = entries ?? toEntries(items ?? []);
  const searchId = `service-search-${domain}`;
  const resultsId = `${searchId}-results`;
  const isHero = placement === 'hero';
  const label =
    domain === 'derecho-penal'
      ? 'Buscar servicios de derecho penal'
      : 'Buscar servicios jurídicos';

  const highlightMatcher = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(${escaped}\\w*)`, 'gi');
  }, [query]);

  const hits = useMemo(
    () => (deferredQuery.trim() ? searchServiceIndex(catalog, deferredQuery) : null),
    [deferredQuery, catalog],
  );
  const groups = useMemo(
    () => (hits ? groupSearchResults(hits) : []),
    [hits],
  );

  const rootCls = isHero
    ? 'relative z-20 text-left'
    : 'rounded-lg border border-accent/30 bg-gradient-to-br from-white to-accent/[0.04] p-4 shadow-md';

  const inputCls = isHero
    ? 'w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-2xl border-0 bg-white text-sm sm:text-base text-text placeholder:text-text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-[box-shadow] font-medium shadow-lg'
    : 'w-full pl-12 pr-10 py-3.5 rounded-lg border border-accent/25 bg-white text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 transition-[border-color,box-shadow] font-medium shadow-sm';

  const iconCls = isHero
    ? 'absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none'
    : 'absolute left-4 top-1/2 -translate-y-1/2 text-accent-dark pointer-events-none';

  const clearCls = isHero
    ? 'absolute right-3 top-1/2 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center text-text-muted hover:text-text rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
    : 'absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text bg-white/80 rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

  const resultsCls = isHero
    ? 'absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-border/30 bg-white max-h-80 overflow-y-auto overscroll-contain shadow-lg text-left'
    : 'mt-3 rounded-lg border border-border/30 bg-white max-h-80 overflow-y-auto overscroll-contain shadow-sm';

  return (
    <div className={rootCls}>
      <div className="relative">
        <Search size={20} className={iconCls} aria-hidden="true" />
        <label htmlFor={searchId} className="sr-only">
          {label}
        </label>
        <input
          id={searchId}
          name="q"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={toEllipsis(placeholder || `Buscar en ${domain}`)}
          autoComplete="off"
          aria-controls={resultsId}
          aria-expanded={Boolean(query.trim())}
          className={inputCls}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className={clearCls}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {query && hits !== null && (
        <div
          id={resultsId}
          role="listbox"
          aria-label="Resultados de búsqueda"
          className={resultsCls}
        >
          {hits.length === 0 ? (
            <p className="p-4 text-sm text-text-muted text-center" role="status" aria-live="polite">
              No se encontraron resultados para <strong>&quot;{query}&quot;</strong> en {domain}
            </p>
          ) : (
            <div className="p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Resultados: &laquo;{query.trim()}&raquo;
              </p>
              <p className="mt-1 text-xs text-text-muted" role="status" aria-live="polite">
                <span className="font-semibold text-accent-dark">{hits.length}</span>
                {hits.length === 1 ? ' servicio encontrado' : ' servicios encontrados'}
                {' · '}
                {groups.length} {groups.length === 1 ? 'área jurídica' : 'áreas jurídicas'}
              </p>
              <div className="mt-3 divide-y divide-border/25">
                {groups.map((group) => {
                  const AreaIcon = getIcon(group.icon);
                  return (
                    <section key={group.areaSlug} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span
                          className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0"
                          aria-hidden="true"
                        >
                          <AreaIcon size={16} strokeWidth={1.75} />
                        </span>
                        <p className="text-xs font-bold uppercase tracking-wide text-primary">
                          {group.areaLabel}
                        </p>
                      </div>
                      <ul className="space-y-1.5 pl-0.5">
                        {group.items.map((item) => (
                          <li key={`${group.areaSlug}-${item.title}`}>
                            <Link
                              href={item.areaHref}
                              className="flex items-start gap-2.5 py-1 px-1.5 -mx-1.5 rounded-md hover:bg-accent/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              <span
                                aria-hidden="true"
                                className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"
                              />
                              <span className="min-w-0 flex-1 text-sm text-text leading-snug group-hover:text-primary transition-colors">
                                {highlightMatch(item.title, query.trim(), highlightMatcher)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

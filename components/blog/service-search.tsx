'use client';

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Search, X, ArrowRight } from 'lucide-react';
import {
  groupSearchResults,
  searchServiceIndex,
  type ServiceSearchEntry,
} from '@/lib/service-search-index';

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

export function ServiceSearch({ items, entries, placeholder, domain }: Props) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const catalog = entries ?? toEntries(items ?? []);
  const searchId = `service-search-${domain}`;
  const resultsId = `${searchId}-results`;
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

  return (
    <div className="rounded-lg border border-accent/30 bg-gradient-to-br from-white to-accent/[0.04] p-4 shadow-md">
      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-dark pointer-events-none"
          aria-hidden="true"
        />
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
          className="w-full pl-12 pr-10 py-3.5 rounded-lg border border-accent/25 bg-white text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 transition-[border-color,box-shadow] font-medium shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text bg-white/80 rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
          className="mt-3 rounded-lg border border-border/30 bg-white max-h-80 overflow-y-auto overscroll-contain shadow-sm"
        >
          {hits.length === 0 ? (
            <p className="p-4 text-sm text-text-muted text-center" role="status" aria-live="polite">
              No se encontraron resultados para <strong>&quot;{query}&quot;</strong> en {domain}
            </p>
          ) : (
            <div className="p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Resultados: &laquo;{query.trim()}&raquo;
              </p>
              <p className="mt-1 text-xs text-text-muted" role="status" aria-live="polite">
                <span className="font-semibold text-accent-dark">{hits.length}</span>
                {hits.length === 1 ? ' servicio encontrado' : ' servicios encontrados'}
                {' · '}
                {groups.length} {groups.length === 1 ? 'área jurídica' : 'áreas jurídicas'}
              </p>
              <div className="mt-3 space-y-3">
                {groups.map((group) => (
                  <section key={group.areaSlug}>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary mb-1">
                      {group.areaLabel}
                    </p>
                    <ul className="divide-y divide-border/20">
                      {group.items.map((item) => (
                        <li key={`${group.areaSlug}-${item.title}`}>
                          <Link
                            href={item.areaHref}
                            className="flex items-start gap-3 p-2.5 hover:bg-accent/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-text leading-snug group-hover:text-primary transition-colors">
                                {highlightMatch(item.title, query.trim(), highlightMatcher)}
                              </p>
                              {item.description ? (
                                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                                  {item.description}
                                </p>
                              ) : null}
                            </div>
                            <ArrowRight
                              size={14}
                              className="flex-shrink-0 mt-1 text-text-muted group-hover:text-accent-dark transition-colors"
                              aria-hidden="true"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

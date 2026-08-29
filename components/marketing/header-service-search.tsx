'use client';

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Search, X, ArrowRight } from 'lucide-react';
import {
  groupSearchResults,
  searchServiceIndex,
  type ServiceSearchEntry,
} from '@/lib/service-search-index';

const RESULT_CAP = 8;

type HeaderServiceSearchProps = {
  readonly entries: readonly ServiceSearchEntry[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
};

type PanelProps = {
  readonly entries: readonly ServiceSearchEntry[];
  readonly panelId: string;
  readonly onClose: () => void;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
};

function toEllipsis(value: string): string {
  return `${value.replace(/(\.{3}|…)$/, '')}…`;
}

function prefersCoarsePointer(): boolean {
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

function HeaderSearchPanel({ entries, panelId, onClose, triggerRef }: PanelProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchId = `${panelId}-input`;
  const resultsId = `${panelId}-results`;
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!prefersCoarsePointer()) {
        inputRef.current?.focus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
      triggerRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, triggerRef]);

  const hits = useMemo(
    () => (deferredQuery.trim() ? searchServiceIndex(entries, deferredQuery) : null),
    [deferredQuery, entries],
  );
  const visibleHits = useMemo(
    () => hits?.slice(0, RESULT_CAP) ?? [],
    [hits],
  );
  const groups = useMemo(() => groupSearchResults(visibleHits), [visibleHits]);

  const panelContent = (
    <div
      id={panelId}
      role="search"
      className="fixed top-14 right-3 left-3 sm:left-auto sm:w-full sm:max-w-lg z-[56] max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-lg border border-accent/30 bg-surface text-text shadow-xl p-3"
    >
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-dark pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor={searchId} className="sr-only">
            Buscar servicios jurídicos
          </label>
          <input
            ref={inputRef}
            id={searchId}
            name="q"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={resultsId}
            aria-expanded={Boolean(query.trim())}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={toEllipsis('Buscar un servicio jurídico')}
            autoComplete="off"
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-accent/25 bg-white text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 font-medium"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center text-text-muted hover:text-text rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {query && hits !== null ? (
          <div
            id={resultsId}
            role="listbox"
            aria-label="Resultados de búsqueda"
            className="mt-2 rounded-lg border border-border/30 bg-white max-h-80 overflow-y-auto overscroll-contain"
          >
            {hits.length === 0 ? (
              <p className="p-3 text-sm text-text-muted text-center" role="status" aria-live="polite">
                No se encontraron resultados para <strong>&quot;{query}&quot;</strong>
              </p>
            ) : (
              <div className="p-3">
                <p className="text-xs text-text-muted" role="status" aria-live="polite">
                  {hits.length > RESULT_CAP
                    ? `Mostrando ${visibleHits.length} de ${hits.length} servicios`
                    : `${hits.length} ${hits.length === 1 ? 'servicio encontrado' : 'servicios encontrados'}`}
                </p>
                <div className="mt-2 space-y-2">
                  {groups.map((group) => (
                    <section key={group.areaSlug}>
                      <Link
                        href={group.areaHref}
                        onClick={onClose}
                        className="text-xs font-bold uppercase tracking-wide text-primary hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
                      >
                        {group.areaLabel}
                      </Link>
                      <ul className="mt-1 divide-y divide-border/20">
                        {group.items.map((item) => (
                          <li key={`${group.areaSlug}-${item.title}`}>
                            <Link
                              href={item.areaHref}
                              onClick={onClose}
                              className="flex items-start gap-2 p-2 hover:bg-accent/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
                            >
                              <span className="min-w-0 flex-1 text-sm font-semibold text-text leading-snug group-hover:text-primary">
                                {item.title}
                              </span>
                              <ArrowRight
                                size={14}
                                className="flex-shrink-0 mt-0.5 text-text-muted group-hover:text-accent-dark"
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
        ) : null}

        <Link
          href="/blog#buscar"
          onClick={onClose}
          className="mt-2 min-h-11 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent-dark focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg px-1"
        >
          <Search size={14} aria-hidden="true" />
          Buscar en el blog
        </Link>
    </div>
  );

  if (!mounted) return null;

  return createPortal(
    <>
      <div role="presentation" className="fixed inset-0 z-[55]" onClick={onClose} />
      {panelContent}
    </>,
    document.body,
  );
}

export function HeaderServiceSearch({
  entries,
  open,
  onOpenChange,
}: HeaderServiceSearchProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reactId = useId();
  const panelId = `header-service-search-${reactId.replace(/:/g, '')}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title="Buscar servicios jurídicos"
        className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg text-text-inverse/85 hover:text-accent hover:bg-primary-light/30 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        aria-label="Buscar servicios jurídicos"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
      >
        {open ? <X size={16} aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
      </button>
      {open ? (
        <HeaderSearchPanel
          entries={entries}
          panelId={panelId}
          onClose={() => onOpenChange(false)}
          triggerRef={triggerRef}
        />
      ) : null}
    </>
  );
}

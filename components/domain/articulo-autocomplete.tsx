'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, FileText, Loader2, CornerDownLeft, ArrowRight } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/ui';

export interface ArticuloCP {
  id: number;
  articulo: string;
  epigrafe: string | null;
  texto: string;
  tema: string | null;
  libro: string | null;
  titulo: string | null;
  capitulo: string | null;
}

interface ArticuloAutocompleteProps {
  placeholder?: string;
  onSelect?: (art: ArticuloCP) => void;
  href?: (art: ArticuloCP) => string;
  className?: string;
  autoFocus?: boolean;
  emptyMessage?: string;
  maxResults?: number;
}

function highlight(text: string | null | undefined, query: string): React.ReactNode {
  if (!text) return null;
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/30 text-text font-bold rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function TEMA_LABEL(t: string | null | undefined): string {
  if (!t) return '';
  const map: Record<string, string> = {
    delitos: 'Delitos',
    garantias_penales: 'Garantías penales',
    circunstancias: 'Circunstancias',
    consecuencias_juridicas: 'Consecuencias jurídicas',
    hecho_penal: 'Hecho penal',
    autoria_participacion: 'Autoría y participación',
    parte_general: 'Parte general',
    penas: 'Penas',
    ejecucion_medidas: 'Ejecución y medidas',
    responsabilidad_civil: 'Responsabilidad civil',
    prescripcion: 'Prescripción',
    ejecucion: 'Ejecución',
    autoria: 'Autoría',
  };
  return map[t] ?? t;
}

export function ArticuloAutocomplete({
  placeholder = 'Buscar artículo (ej. "Art. 19", "hurto", "eximente")...',
  onSelect,
  href,
  className,
  autoFocus = false,
  emptyMessage = 'Sin resultados. Probá con otro término.',
  maxResults = 8,
}: ArticuloAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArticuloCP[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(query, 180);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- debounce reset
      setResults([]);
       
      setLoading(false);
      return;
    }
    let cancelled = false;
     
    setLoading(true);
    fetch(`/api/cp?busqueda=${encodeURIComponent(debounced)}&limit=${maxResults}`)
      .then(r => r.json())
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : (data?.data || []);
        setResults(rows);
        setActive(-1);
      })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, maxResults]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (active >= 0 && listRef.current) {
      const item = listRef.current.children[active] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [active]);

  const handleSelect = useCallback((art: ArticuloCP) => {
    onSelect?.(art);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }, [onSelect]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive(a => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => Math.max(-1, a - 1));
    } else if (e.key === 'Enter' && active >= 0 && results[active]) {
      e.preventDefault();
      handleSelect(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Buscar artículo del Código Penal"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="art-autocomplete-list"
          role="combobox"
          className="w-full h-11 pl-10 pr-10 bg-surface border border-border rounded-md text-sm text-text placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
        />
        {loading ? (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded text-text-muted hover:text-text"
          >
            ×
          </button>
        ) : null}
      </div>

      {open && query.length >= 2 && (
        <ul
          id="art-autocomplete-list"
          ref={listRef}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-80 overflow-y-auto bg-surface border border-border rounded-md shadow-lg py-1"
        >
          {loading && results.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-text-muted">
              <Loader2 size={14} className="inline animate-spin mr-1" />
              Buscando...
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-text-muted">{emptyMessage}</li>
          ) : (
            <>
              {results.map((art, i) => {
                const itemHref = href ? href(art) : `/cp/${art.id}`;
                const inner = (
                  <>
                    <FileText size={14} className="text-accent mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-primary">
                          {highlight(art.articulo, query)}
                        </span>
                        {art.tema && (
                          <span className="text-xxs uppercase tracking-wider font-semibold text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">
                            {TEMA_LABEL(art.tema)}
                          </span>
                        )}
                      </div>
                      {art.epigrafe && (
                        <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                          {highlight(art.epigrafe, query)}
                        </p>
                      )}
                      <p className="text-xxs text-text-muted line-clamp-1 mt-0.5 italic">
                        {art.texto.slice(0, 120)}{art.texto.length > 120 ? '…' : ''}
                      </p>
                    </div>
                    <span className="text-text-muted text-xxs flex items-center gap-1 shrink-0 mt-0.5">
                      {active === i && <CornerDownLeft size={10} />}
                      <ArrowRight size={12} />
                    </span>
                  </>
                );
                return (
                  <li
                    key={art.id}
                    role="option"
                    aria-selected={active === i}
                    className={cn(
                      'px-3 py-2 cursor-pointer transition-colors',
                      active === i ? 'bg-accent/15' : 'hover:bg-surface-alt',
                    )}
                    onMouseEnter={() => setActive(i)}
                  >
                    {onSelect ? (
                      <button
                        type="button"
                        onClick={() => handleSelect(art)}
                        className="flex items-start gap-2 text-left w-full focus:outline-none"
                      >
                        {inner}
                      </button>
                    ) : (
                      <Link
                        href={itemHref}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-2 text-left w-full focus:outline-none"
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

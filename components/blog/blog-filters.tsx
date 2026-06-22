'use client';

import { Clock, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/ui';
import type { SortMode } from '@/lib/blog-hub';

/**
 * Barra de controles del hub: orden (Recientes / Relevantes) + chips de
 * filtros activos (categoría, etiqueta, búsqueda) con su acción de quitar,
 * y botón "Limpiar filtros" cuando hay alguno activo.
 *
 * Presentacional: recibe el estado y los callbacks del orquestador
 * (BlogExplorer).
 */
export function BlogFilters({
  sort,
  onSort,
  activeCategory,
  activeCategoryLabel,
  onClearCategory,
  activeTag,
  onClearTag,
  query,
  onClearQuery,
  onClearAll,
  resultCount,
}: {
  sort: SortMode;
  onSort: (m: SortMode) => void;
  activeCategory?: string | null;
  activeCategoryLabel?: string;
  onClearCategory: () => void;
  activeTag?: string | null;
  onClearTag: () => void;
  query?: string;
  onClearQuery: () => void;
  onClearAll: () => void;
  resultCount?: number;
}) {
  const hasFilters = Boolean(activeCategory || activeTag || query);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-alt border border-border/40">
        <button
          type="button"
          onClick={() => onSort('recent')}
          aria-pressed={sort === 'recent'}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors',
            sort === 'recent' ? 'bg-surface-raised text-primary shadow-sm' : 'text-text-secondary hover:text-primary',
          )}
        >
          <Clock size={14} /> Recientes
        </button>
        <button
          type="button"
          onClick={() => onSort('relevant')}
          aria-pressed={sort === 'relevant'}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors',
            sort === 'relevant' ? 'bg-surface-raised text-primary shadow-sm' : 'text-text-secondary hover:text-primary',
          )}
        >
          <Sparkles size={14} /> Relevantes
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {typeof resultCount === 'number' && hasFilters && (
          <span className="text-sm text-text-muted tabular-nums">
            {resultCount} resultado{resultCount !== 1 ? 's' : ''}
          </span>
        )}
        {query && (
          <Chip label={`«${query}»`} onRemove={onClearQuery} />
        )}
        {activeCategory && activeCategoryLabel && (
          <Chip label={activeCategoryLabel} onRemove={onClearCategory} />
        )}
        {activeTag && (
          <Chip label={`#${activeTag}`} onRemove={onClearTag} />
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-sm font-semibold text-primary hover:text-accent-dark transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
      >
        <X size={12} />
      </button>
    </span>
  );
}

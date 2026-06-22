'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/ui';
import type { BlogCategoryWithCount } from '@/data/blog/types';

/**
 * Navegación por categorías del hub. Chips filtrables con conteo de posts.
 *
 * Estrategia anti-caos para 20 categorías: muestra las `visibleCount` más
 * activas como chips inline; el resto va a un desplegable "Más categorías"
 * con panel flotante. El chip "Todos" limpia el filtro.
 *
 * Filtro cliente (sin cambiar la URL) → no crea URLs indexables que
 * canibalizarían las páginas de categoría canónicas `/blog/[categoria]`
 * (que permanecen indexables vía el sidebar). Cumple §5 (una URL = una
 * intención de búsqueda).
 */
export function CategoryNavigation({
  categories,
  active,
  onSelect,
  visibleCount = 8,
}: {
  categories: BlogCategoryWithCount[];
  active: string | null;
  onSelect: (slug: string | null) => void;
  visibleCount?: number;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const visible = categories.slice(0, visibleCount);
  const rest = categories.slice(visibleCount);

  const chip = (c: { slug: string; nombre: string; count: number }, isActive: boolean) => (
    <button
      key={c.slug}
      type="button"
      onClick={() => onSelect(isActive ? null : c.slug)}
      aria-pressed={isActive}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
        isActive
          ? 'bg-primary text-text-inverse'
          : 'bg-surface-alt text-text-secondary hover:bg-primary/10 hover:text-primary border border-border/40',
      )}
    >
      {c.nombre}
      <span className={cn(
        'text-xxs tabular-nums',
        isActive ? 'text-text-inverse/70' : 'text-text-muted',
      )}>
        {c.count}
      </span>
    </button>
  );

  return (
    <div className="relative">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        <div className="flex gap-2 pb-1 min-w-max">
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-pressed={active === null}
            className={cn(
              'inline-flex items-center px-3.5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
              active === null
                ? 'bg-primary text-text-inverse'
                : 'bg-surface-alt text-text-secondary hover:bg-primary/10 hover:text-primary border border-border/40',
            )}
          >
            Todos
          </button>
          {visible.map((c) => chip(c, active === c.slug))}
          {rest.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className={cn(
                'inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap border',
                moreOpen
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-surface-alt text-text-secondary hover:bg-primary/10 hover:text-primary border-border/40',
              )}
            >
              Más categorías
              <ChevronDown size={14} className={cn('transition-transform', moreOpen && 'rotate-180')} />
            </button>
          )}
        </div>
      </div>

      {moreOpen && rest.length > 0 && (
        <>
          {/* Backdrop para cerrar al click fuera */}
          <button
            type="button"
            aria-label="Cerrar lista de categorías"
            tabIndex={-1}
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setMoreOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 left-0 sm:left-auto sm:min-w-[18rem] z-40 mt-2 rounded-lg border border-border/50 bg-surface-raised shadow-lg p-2 grid grid-cols-2 sm:grid-cols-2 gap-1 max-h-[60vh] overflow-y-auto"
          >
            {rest.map((c) => (
              <button
                key={c.slug}
                type="button"
                role="menuitem"
                onClick={() => { onSelect(active === c.slug ? null : c.slug); setMoreOpen(false); }}
                className={cn(
                  'flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors',
                  active === c.slug
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-primary',
                )}
              >
                <span className="truncate">{c.nombre}</span>
                <span className="text-xxs text-text-muted tabular-nums flex-shrink-0">{c.count}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

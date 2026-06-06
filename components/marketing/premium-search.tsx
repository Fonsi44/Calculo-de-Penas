/**
 * Buscador premium con caja de búsqueda elegante (variante para hubs).
 */

'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { premiumServices } from '@/lib/data/service-catalog';
import { premiumPenalGrupos } from '@/lib/data/penal-catalog';
import Link from 'next/link';

type Item = { slug: string; titulo: string; resumen: string; href: string };

function buildItems(): Item[] {
  const items: Item[] = [];
  for (const s of premiumServices) {
    items.push({ slug: s.slug, titulo: s.titulo, resumen: s.resumen, href: `/servicios-juridicos/${s.slug}` });
  }
  for (const g of premiumPenalGrupos) {
    items.push({ slug: g.slug, titulo: g.titulo, resumen: g.resumen, href: `/derecho-penal/${g.slug}` });
  }
  return items;
}

const ALL_ITEMS = buildItems();

interface PremiumSearchProps {
  placeholder?: string;
}

export function PremiumSearch({ placeholder = 'Buscar por área o palabra clave...' }: PremiumSearchProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as Item[];
    return ALL_ITEMS.filter(
      (it) => it.titulo.toLowerCase().includes(q) || it.resumen.toLowerCase().includes(q) || it.slug.includes(q),
    ).slice(0, 6);
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 pl-11 pr-4 rounded-lg border border-slate-200 bg-white text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 shadow-premium"
        />
      </div>
      {results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-100 bg-white shadow-xl overflow-hidden">
          {results.map((r) => (
            <Link
              key={r.slug}
              href={r.href}
              onClick={() => setQuery('')}
              className="block px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-b-0"
            >
              <p className="text-sm font-semibold text-text">{r.titulo}</p>
              <p className="text-[12px] text-text-secondary line-clamp-1">{r.resumen}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

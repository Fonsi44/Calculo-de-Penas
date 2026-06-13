'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, ArrowRight } from 'lucide-react';

type ServiceItem = {
  href: string;
  title: string;
  description: string;
};

type Props = {
  items: ServiceItem[];
  placeholder?: string;
  domain: string;
};

export function ServiceSearch({ items, placeholder, domain }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [query, items]);

  return (
    <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-white to-accent/[0.04] p-4 shadow-md shadow-accent/5">
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-dark pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || `Buscar en ${domain}...`}
          className="w-full pl-12 pr-10 py-3.5 rounded-lg border border-accent/25 bg-white text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-medium shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text bg-white/80 rounded-full p-1 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {query && filtered !== null && (
        <div className="mt-3 rounded-lg border border-border/30 bg-white divide-y divide-border/20 max-h-80 overflow-y-auto shadow-sm">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-text-muted text-center">
              No se encontraron resultados para <strong>&quot;{query}&quot;</strong> en {domain}
            </p>
          ) : (
            filtered.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-start gap-3 p-3 hover:bg-accent/5 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                </div>
                <ArrowRight size={14} className="flex-shrink-0 mt-1 text-text-muted group-hover:text-accent-dark transition-colors" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

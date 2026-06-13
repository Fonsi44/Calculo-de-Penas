'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Calendar, Clock, X } from 'lucide-react';
import type { Post } from '@/data/blog/types';
import { getCategoryName, formatDate } from '@/lib/blog';

type Props = {
  posts: Post[];
};

export function BlogSearch({ posts }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q)) ||
        (p.body && p.body.replace(/<[^>]+>/g, '').toLowerCase().includes(q))
    );
  }, [query, posts]);

  return (
    <div className="space-y-4 mb-8">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar artículos por título, descripción o etiquetas..."
          className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-border/40 bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {query && filtered && (
        <div className="rounded-lg border border-border/30 bg-surface divide-y divide-border/20 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-text-muted text-center">
              No se encontraron artículos para <strong>&quot;{query}&quot;</strong>
            </p>
          ) : (
            filtered.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.category}/${p.slug}`}
                className="flex items-start gap-3 p-3 hover:bg-surface-alt transition-colors group"
              >
                {p.coverImage && (
                  <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-primary/5">
                    <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-accent-dark font-bold uppercase tracking-wider mb-0.5">
                    {getCategoryName(p.category) ?? p.category}
                  </p>
                  <p className="text-sm font-semibold text-text leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {p.title}
                  </p>
                  <p className="text-xxs text-text-muted flex items-center gap-2 mt-1">
                    <Calendar size={10} /> {formatDate(p.publishedAt)}
                    <Clock size={10} /> {p.readingTime}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

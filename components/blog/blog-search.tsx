'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Calendar, Clock, X, ArrowRight } from 'lucide-react';
import { getCategoryName, formatDate } from '@/lib/blog';
import { trackBlogSearch } from '@/lib/analytics';

const PLACEHOLDER_EXAMPLES = [
  'despido injustificado',
  'divorcio',
  'pensión alimenticia',
  'accidente de tránsito',
  'herencia',
  'fiscalización SAR',
];

type SearchablePost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readingTime: string;
  coverImage?: string;
};

type Props = {
  posts: SearchablePost[];
  scope?: string;
};

export function BlogSearch({ posts, scope }: Props) {
  const [query, setQuery] = useState('');
  const [placeholder] = useState(
    () => `Buscar: "${PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)]}" — escriba lo que necesite`
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [query, posts]);

  return (
    <div className="rounded-lg border border-accent/30 bg-gradient-to-br from-white to-accent/[0.04] p-4 shadow-md">
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-dark pointer-events-none" />
        <label htmlFor="blog-search" className="sr-only">Buscar artículos del blog jurídico</label>
        <input
          id="blog-search"
          name="blog-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-12 pr-10 py-3.5 rounded-lg border border-accent/25 bg-white text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-medium shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-dark bg-white/80 rounded-full p-1 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {query && filtered !== null && (
        <div className="mt-3 rounded-lg border border-border/30 bg-white divide-y divide-border/20 max-h-96 overflow-y-auto shadow-sm">
          <p className="px-3 py-2 text-xxs font-bold uppercase tracking-wider text-text-muted bg-surface-alt/50">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} {scope ? `en ${scope}` : ''}
          </p>
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-text-muted text-center">
              No se encontraron artículos para <strong>&quot;{query}&quot;</strong>
            </p>
          ) : (
            filtered.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.category}/${p.slug}`}
                onClick={() => trackBlogSearch(query)}
                data-internal-link={`blog_search:${p.slug}`}
                className="flex items-start gap-3 p-3 hover:bg-accent/5 transition-colors group"
              >
                {p.coverImage && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-primary/5 border border-border/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xxs text-accent-dark font-bold uppercase tracking-wider mb-0.5">
                    {getCategoryName(p.category) ?? p.category}
                  </p>
                  <p className="text-sm font-semibold text-text leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {p.title}
                  </p>
                  <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                    {p.description}
                  </p>
                  <p className="text-xxs text-text-muted/70 flex items-center gap-2 mt-1">
                    <Calendar size={10} /> {formatDate(p.publishedAt)}
                    <Clock size={10} /> {p.readingTime}
                  </p>
                </div>
                <ArrowRight size={14} className="flex-shrink-0 mt-2 text-text-muted group-hover:text-accent-dark transition-colors" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

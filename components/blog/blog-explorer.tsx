'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/ui';
import { blogCategories } from '@/data/blog/categories';
import {
  searchPosts,
  filterByCategory,
  sortPosts,
  type SortMode,
} from '@/lib/blog-hub';
import type { BlogCardData, BlogCategoryWithCount } from '@/data/blog/types';
import { BlogCard } from '@/components/blog/blog-card';
import { BlogCardGrid } from '@/components/blog/blog-card-grid';
import { CategoryNavigation } from '@/components/blog/category-navigation';
import { BlogFilters } from '@/components/blog/blog-filters';
import { EmptyState } from '@/components/blog/empty-state';
import { BlogPagination } from '@/components/blog/blog-pagination';

const PLACEHOLDER_EXAMPLES = [
  'despido injustificado',
  'divorcio',
  'pensión alimenticia',
  'accidente de tránsito',
  'herencia',
  'fiscalización SAR',
];

/**
 * Orquestador interactivo del content hub. Cliente: posee el estado de
 * búsqueda, categoría, orden y "cargar más", y renderiza la barra de
 * búsqueda, la navegación por categorías, los filtros, la cuadrícula, el
 * estado vacío y la paginación.
 *
 * Dual mode (SEO + UX):
 *  - Vista servidor (sin filtros cliente y orden = recientes): muestra la
 *    porción paginada que viene del servidor + paginación indexable con
 *    rel prev/next. Es la vista que ven los crawlers y el primer render.
 *  - Vista cliente (hay búsqueda, categoría o orden != recientes): filtra y
 *    ordena en cliente sobre el conjunto completo (sin body) con "cargar
 *    más". No crea URLs indexables (sin canibalización con /blog/[categoria]).
 *
 * El filtro `?tag=` (server-side, noindex) se respeta: el conjunto `posts`
 * ya viene acotado por etiqueta desde el servidor; quitar la etiqueta
 * navega a /blog.
 */
export function BlogExplorer({
  posts,
  categories,
  pagePosts,
  page,
  totalPages,
  activeTag,
  activeMonth,
  itemsPerPage = 12,
  withSidebar = false,
}: {
  posts: BlogCardData[];
  categories: BlogCategoryWithCount[];
  pagePosts: BlogCardData[];
  page: number;
  totalPages: number;
  activeTag?: string | null;
  activeMonth?: string | null;
  itemsPerPage?: number;
  withSidebar?: boolean;
}) {
  const router = useRouter();

  // Construye la URL de paginación en el cliente (no se puede pasar una
  // función desde el Server Component). Preserva los filtros URL activos.
  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set('page', String(p));
    if (activeTag) params.set('tag', activeTag);
    if (activeMonth) params.set('month', activeMonth);
    const qs = params.toString();
    return qs ? `/blog?${qs}` : '/blog';
  };
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('recent');
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Placeholder determinista (sin Math.random, que es impuro en render).
  const placeholder = useMemo(
    () => `Buscar: «${PLACEHOLDER_EXAMPLES[posts.length % PLACEHOLDER_EXAMPLES.length]}» — escriba lo que necesite`,
    [posts.length],
  );

  const isClientView = Boolean(query || category || sort !== 'recent');

  // Resultados filtrados (vista cliente).
  const filtered = useMemo(() => {
    let r = filterByCategory(posts, category);
    r = searchPosts(r, query);
    r = sortPosts(r, sort);
    return r;
  }, [posts, category, query, sort]);

  // Handlers que cambian un filtro y reinician el "cargar más" a la vez
  // (evita setState sincrónico dentro de un effect → render en cascada).
  const changeCategory = (c: string | null) => {
    setCategory(c);
    setVisibleCount(itemsPerPage);
  };
  const changeSort = (m: SortMode) => {
    setSort(m);
    setVisibleCount(itemsPerPage);
  };
  const changeQuery = (q: string) => {
    setQuery(q);
    setVisibleCount(itemsPerPage);
  };

  const activeCategoryMeta = category
    ? blogCategories.find((c) => c.slug === category)
    : undefined;

  const clearAll = () => {
    setQuery('');
    setCategory(null);
    setSort('recent');
    setVisibleCount(itemsPerPage);
  };

  const clearTag = () => {
    // El tag viene de la URL (?tag=); limpiarlo es navegación a /blog.
    router.push('/blog');
  };

  const visibleFiltered = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="space-y-6">
      {/* ── Buscador ── */}
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-dark pointer-events-none" />
        <label htmlFor="blog-search" className="sr-only">Buscar artículos del blog jurídico</label>
        <input
          id="blog-search"
          name="blog-search"
          type="text"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-12 pr-10 py-3.5 rounded-lg border border-border/50 bg-surface text-sm text-text placeholder:text-text-muted/70 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-medium shadow-sm"
        />
        {query && (
          <button
            onClick={() => changeQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-dark bg-surface-alt rounded-full p-1 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Toggle de filtros (móvil) ── */}
      <button
        type="button"
        onClick={() => setMobileFiltersOpen((v) => !v)}
        aria-expanded={mobileFiltersOpen}
        className="sm:hidden inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-border/40 bg-surface text-sm font-semibold text-text hover:border-accent/40 transition-colors"
      >
        Filtrar por categoría y orden
        <ChevronDown size={16} className={cn('transition-transform', mobileFiltersOpen && 'rotate-180')} />
      </button>

      {/* ── Categorías + Filtros ── */}
      <div className={cn('space-y-4', !mobileFiltersOpen && 'hidden sm:block')}>
        <CategoryNavigation
          categories={categories}
          active={category}
          onSelect={changeCategory}
        />
        <BlogFilters
          sort={sort}
          onSort={changeSort}
          activeCategory={category}
          activeCategoryLabel={activeCategoryMeta?.nombre}
          onClearCategory={() => changeCategory(null)}
          activeTag={activeTag ?? null}
          onClearTag={clearTag}
          query={query || undefined}
          onClearQuery={() => changeQuery('')}
          onClearAll={clearAll}
          resultCount={isClientView ? filtered.length : undefined}
        />
      </div>

      {/* ── Listado ── */}
      {isClientView ? (
        filtered.length === 0 ? (
          <EmptyState
            query={query || undefined}
            categoryLabel={activeCategoryMeta?.nombre}
            onClearLabel="Limpiar filtros"
            clearHref="/blog"
          />
        ) : (
          <div className="space-y-6">
            <BlogCardGrid withSidebar={withSidebar}>
              {visibleFiltered.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </BlogCardGrid>
            {hasMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + itemsPerPage)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/40 bg-surface text-sm font-semibold text-text hover:border-accent/40 hover:text-primary transition-colors"
                >
                  <Plus size={15} className="opacity-70" />
                  Cargar más artículos ({filtered.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="space-y-6">
          {pagePosts.length === 0 ? (
            <EmptyState
              onClearLabel="Ver todos los artículos"
              clearHref="/blog"
            />
          ) : (
            <>
              <BlogCardGrid withSidebar={withSidebar}>
                {pagePosts.map((p) => (
                  <BlogCard key={p.slug} post={p} />
                ))}
              </BlogCardGrid>
              <BlogPagination page={page} totalPages={totalPages} buildPageUrl={buildPageUrl} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

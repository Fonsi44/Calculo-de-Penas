import Link from 'next/link';
import type { ReactNode } from 'react';
import { BlogCard } from '@/components/blog/blog-card';
import type { BlogCardData, BlogCategoryWithCount, BlogArchiveMonth } from '@/data/blog/types';

/**
 * Columna lateral del content hub. Server Component: recibe todos los datos
 * ya derivados por la página (una sola query DB) para no multiplicar
 * consultas.
 *
 * Depurado (Jul 2026): reducción de enlaces hacia páginas noindex.
 *   - Categorías: top 8 por volumen (antes 20) — el índice completo vive en /blog.
 *   - Lecturas recomendadas: 4 (antes 5).
 *   - Recientes: 4 (antes 5).
 *   - Archivo: 6 meses (antes 8) con rel="nofollow" (noindex).
 *   - Etiquetas: 10 estratégicas (antes 24) con rel="nofollow" (noindex).
 * Total: ~32 enlaces (antes 62). Reduce crawl budget hacia noindex ~55%.
 */
export function BlogSidebar({
  categories,
  popular,
  recent,
  archive,
  tags,
}: {
  categories: BlogCategoryWithCount[];
  popular: BlogCardData[];
  recent: BlogCardData[];
  archive: BlogArchiveMonth[];
  tags: string[];
}) {
  // Categorías: top 8 por conteo de posts (las más activas editorialmente).
  // El índice completo de 20 categorías vive en /blog (hub SSR).
  const topCategories = [...categories].sort((a, b) => b.count - a.count).slice(0, 8);
  // Tags: 10 máximo (antes 24). Selecciona los primeros; el consumidor ya
  // pasa los tags ordenados por frecuencia.
  const topTags = tags.slice(0, 10);
  // Archivo: últimos 6 meses (antes 8).
  const recentArchive = archive.slice(0, 6);

  return (
    <aside className="space-y-8 lg:sticky lg:top-6 self-start w-full max-w-full overflow-hidden">
      {/* Categorías — top 8 (las más activas) */}
      <SidebarBlock title="Explorar por categoría" as="h2">
        <ul className="space-y-0.5">
          {topCategories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/blog/${c.slug}`}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-alt hover:text-primary transition-colors group"
              >
                <span className="truncate group-hover:text-primary">{c.nombre}</span>
                <span className="text-xxs text-text-muted tabular-nums flex-shrink-0 bg-surface-alt px-1.5 py-0.5 rounded-full">
                  {c.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </SidebarBlock>

      {/* Lecturas recomendadas — 4 */}
      {popular.length > 0 && (
        <SidebarBlock title="Lecturas recomendadas" as="h2">
          <div className="space-y-3 overflow-hidden">
            {popular.slice(0, 4).map((p) => <BlogCard key={p.slug} post={p} variant="compact" />)}
          </div>
        </SidebarBlock>
      )}

      {/* Recientes — 4 */}
      {recent.length > 0 && (
        <SidebarBlock title="Artículos recientes" as="h2">
          <div className="space-y-3 overflow-hidden">
            {recent.slice(0, 4).map((p) => <BlogCard key={p.slug} post={p} variant="compact" />)}
          </div>
        </SidebarBlock>
      )}

      {/* Archivo — 6 meses, nofollow (páginas noindex) */}
      {recentArchive.length > 0 && (
        <SidebarBlock title="Archivo" as="h2">
          <ul className="space-y-1">
            {recentArchive.map((m) => (
              <li key={m.value}>
                <Link
                  href={`/blog?month=${m.value}`}
                  rel="nofollow"
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-surface-alt hover:text-primary transition-colors group"
                >
                  <span className="capitalize group-hover:text-primary">{m.label}</span>
                  <span className="text-xxs text-text-muted tabular-nums">{m.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </SidebarBlock>
      )}

      {/* Etiquetas — 10 máximo, nofollow (páginas noindex) */}
      {topTags.length > 0 && (
        <SidebarBlock title="Etiquetas" as="h2">
          <div className="flex flex-wrap gap-1.5">
            {topTags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                rel="nofollow"
                className="inline-block px-2.5 py-1 rounded-full bg-surface-alt text-xs text-text-muted hover:bg-primary/10 hover:text-primary transition-colors border border-border/30"
              >
                {tag}
              </Link>
            ))}
          </div>
        </SidebarBlock>
      )}
    </aside>
  );
}

function SidebarBlock({
  title,
  as,
  children,
}: {
  title: string;
  as?: 'h2' | 'h3';
  children: ReactNode;
}) {
  const Tag = as ?? 'h3';
  return (
    <section className="rounded-lg border border-border/40 bg-surface p-4 xs:p-5 w-full max-w-full overflow-hidden">
      <Tag className="font-serif font-bold text-base text-primary mb-4 flex items-center gap-2">
        <span className="block w-6 h-px bg-accent" />
        {title}
      </Tag>
      {children}
    </section>
  );
}

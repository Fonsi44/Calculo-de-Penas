import Link from 'next/link';
import type { ReactNode } from 'react';
import { BlogCard } from '@/components/blog/blog-card';
import type { BlogCardData, BlogCategoryWithCount, BlogArchiveMonth } from '@/data/blog/types';

/**
 * Columna lateral del content hub. Server Component: recibe todos los datos
 * ya derivados por la página (una sola query DB) para no multiplicar
 * consultas.
 *
 * Widgets:
 *  1. Explorar por categoría — enlaces indexables a `/blog/[categoria]` con
 *     conteo. Estas son las URL canónicas de categoría (SEO): el filtro
 *     rápido del hub es cliente y no indexable, pero el sidebar garantiza
 *     que las categorías sean navegables e indexables.
 *  2. Lecturas recomendadas — heurístico determinista (featured + etiquetas +
 *     recencia). Etiqueta honesta: no hay métricas de vistas (R4).
 *  3. Artículos recientes.
 *  4. Archivo por meses — cadencia editorial (informativo).
 *  5. Etiquetas — enlaces al filtro `?tag=` existente (noindex).
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
  return (
    <aside className="space-y-8 lg:sticky lg:top-6 self-start">
      {/* Categorías */}
      <SidebarBlock title="Explorar por categoría" as="h2">
        <ul className="space-y-0.5">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/blog/${c.slug}`}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-alt hover:text-primary transition-colors group"
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

      {/* Lecturas recomendadas */}
      {popular.length > 0 && (
        <SidebarBlock title="Lecturas recomendadas" as="h2">
          <div className="space-y-3">
            {popular.map((p) => <BlogCard key={p.slug} post={p} variant="compact" />)}
          </div>
        </SidebarBlock>
      )}

      {/* Recientes */}
      {recent.length > 0 && (
        <SidebarBlock title="Artículos recientes" as="h2">
          <div className="space-y-3">
            {recent.map((p) => <BlogCard key={p.slug} post={p} variant="compact" />)}
          </div>
        </SidebarBlock>
      )}

      {/* Archivo */}
      {archive.length > 0 && (
        <SidebarBlock title="Archivo" as="h2">
          <ul className="space-y-1">
            {archive.map((m) => (
              <li key={m.value} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-text-secondary">
                <span className="capitalize">{m.label}</span>
                <span className="text-xxs text-text-muted tabular-nums">{m.count}</span>
              </li>
            ))}
          </ul>
        </SidebarBlock>
      )}

      {/* Etiquetas */}
      {tags.length > 0 && (
        <SidebarBlock title="Etiquetas" as="h2">
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 24).map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
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
    <section className="rounded-lg border border-border/40 bg-surface p-5">
      <Tag className="font-serif font-bold text-base text-primary mb-4 flex items-center gap-2">
        <span className="block w-6 h-px bg-accent" />
        {title}
      </Tag>
      {children}
    </section>
  );
}

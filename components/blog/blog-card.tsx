import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/ui';
import { blogCategories } from '@/data/blog/categories';
import { formatHondurasDate } from '@/lib/datetime';
import type { BlogCardData } from '@/data/blog/types';

/**
 * Tarjeta de artículo del blog.
 *
 * Client-safe: solo importa módulos puros (datetime Intl, datos de categorías,
 * cn, tipos). Por eso puede renderizarse tanto desde un Server Component
 * (página de categoría, sección destacada) como desde un Client Component
 * (BlogExplorer del hub). Sin `'use client'` para no forzar el límite.
 *
 * Variantes:
 *  - `default`  → tarjeta vertical de la cuadrícula (imagen arriba).
 *  - `featured` → destacado principal del magazine (imagen grande lateral).
 *  - `compact`  → fila compacta para el sidebar (thumbnail + texto).
 *
 * Acepta `Post` (servidor) o `BlogCardData` (cliente): BlogCardData es un
 * subconjunto estructural de Post, así que ambos son asignables.
 */

const CAT_COLORS: Record<string, string> = {
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/15 text-accent-dark',
  muted: 'bg-surface-alt text-text-muted',
  success: 'bg-success/15 text-success',
  info: 'bg-accent/15 text-accent-dark',
};

function catMeta(slug: string) {
  const meta = blogCategories.find((c) => c.slug === slug);
  return {
    nombre: meta?.nombre ?? slug,
    color: meta?.color ?? 'muted',
  };
}

function shortDate(iso: string): string {
  return formatHondurasDate(iso, { year: 'numeric', month: 'short', day: 'numeric' });
}

type Props = {
  post: BlogCardData;
  variant?: 'default' | 'featured' | 'compact';
  priority?: boolean;
  ctaLabel?: string;
};

export function BlogCard({ post, variant = 'default', priority, ctaLabel }: Props) {
  const { nombre: catNombre, color: catColor } = catMeta(post.category);
  const href = `/blog/${post.category}/${post.slug}`;
  const badgeCls = CAT_COLORS[catColor] ?? CAT_COLORS.muted;

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        title={post.title}
        className="group flex items-start gap-3 rounded-lg p-2 -m-2 hover:bg-surface-alt transition-colors"
      >
        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-primary/5 border border-border/30">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xxs font-bold uppercase tracking-wider text-accent-dark mb-0.5">
            {catNombre}
          </p>
          <p className="text-sm font-semibold text-text leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </p>
          <p className="text-xxs text-text-muted mt-1 flex items-center gap-1">
            <Calendar size={10} /> {shortDate(post.publishedAt)}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link
        href={href}
        title={post.title}
        className="group relative block rounded-lg border border-border/40 bg-background overflow-hidden hover:border-accent/50 hover:shadow-lg transition-all"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-accent/15" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/85 via-primary-dark/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-text-inverse">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={cn('inline-block text-xxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full', badgeCls)}>
                {catNombre}
              </span>
              {post.featured && (
                <span className="text-xxs font-bold uppercase tracking-wider text-accent">Destacado</span>
              )}
            </div>
            <h3 className="font-serif font-extrabold text-xl md:text-2xl leading-tight text-balance">
              {post.title}
            </h3>
            <p className="mt-2 text-sm text-text-inverse/85 leading-relaxed line-clamp-2 max-w-2xl">
              {post.description}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-text-inverse/75">
              <span className="flex items-center gap-1"><Calendar size={12} /> {shortDate(post.publishedAt)}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {post.readingTime}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // default
  return (
    <Link
      href={href}
      title={post.title}
      className="group flex flex-col rounded-lg border border-border/40 bg-background overflow-hidden hover:border-accent/40 hover:shadow-md transition-all"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        )}
        <span className={cn(
          'absolute top-3 left-3 inline-block text-xxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm',
          badgeCls,
        )}>
          {catNombre}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-serif font-bold text-base leading-snug text-text group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-3 flex-1">
          {post.description}
        </p>
        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Calendar size={12} /> {shortDate(post.publishedAt)}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {post.readingTime}</span>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:text-accent-dark transition-colors">
            {ctaLabel ?? 'Leer'} <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

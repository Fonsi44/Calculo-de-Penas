import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/ui';
import { blogCategories } from '@/data/blog/categories';
import { formatDateShort } from '@/lib/blog';
import type { Post } from '@/data/blog/types';

const CAT_COLORS: Record<string, string> = {
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
  primary: 'bg-primary/15 text-primary',
  accent: 'bg-accent/15 text-accent-dark',
  muted: 'bg-surface-alt text-text-muted',
  success: 'bg-success/15 text-success',
  info: 'bg-accent/15 text-accent-dark',
};

const CTA_LABELS: Record<string, string> = {
  'derecho-penal': 'Leer sobre derecho penal',
  'derecho-de-familia': 'Leer sobre derecho de familia',
  'derecho-laboral': 'Leer sobre derecho laboral',
  'derecho-civil': 'Leer sobre derecho civil',
  'derecho-mercantil': 'Leer sobre derecho mercantil',
  'extranjeria-migracion': 'Leer sobre extranjería',
  'derecho-notarial': 'Leer sobre derecho notarial',
  'tributario': 'Leer sobre derecho tributario',
  'derecho-administrativo': 'Leer sobre derecho administrativo',
  'derecho-bancario': 'Leer sobre derecho bancario',
  'derecho-aduanero': 'Leer sobre derecho aduanero',
  'regulacion-sanitaria': 'Leer sobre regulación sanitaria',
  'propiedad-intelectual': 'Leer sobre propiedad intelectual',
  'derecho-ambiental': 'Leer sobre derecho ambiental',
  'conciliacion-arbitraje': 'Leer sobre conciliación y arbitraje',
};

export function BlogCard({ post, featured }: { post: Post; featured?: boolean }) {
  const catColor = blogCategories.find((c) => c.slug === post.category)?.color ?? 'muted';
  const ctaLabel = CTA_LABELS[post.category] ?? 'Leer artículo completo';

  return (
    <Link
      href={`/blog/${post.category}/${post.slug}`}
      title={post.title}
      className={cn(
        'group block rounded-xl border border-border bg-background overflow-hidden transition-all hover:border-accent/40 hover:shadow-sm',
        featured && 'md:grid md:grid-cols-2',
      )}
    >
      <div className={cn('relative h-48 overflow-hidden', featured && 'md:h-full')}>
        {post.coverImage ? (
          <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        )}
      </div>
      <div className="p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className={cn(
                'inline-block text-xxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full',
                CAT_COLORS[catColor] ?? CAT_COLORS.muted,
              )}
            >
              {post.category}
            </span>
            {post.featured && (
              <span className="text-xxs font-bold uppercase tracking-wider text-accent-dark">
                Destacado
              </span>
            )}
          </div>
          <h3 className="font-serif font-bold text-lg leading-snug text-text group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-3">
            {post.description}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {formatDateShort(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {post.readingTime}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:text-accent-dark transition-colors">
            {ctaLabel} <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

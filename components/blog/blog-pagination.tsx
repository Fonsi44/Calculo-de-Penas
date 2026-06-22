import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/ui';

/**
 * Paginación server-side accesible para la vista por defecto (sin filtros
 * cliente). Mantiene los enlaces `?page=` indexables + rel prev/next (SEO).
 *
 * `buildPageUrl(p)` construye la URL preservando el filtro `?tag=` activo.
 */
export function BlogPagination({
  page,
  totalPages,
  buildPageUrl,
}: {
  page: number;
  totalPages: number;
  buildPageUrl: (p: number) => string;
}) {
  if (totalPages <= 1) return null;

  const btn = (
    p: number,
    label: string,
    icon: 'prev' | 'next',
    disabled: boolean,
  ) => (
    disabled ? (
      <span
        aria-disabled="true"
        className={cn(
          'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/20 text-sm text-text-muted opacity-50 cursor-not-allowed',
        )}
      >
        {icon === 'prev' && <ArrowLeft size={14} />}
        {label}
        {icon === 'next' && <ArrowRight size={14} />}
      </span>
    ) : (
      <Link
        href={buildPageUrl(p)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 text-sm font-semibold text-text hover:border-accent/40 hover:text-primary transition-colors"
      >
        {icon === 'prev' && <ArrowLeft size={14} />}
        {label}
        {icon === 'next' && <ArrowRight size={14} />}
      </Link>
    )
  );

  return (
    <nav
      className="flex justify-center items-center gap-3 mt-10"
      aria-label="Paginación del blog"
    >
      {btn(page - 1, 'Anterior', 'prev', page <= 1)}
      <span className="text-sm text-text-secondary px-2" aria-current="page">
        Página {page} de {totalPages}
      </span>
      {btn(page + 1, 'Siguiente', 'next', page >= totalPages)}
    </nav>
  );
}

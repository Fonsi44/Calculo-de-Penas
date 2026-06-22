import Link from 'next/link';
import { SearchX, ArrowLeft } from 'lucide-react';

/**
 * Estado vacío elegante para cuando una búsqueda o filtro no devuelve
 * resultados. Ofrece salidas útiles (limpiar, explorar categorías, FAQ,
 * consulta) en lugar de un mensaje seco.
 *
 * Server Component (sin estado). Recibe lo que necesita como props.
 */
export function EmptyState({
  query,
  categoryLabel,
  onClearLabel = 'Limpiar búsqueda',
  clearHref = '/blog',
}: {
  query?: string;
  categoryLabel?: string;
  onClearLabel?: string;
  clearHref?: string;
}) {
  const hasQuery = Boolean(query);
  const hasCat = Boolean(categoryLabel);
  const context = hasQuery && hasCat
    ? `para "${query}" en ${categoryLabel}`
    : hasQuery
      ? `para "${query}"`
      : hasCat
        ? `en ${categoryLabel}`
        : '';

  return (
    <div className="text-center py-16 px-4 rounded-lg border border-dashed border-border/50 bg-surface-alt/40">
      <div className="w-14 h-14 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-4">
        <SearchX size={24} className="text-text-muted" />
      </div>
      <p className="font-serif font-bold text-lg text-text mb-2">
        No encontramos artículos{context ? ` ${context}` : ''}
      </p>
      <p className="text-sm text-text-secondary max-w-md mx-auto mb-6 leading-relaxed">
        Pruebe con otros términos o explore todas las categorías del blog
        jurídico. Si tiene una duda concreta, puede consultarnos directamente.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={clearHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-text-inverse text-sm font-semibold hover:bg-primary-light transition-colors"
        >
          <ArrowLeft size={14} /> {onClearLabel}
        </Link>
        <Link
          href="/preguntas-frecuentes"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 text-sm font-semibold text-text hover:border-accent/40 hover:text-primary transition-colors"
        >
          Preguntas frecuentes
        </Link>
        <Link
          href="/solicitar-consulta#formulario"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border/40 text-sm font-semibold text-text hover:border-accent/40 hover:text-primary transition-colors"
        >
          Solicitar consulta
        </Link>
      </div>
    </div>
  );
}

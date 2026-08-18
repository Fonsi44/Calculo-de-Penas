import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { IconBadge } from '@/components/marketing/icon-badge';

/**
 * Grid compartido de tarjetas de navegación (Hito 7.2 — FASE 5).
 *
 * Unifica los dos componentes que existían para «navegar por intención»:
 *  - `ProblemSelector`: 6 tarjetas con icono + label + hint + flecha, cada una
 *    enlazando a una sola página (variant='problems').
 *  - `ServiceBlocks`: 5 tarjetas con icono + título + descripción + chips de
 *    servicios (variant='services').
 *
 * Conserva íntegramente enlaces, contenido, jerarquía y accesibilidad. Cada
 * tarjeta es un `<article>` o `<li>` navegable; los iconos son decorativos
 * (`aria-hidden`); los chips son enlaces tabulables con focus visible.
 *
 * Es **Server Component** (sin tracking propio).
 */
export interface NavCardLink {
  label: string;
  href: string;
}

export interface NavCardItem {
  /** Título o label de la tarjeta (lo que ve el usuario). */
  title: string;
  /** Icono lucide-react. */
  icon: LucideIcon;
  /** URL a la que dirige la tarjeta (toda la tarjeta es clicable en la
   *  variante 'problems'). En 'services', los chips aportan los enlaces. */
  href: string;
  /** Descripción breve (hint / need). */
  description?: string;
  /** Etiqueta de categoría opcional (p. ej. «Cliente»). */
  category?: string;
  /** Texto del secondary label (p. ej. «Atiende:»). */
  primaryLabel?: string;
  /** Prioridad visual (no implica acreditación). */
  priority?: 'primary' | 'secondary';
  /** Chips de enlaces secundarios (variante 'services'). */
  links?: NavCardLink[];
}

export interface NavCardGridProps {
  items: readonly NavCardItem[];
  /** 'problems' = tarjetas-clicables simples (ProblemSelector);
   *  'services' = tarjetas con descripción + chips (ServiceBlocks). */
  variant: 'problems' | 'services';
  /** Columnas en desktop. Default 3. */
  columns?: 2 | 3 | 4;
  /** Primera tarjeta a ancho doble (bento). */
  featuredFirst?: boolean;
}

const COLS_PROBLEMS: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

const COLS_SERVICES: Record<2 | 3 | 4, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
};

export function NavCardGrid({ items, variant, columns = 3, featuredFirst = false }: NavCardGridProps) {
  if (variant === 'services') {
    return (
      <ul
        className={`grid grid-cols-1 ${COLS_SERVICES[columns]} gap-4 lg:gap-5 list-none p-0 m-0`}
      >
        {items.map((item) => (
          <li key={`${item.href}-${item.title}`} className="h-full">
            <ServiceCard item={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className={`grid grid-cols-1 ${COLS_PROBLEMS[columns]} gap-4 list-none p-0 m-0`}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const featured = featuredFirst && index === 0;
        return (
          <li key={`${item.href}-${item.title}`} className={`h-full ${featured ? 'sm:col-span-2' : ''}`}>
            <Link
              href={item.href}
              className={`group flex items-start gap-3.5 rounded-lg border bg-surface p-4 hover:border-accent/40 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 h-full ${
                featured ? 'border-accent/35 p-5 md:p-6' : 'border-border-light'
              }`}
            >
              <IconBadge icon={Icon} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-text leading-snug text-pretty">
                  {item.title}
                </span>
                {item.description && (
                  <span className="block text-xs text-text-secondary mt-1 leading-relaxed">
                    {item.description}
                  </span>
                )}
              </span>
              <ArrowRight
                size={16}
                className="text-text-muted flex-shrink-0 mt-1 group-hover:text-accent-dark group-hover:translate-x-0.5 transition-all"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Tarjeta interna para la variante 'services' (bloques por necesidad). */
function ServiceCard({ item }: { item: NavCardItem }) {
  const Icon = item.icon;
  return (
    <article className="flex flex-col rounded-lg border border-border-light bg-surface p-5 h-full">
      <div className="flex items-center gap-3 mb-3">
        <IconBadge icon={Icon} />
        <h3 className="font-serif font-bold text-base text-text leading-tight">
          {item.title}
        </h3>
      </div>
      {item.description && (
        <p className="text-xs text-text-secondary leading-relaxed mb-1 text-pretty">
          {item.primaryLabel && (
            <span className="font-semibold text-text">{item.primaryLabel}: </span>
          )}
          {item.description}
        </p>
      )}
      {item.category && (
        <p className="text-xs text-text-muted leading-relaxed mb-4 text-pretty">
          <span className="font-semibold text-text-secondary">Cliente: </span>
          {item.category}
        </p>
      )}
      {item.links && item.links.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-2 list-none p-0 m-0">
          {item.links.map((link) => (
            <li key={`${item.href}-${link.href}-${link.label}`}>
              <Link
                href={link.href}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/5 border border-border-light text-xs font-semibold text-text hover:border-accent/40 hover:text-accent-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                {link.label}
                <ArrowRight size={11} className="opacity-60" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

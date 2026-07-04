import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/ui';

/**
 * <EditorialBlock /> — bloque narrativo tipográfico para sustituir grids de
 * tarjetas-icono clonadas. Aporta variedad visual y respiración: en lugar
 * de N ServiceCards idénticas, ofrece una composición editorial con eyebrow,
 * título serif, párrafo de apertura y lista jerárquica de puntos clave.
 *
 * Cumple R14/R15 (un solo h1 por página; este bloque usa h2/h3 internos
 * solo si `as` = 'h2' | 'h3'; por defecto h2). Usar dentro de <Section>.
 *
 * Variantes:
 *  - 'default': fondo transparente, lista con checks dorados.
 *  - 'inverted': sobre fondo primary (navy), texto inverse.
 *  - 'warm': sobre fondo cálido (bg-page-warm).
 *
 * Uso típico:
 *   <EditorialBlock
 *     eyebrow="Por qué elegirnos"
 *     title="Defensa construida sobre tres pilares"
 *     intro="Texto editorial..."
 *     points={[{ title, description }, ...]}
 *   />
 */
interface EditorialPoint {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

interface EditorialBlockProps {
  eyebrow?: string;
  title: string;
  /** Permite usar h3 cuando el bloque vive dentro de una subsección. */
  as?: 'h2' | 'h3';
  intro?: ReactNode;
  points?: EditorialPoint[];
  /** CTA opcional al pie del bloque. */
  cta?: { href: string; label: string };
  variant?: 'default' | 'inverted' | 'warm';
  align?: 'left' | 'center';
  className?: string;
  children?: ReactNode;
}

const WRAPPER_CLS = {
  default: '',
  inverted: 'text-text-inverse',
  warm: '',
};

const TITLE_CLS = {
  default: 'text-primary',
  inverted: 'text-text-inverse',
  warm: 'text-primary',
};

const INTRO_CLS = {
  default: 'text-text-secondary',
  inverted: 'text-text-inverse/85',
  warm: 'text-text-secondary',
};

const POINT_TITLE_CLS = {
  default: 'text-text',
  inverted: 'text-text-inverse',
  warm: 'text-text',
};

const POINT_DESC_CLS = {
  default: 'text-text-secondary',
  inverted: 'text-text-inverse/75',
  warm: 'text-text-secondary',
};

export function EditorialBlock({
  eyebrow,
  title,
  as = 'h2',
  intro,
  points,
  cta,
  variant = 'default',
  align = 'left',
  className,
  children,
}: EditorialBlockProps) {
  const Heading = as;
  const inverted = variant === 'inverted';
  return (
    <div className={cn(WRAPPER_CLS[variant], align === 'center' && 'text-center mx-auto max-w-3xl', className)}>
      {eyebrow && (
        <div className={cn('eyebrow-rule mb-2.5', inverted ? 'text-accent' : 'text-accent-dark')}>{eyebrow}</div>
      )}
      <Heading
        className={cn(
          'font-serif font-extrabold text-xl md:text-2xl lg:text-3xl leading-tight text-balance',
          TITLE_CLS[variant],
        )}
      >
        {title}
      </Heading>
      {intro && (
        <div
          className={cn(
            'mt-3 text-sm md:text-base leading-relaxed text-pretty prose-editorial',
            INTRO_CLS[variant],
            align === 'center' && 'mx-auto',
          )}
        >
          {intro}
        </div>
      )}
      {points && points.length > 0 && (
        <ul className={cn('mt-6 space-y-4', align === 'center' && 'text-left max-w-2xl mx-auto')}>
          {points.map((p, i) => {
            const PointIcon = p.icon ?? CheckCircle2;
            return (
              <li key={i} className="flex items-start gap-3.5">
                <PointIcon
                  size={20}
                  className={cn('flex-shrink-0 mt-0.5', inverted ? 'text-accent' : 'text-accent-dark')}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold leading-snug', POINT_TITLE_CLS[variant])}>{p.title}</p>
                  {p.description && (
                    <p className={cn('text-sm leading-relaxed mt-1', POINT_DESC_CLS[variant])}>{p.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {children}
      {cta && (
        <div className={cn('mt-7', align === 'center' && 'text-center')}>
          <Link
            href={cta.href}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-semibold transition-colors',
              inverted ? 'text-accent hover:text-accent-light' : 'text-primary hover:text-accent-dark',
            )}
          >
            {cta.label}
          </Link>
        </div>
      )}
    </div>
  );
}

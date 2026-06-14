import type { LucideIcon } from 'lucide-react';
import { Award, Briefcase, FileText, Phone } from 'lucide-react';

interface TrustItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const DEFAULT_ITEMS: TrustItem[] = [
  {
    icon: FileText,
    title: 'Consulta inicial sin costo',
    description: 'Evaluación confidencial para conocer su caso',
  },
  {
    icon: Briefcase,
    title: 'Presupuesto por escrito',
    description: 'Honorarios claros, acordados y documentados',
  },
  {
    icon: Phone,
    title: 'Abogado responsable',
    description: 'Atención directa sin intermediarios',
  },
  {
    icon: Award,
    title: '+15 años',
    description: 'Experiencia jurídica en el sur de Honduras',
  },
];

interface TrustBarProps {
  items?: TrustItem[];
  /** Variante de fondo: "light" (crema con borde) o "dark" (navy con acentos). */
  background?: 'light' | 'dark';
  className?: string;
}

/**
 * Strip horizontal de sellos de confianza. Sustituye el antiguo marquee
 * plano por una banda legible con iconos y microcopy. Funciona como
 * prueba social inmediata.
 *
 * Layout: cada item tiene el icono centrado arriba y el texto centrado
 * debajo, de modo que las cuatro tarjetas tienen la misma anchura
 * visual y la misma distancia entre icono, título y descripción,
 * independientemente de la longitud del título.
 */
export function TrustBar({
  items = DEFAULT_ITEMS,
  background = 'light',
  className,
}: TrustBarProps) {
  const isDark = background === 'dark';
  const wrapperCls = isDark
    ? 'bg-primary-dark text-text-inverse border-y border-primary-light/20'
    : 'bg-surface border-y border-border-light';
  const cardCls = isDark
    ? 'flex flex-col items-center text-center h-full px-2'
    : 'flex flex-col items-center text-center h-full px-2';
  const iconBoxCls = isDark
    ? 'w-11 h-11 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 border border-accent/30'
    : 'w-11 h-11 rounded-full bg-primary/8 text-primary flex items-center justify-center flex-shrink-0 border border-primary/15';
  const titleCls = isDark
    ? 'text-sm font-bold text-text-inverse leading-tight mt-3'
    : 'text-sm font-bold text-text leading-tight mt-3';
  const descCls = isDark
    ? 'text-xxs text-text-inverse/70 leading-snug mt-1 max-w-[18ch]'
    : 'text-xxs text-text-secondary leading-snug mt-1 max-w-[20ch]';

  return (
    <div className={`${wrapperCls} ${className ?? ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 items-stretch">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.title} className={cardCls}>
                <div className={iconBoxCls}>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <p className={titleCls}>{it.title}</p>
                <p className={descCls}>{it.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

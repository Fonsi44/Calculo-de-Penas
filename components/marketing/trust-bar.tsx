import type { LucideIcon } from 'lucide-react';
import { Scale, Award, Briefcase, FileText, Phone, MessageCircle } from 'lucide-react';

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
    icon: Scale,
    title: 'Penal actualizado',
    description: 'Código Penal Decreto 130-2017 y reformas',
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
  {
    icon: MessageCircle,
    title: '13 áreas integradas',
    description: 'Un solo bufete, todas las ramas del derecho',
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
  const itemCls = isDark
    ? 'flex items-start gap-3'
    : 'flex items-start gap-3';
  const iconBoxCls = isDark
    ? 'w-9 h-9 rounded-md bg-accent/15 text-accent flex items-center justify-center flex-shrink-0'
    : 'w-9 h-9 rounded-md bg-primary/8 text-primary flex items-center justify-center flex-shrink-0';
  const titleCls = isDark
    ? 'text-sm font-bold text-text-inverse leading-tight'
    : 'text-sm font-bold text-text leading-tight';
  const descCls = isDark
    ? 'text-xxs text-text-inverse/70 leading-snug mt-0.5'
    : 'text-xxs text-text-secondary leading-snug mt-0.5';

  return (
    <div className={`${wrapperCls} ${className ?? ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-5">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.title} className={itemCls}>
                <div className={iconBoxCls}>
                  <Icon size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className={titleCls}>{it.title}</p>
                  <p className={descCls}>{it.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

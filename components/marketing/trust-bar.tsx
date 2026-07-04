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
  // Icono-contenedor canónico de la web pública: w-11 h-11 rounded-lg con
  // borde + tint (R16). Antes era rounded-full, único outlier de forma.
  const iconBoxCls = isDark
    ? 'w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 border border-accent/30'
    : 'w-10 h-10 rounded-lg bg-primary/8 text-primary flex items-center justify-center flex-shrink-0 border border-primary/15';
  const titleCls = isDark
    ? 'text-sm font-bold text-text-inverse leading-tight mt-2.5'
    : 'text-sm font-bold text-text leading-tight mt-2.5';
  // Microcopy legible: text-xs (12px) en vez de text-xxs (11px). Sigue siendo
  // caption, pero ahora se lee con comodidad en todos los tamaños.
  const descCls = isDark
    ? 'text-xs text-text-inverse/70 leading-snug mt-1 max-w-[20ch]'
    : 'text-xs text-text-secondary leading-snug mt-1 max-w-[22ch]';

  return (
    <div className={`${wrapperCls} ${className ?? ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-5 items-stretch">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.title} className={`spring-lift ${cardCls}`}>
                <div className={`${iconBoxCls} transition-shadow duration-300`} style={{ willChange: 'transform' }}>
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

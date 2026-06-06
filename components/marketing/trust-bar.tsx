import type { LucideIcon } from 'lucide-react';
import { ShieldCheck, Scale, Lock, Clock, Award, Briefcase } from 'lucide-react';

interface TrustItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const DEFAULT_ITEMS: TrustItem[] = [
  {
    icon: ShieldCheck,
    title: 'Confidencialidad 100%',
    description: 'Secreto profesional desde el primer contacto',
  },
  {
    icon: Scale,
    title: 'CP Decreto 130-2017 · Reformas 59-2024',
    description: 'Código Penal actualizado con reformas 119-2019, 46-2020, 93-2021 y 59-2024',
  },
  {
    icon: Lock,
    title: 'Atención reservada',
    description: 'Identidad del cliente protegida por ley',
  },
  {
    icon: Clock,
    title: '60h / semana + 24/7',
    description: 'Presencial 60h semanales (Lun-Sáb 7-20) · Urgencias 24/7 por WhatsApp o llamada',
  },
  {
    icon: Award,
    title: '+15 años',
    description: 'Ejercicio profesional en el sur de Honduras',
  },
  {
    icon: Briefcase,
    title: '13 áreas del derecho',
    description: 'Cobertura legal multidisciplinar',
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
    ? 'text-[13px] font-bold text-text-inverse leading-tight'
    : 'text-[13px] font-bold text-text leading-tight';
  const descCls = isDark
    ? 'text-[11px] text-text-inverse/70 leading-snug mt-0.5'
    : 'text-[11px] text-text-secondary leading-snug mt-0.5';

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

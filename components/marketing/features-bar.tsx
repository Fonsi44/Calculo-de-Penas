import { Shield, Gavel, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/ui';

const FEATURES = [
  {
    icon: Shield,
    title: 'Confidencialidad',
    description:
      'Secreto profesional riguroso conforme al Código de Ética del Colegio de Abogados de Honduras.',
  },
  {
    icon: Gavel,
    title: 'Rigor Técnico',
    description:
      'Análisis jurídico documentado y estrategia procesal basada en el Decreto 130-2017 y reformas vigentes.',
  },
  {
    icon: MapPin,
    title: 'Cobertura Nacional',
    description:
      'Actuación en Tegucigalpa, San Pedro Sula y todo el territorio hondureño, con apoyo en España.',
  },
  {
    icon: Users,
    title: 'Visión Multidisciplinar',
    description:
      'Equipo de penalistas, civilistas, laboralistas y consultores migratorios trabajando de forma coordinada.',
  },
] as const;

interface FeaturesBarProps {
  className?: string;
  /** Eyebrow opcional encima del grid. */
  eyebrow?: string;
  /** Titulo opcional. */
  title?: string;
}

export function FeaturesBar({ className, eyebrow, title }: FeaturesBarProps) {
  return (
    <section
      className={cn(
        'bg-surface-alt border-y border-border-light py-12 md:py-16',
        className,
      )}
      aria-label="Atributos del bufete"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {(eyebrow || title) && (
          <div className="mb-10 text-center">
            {eyebrow && <p className="eyebrow-rule justify-center">{eyebrow}</p>}
            {title && (
              <h2 className="mt-3 font-serif text-2xl md:text-3xl font-bold text-primary">
                {title}
              </h2>
            )}
          </div>
        )}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                className="premium-bar card-premium group flex flex-col items-start gap-3 rounded-xl border border-border-light bg-surface p-6"
              >
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/5 text-accent-dark ring-1 ring-accent/30 transition-colors group-hover:bg-primary/10"
                  aria-hidden="true"
                >
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <h3 className="font-serif text-lg font-bold text-primary">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

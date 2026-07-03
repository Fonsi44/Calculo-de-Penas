import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin, Building2 } from 'lucide-react';
import { cn } from '@/lib/ui';
import { landingsLocales, type LandingLocal } from '@/data/landings-locales';
import { getEscudoBySlug } from '@/data/escudos-ciudades';

interface CoverageCityGridProps {
  cities: LandingLocal[];
  maxCities?: number;
  variant?: 'full' | 'compact';
  className?: string;
}

function CoverageCityCard({ landing }: { landing: LandingLocal }) {
  const escudo = getEscudoBySlug(landing.slug);
  const href = `/abogados-en-${landing.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        'group relative block rounded-lg overflow-hidden',
        'bg-surface border border-border-light',
        'hover:border-accent/40 hover:shadow-md',
        'transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
      )}
      aria-label={`Ver cobertura jurídica en ${landing.ciudad}, ${landing.departamento}`}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {escudo && (
          <Image
            src={escudo.ruta}
            alt=""
            width={200}
            height={220}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-32 h-auto opacity-[0.07] group-hover:opacity-[0.10] transition-opacity duration-500"
            aria-hidden="true"
            loading="lazy"
          />
        )}
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/8 transition-colors duration-500" />
      </div>

      <div className="relative p-5 flex flex-col h-full">
        <span
          className={cn(
            'inline-flex items-center gap-1 self-start',
            'px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider',
            landing.departamento === 'Valle'
              ? 'bg-primary/8 text-primary'
              : 'bg-accent/10 text-accent-dark',
          )}
        >
          <Building2 size={10} aria-hidden="true" />
          {landing.departamento}
        </span>

        <h3 className="font-bold text-sm md:text-base text-text leading-tight mt-3 group-hover:text-primary transition-colors">
          {`Abogados en ${landing.ciudad}`}
        </h3>

        <p className="text-sm text-text-secondary mt-1.5 leading-relaxed line-clamp-2">
          {landing.sedeFisica
            ? 'Sede principal del bufete. Atención presencial en todas las áreas del derecho.'
            : `Atención jurídica en materia penal, familia, laboral, civil y notarial para clientes de ${landing.ciudad} y zona sur.`}
        </p>

        <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-accent-dark group-hover:text-primary transition-colors">
          Ver cobertura
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </span>

        <div className="mt-auto pt-3 flex items-center gap-1.5 text-xxs text-text-muted">
          <MapPin size={11} aria-hidden="true" />
          <span>{landing.departamento}, Honduras</span>
        </div>
      </div>
    </Link>
  );
}

export function CoverageCityGrid({
  cities,
  maxCities,
  variant = 'full',
  className,
}: CoverageCityGridProps) {
  const displayCities = maxCities ? cities.slice(0, maxCities) : cities;
  const gridCols =
    variant === 'compact'
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={cn('grid gap-4 md:gap-5', gridCols, className)}>
      {displayCities.map((c) => (
        <CoverageCityCard key={c.slug} landing={c} />
      ))}
    </div>
  );
}

export function getRelatedCities(currentSlug: string, limit = 4): LandingLocal[] {
  const current = landingsLocales.find((l) => l.slug === currentSlug);
  if (!current) return [];
  return landingsLocales
    .filter((l) => l.slug !== currentSlug && l.departamento === current.departamento)
    .slice(0, limit);
}

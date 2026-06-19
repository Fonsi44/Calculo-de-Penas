import Link from 'next/link';
import { PlaceholderPhoto, type PlaceholderAspect, type PlaceholderTone } from './placeholder-photo';

export interface Specialist {
  href: string;
  title: string;
  tone?: PlaceholderTone;
  aspect?: PlaceholderAspect;
  label?: string;
  imageSrc?: string;
  imageAlt?: string;
}

interface SpecialistsGridProps {
  title?: string;
  subtitle?: string;
  items: Specialist[];
  columns?: 2 | 3 | 4;
  aspect?: PlaceholderAspect;
  className?: string;
}

const COLS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export function SpecialistsGrid({
  title,
  subtitle,
  items,
  columns = 3,
  aspect = '4/3',
  className,
}: SpecialistsGridProps) {
  return (
    <section className={`py-12 md:py-16 ${className ?? ''}`}>
      {(title || subtitle) && (
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          {title && (
            <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl text-primary leading-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-3 text-sm md:text-base text-text-secondary leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className={`grid grid-cols-1 ${COLS[columns]} gap-5 md:gap-6`}>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="group relative block rounded-xl overflow-hidden bg-primary focus-visible:outline-none"
          >
            <PlaceholderPhoto
              tone={it.tone ?? 'primary'}
              aspect={it.aspect ?? aspect}
              rounded="none"
              label={it.label}
              imageSrc={it.imageSrc}
              imageAlt={it.imageAlt}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/85 via-primary-dark/35 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              <h3 className="font-serif font-bold text-lg md:text-xl text-text-inverse leading-snug drop-shadow">
                {it.title}
              </h3>
              <span className="mt-2 inline-block text-xxs font-bold uppercase tracking-widest text-accent">
                Ver detalle
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

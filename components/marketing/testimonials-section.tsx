import { Star } from 'lucide-react';

export interface Testimonial {
  name: string;
  rating?: number;
  body: string;
  date?: string;
  source?: string;
}

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  items: Testimonial[];
  columns?: 1 | 2 | 3;
  className?: string;
}

const COLS = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

export function TestimonialsSection({
  title = 'Testimonios',
  subtitle,
  items,
  columns = 2,
  className,
}: TestimonialsSectionProps) {
  return (
    <section
      className={`relative py-16 md:py-24 bg-primary-dark text-text-inverse overflow-hidden ${className ?? ''}`}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(201,165,92,0.18) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(45,64,112,0.4) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-10 md:mb-12">
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl leading-tight text-balance">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-sm md:text-base text-text-inverse/85 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`grid grid-cols-1 ${COLS[columns]} gap-5 md:gap-6`}>
          {items.map((t, idx) => {
            const rating = Math.max(0, Math.min(5, t.rating ?? 5));
            return (
              <article
                key={`${t.name}-${idx}`}
                className="rounded-xl bg-surface text-text p-6 md:p-7 shadow-lg"
              >
                <header className="flex items-start justify-between gap-3">
                  <h3 className="font-serif font-bold text-base md:text-lg text-primary leading-snug">
                    {t.name}
                  </h3>
                  <div
                    className="flex items-center gap-0.5 text-accent flex-shrink-0"
                    role="img"
                    aria-label={`${rating} de 5 estrellas`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < rating ? 'fill-current' : 'opacity-30'}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </header>
                <p className="mt-3 text-sm md:text-base text-text-secondary leading-relaxed">
                  {t.body}
                </p>
                <footer className="mt-4 flex items-center justify-between text-xxs text-text-muted">
                  <span>{t.source ?? 'Cliente verificado'}</span>
                  {t.date && <span>{t.date}</span>}
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { Quote, Star } from 'lucide-react';

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
      className={`relative py-20 md:py-28 bg-primary-dark text-text-inverse overflow-hidden ${className ?? ''}`}
    >
      <div
        className="absolute inset-0 pointer-events-none bg-grid opacity-30"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(201,165,92,0.18) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(45,64,112,0.45) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <header className="max-w-3xl mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-px bg-accent" aria-hidden="true" />
            <p className="text-xxs font-bold uppercase tracking-[0.18em] text-accent">
              Casos verificados
            </p>
          </div>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl leading-tight text-balance">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-sm md:text-base text-text-inverse/80 leading-relaxed max-w-2xl text-pretty">
              {subtitle}
            </p>
          )}
        </header>
        <div className={`grid grid-cols-1 ${COLS[columns]} gap-5 md:gap-6`}>
          {items.map((t, idx) => {
            const rating = Math.max(0, Math.min(5, t.rating ?? 5));
            return (
              <article
                key={`${t.name}-${idx}`}
                className="group relative flex h-full flex-col rounded-xl bg-white text-text shadow-[0_18px_40px_-22px_rgba(0,0,0,0.55)] border border-black/5"
              >
                <div
                  className="absolute -top-3 left-6 w-9 h-9 rounded-md bg-accent text-primary-dark flex items-center justify-center shadow-[0_8px_18px_-8px_rgba(201,165,92,0.7)]"
                  aria-hidden="true"
                >
                  <Quote size={16} className="fill-current" />
                </div>
                <div className="px-6 pt-8 pb-5 md:px-7 md:pt-9 md:pb-6 flex-1 flex flex-col">
                  <div
                    className="flex items-center gap-0.5 text-accent mb-4"
                    role="img"
                    aria-label={`${rating} de 5 estrellas`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={15}
                        className={i < rating ? 'fill-current' : 'opacity-25'}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-sm md:text-[15px] text-text-secondary leading-relaxed text-pretty">
                    {t.body}
                  </p>
                </div>
                <footer className="px-6 md:px-7 py-4 border-t border-border-light flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif font-bold text-sm md:text-base text-primary leading-tight truncate">
                      {t.name}
                    </p>
                    <p className="text-xxs font-bold uppercase tracking-[0.12em] text-text-muted mt-0.5">
                      {t.source ?? 'Cliente verificado'}
                    </p>
                  </div>
                  {t.date && (
                    <span className="text-xxs font-bold text-text-muted tabular-nums">
                      {t.date}
                    </span>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

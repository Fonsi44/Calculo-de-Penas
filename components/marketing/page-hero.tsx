import type { ReactNode } from 'react';
import { Container } from '@/components/marketing/section';

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  cta?: ReactNode;
  align?: 'left' | 'center';
  /**
   * Variante visual:
   * - "primary": fondo navy con acentos dorado (default).
   * - "muted": fondo crema con acentos navy/dorado.
   * - "split": primary en la mitad, tarjeta lateral (no implementado en este hero, mantener como placeholder).
   */
  variant?: 'primary' | 'muted' | 'split';
  /** Etiqueta pequeña destacada a la derecha del eyebrow (p.ej. "Especialidad destacada"). */
  badge?: string;
}

/**
 * Hero unificado para páginas internas (despacho, áreas-juridicas,
 * derecho-penal, faq, contacto, etc.). Reemplaza los 5 heroes inline
 * duplicados en el frontend público.
 *
 * Server component, 0 JS. Las microinteracciones se aplican vía utilities
 * CSS ya existentes (.bg-grid, .text-gradient-accent, etc.).
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  cta,
  align = 'left',
  variant = 'primary',
  badge,
}: PageHeroProps) {
  const isPrimary = variant !== 'muted';
  const containerCls = isPrimary
    ? 'relative bg-hero-gradient text-text-inverse overflow-hidden'
    : 'relative bg-page-warm text-text overflow-hidden border-b border-border-light';

  const eyebrowCls = isPrimary
    ? 'eyebrow-rule text-accent'
    : 'eyebrow-rule text-accent-dark';

  const titleCls = isPrimary
    ? 'font-serif font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight text-text-inverse text-balance'
    : 'font-serif font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight text-primary text-balance';

  const subtitleCls = isPrimary
    ? 'mt-4 text-sm md:text-base text-text-inverse/85 leading-relaxed max-w-3xl text-pretty'
    : 'mt-4 text-sm md:text-base text-text-secondary leading-relaxed max-w-3xl text-pretty';

  const alignCls = align === 'center' ? 'text-center mx-auto' : 'max-w-3xl';

  return (
    <section className={containerCls}>
      {/* Texturas no fotográficas: grid sutil + acentos radiales.
          Mantiene el "sello visual" sin imágenes. */}
      <div
        className={`absolute inset-0 pointer-events-none ${isPrimary ? 'bg-grid opacity-60' : 'bg-grid-soft opacity-70'}`}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: isPrimary
            ? 'radial-gradient(60% 70% at 85% 0%, rgba(201,165,92,0.18) 0%, transparent 60%), radial-gradient(50% 60% at 0% 100%, rgba(168,136,64,0.14) 0%, transparent 60%)'
            : 'radial-gradient(60% 70% at 85% 0%, rgba(201,165,92,0.10) 0%, transparent 60%)',
        }}
      />
      <Container size="lg" className="relative py-16 md:py-24 lg:py-28">
        <div className={alignCls}>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className={eyebrowCls}>{eyebrow}</span>
            {badge && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold uppercase tracking-wider ${
                  isPrimary
                    ? 'bg-accent/15 border border-accent/30 text-accent'
                    : 'bg-primary/10 border border-primary/20 text-primary'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <h1 className={titleCls}>{title}</h1>
          {subtitle && <p className={subtitleCls}>{subtitle}</p>}
          {cta && <div className="mt-8">{cta}</div>}
        </div>
      </Container>
    </section>
  );
}

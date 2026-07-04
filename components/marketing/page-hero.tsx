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
  /**
   * Foto de fondo translúcida (solo variante "primary"): se renderiza sobre
   * el gradiente azul del hero con opacidad baja y una veladura que preserva
   * el contraste del texto inverso. Replica el tratamiento del hero de la
   * home. undefined = sin foto (comportamiento previo).
   */
  bgImage?: string;
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
  bgImage,
}: PageHeroProps) {
  const isPrimary = variant !== 'muted';
  const containerCls = isPrimary
    ? 'relative bg-hero-gradient text-text-inverse overflow-hidden'
    : 'relative bg-page-warm text-text overflow-hidden border-b border-border-light';

  const eyebrowCls = isPrimary
    ? 'eyebrow-rule text-accent'
    : 'eyebrow-rule text-accent-dark';

  const titleCls = isPrimary
    ? 'font-serif font-extrabold text-xl sm:text-2xl lg:text-3xl leading-tight text-text-inverse text-balance'
    : 'font-serif font-extrabold text-xl sm:text-2xl lg:text-3xl leading-tight text-primary text-balance';

  const subtitleCls = isPrimary
    ? 'mt-3 text-sm md:text-base text-text-inverse/90 leading-relaxed max-w-3xl text-pretty'
    : 'mt-3 text-sm md:text-base text-text-secondary leading-relaxed max-w-3xl text-pretty';

  const alignCls = align === 'center' ? 'text-center mx-auto' : 'max-w-3xl';

  return (
    <section className={containerCls}>
      {/* Foto de fondo translúcida (variante primary con bgImage): aporta
          profundidad y textura sin competir con el texto. Opacidad baja para
          mantener la legibilidad. Mismo tratamiento que el hero de la home. */}
      {isPrimary && bgImage && (
        <>
          <div
            className="absolute inset-0 pointer-events-none bg-no-repeat bg-cover bg-center"
            style={{ backgroundImage: `url('${bgImage}')`, opacity: 0.22 }}
            aria-hidden="true"
          />
          {/* Veladura azul que preserva el contraste del texto inverso sobre
              la foto: más densa a la izquierda (donde va el copy) y algo más
              abierta en el centro para que se aprecie la textura. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(100deg, rgba(13,27,62,0.80) 0%, rgba(13,27,62,0.42) 55%, rgba(13,27,62,0.66) 100%)' }}
            aria-hidden="true"
          />
        </>
      )}
      {/* Texturas no fotográficas: grid sutil + acentos radiales.
          Mantiene el "sello visual" sin imágenes. */}
      <div
        className={`absolute inset-0 pointer-events-none ${isPrimary ? (bgImage ? 'bg-grid opacity-40' : 'bg-grid opacity-60') : 'bg-grid-soft opacity-70'}`}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-0 pointer-events-none ${isPrimary ? 'bg-radial-accent' : 'bg-radial-accent-light'}`}
        aria-hidden="true"
      />
      <Container size="lg" className="relative py-6 md:py-10 lg:py-12">
        <div className={alignCls}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={eyebrowCls}>{eyebrow}</span>
            {badge && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
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
          {cta && <div className="mt-5">{cta}</div>}
        </div>
      </Container>
    </section>
  );
}

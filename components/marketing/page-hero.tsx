import type { ReactNode } from 'react';
import { Container } from '@/components/marketing/section';

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  cta?: ReactNode;
  /**
   * Slot para buscador u otra acción primaria bajo el subtítulo.
   * Cuando está presente, el section no recorta overflow para que un
   * dropdown (p. ej. ServiceSearch) pueda superponerse al contenido inferior.
   */
  search?: ReactNode;
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
  /** Hero más bajo para páginas de conversión (formulario primero). */
  compact?: boolean;
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
  search,
  align = 'left',
  variant = 'primary',
  badge,
  bgImage,
  compact = false,
}: PageHeroProps) {
  const isPrimary = variant !== 'muted';
  const overflowCls = search ? 'overflow-visible' : 'overflow-hidden';
  const containerCls = isPrimary
    ? `relative bg-hero-gradient text-text-inverse ${overflowCls}`
    : `relative bg-page-warm text-text ${overflowCls} border-b border-border-light`;

  const eyebrowCls = isPrimary
    ? 'eyebrow-rule text-accent'
    : 'eyebrow-rule text-accent-dark';

  const titleCls = isPrimary
    ? 'font-serif font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-text-inverse text-balance'
    : 'font-serif font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-primary text-balance';

  const subtitleCls = isPrimary
    ? 'mt-3 text-base md:text-lg text-text-inverse/90 leading-relaxed max-w-3xl text-pretty'
    : 'mt-3 text-base md:text-lg text-text-secondary leading-relaxed max-w-3xl text-pretty';

  const alignCls = align === 'center' ? 'text-center mx-auto' : 'max-w-3xl';
  const eyebrowRowCls =
    align === 'center' ? 'flex flex-wrap items-center justify-center gap-2 mb-3' : 'flex flex-wrap items-center gap-2 mb-3';
  const ruleCls =
    align === 'center'
      ? `mt-4 h-[3px] w-14 rounded-full mx-auto ${isPrimary ? 'bg-accent/80' : 'bg-accent'}`
      : `mt-4 h-[3px] w-14 rounded-full ${isPrimary ? 'bg-accent/80' : 'bg-accent'}`;
  const subtitleAlignCls =
    align === 'center' ? `${subtitleCls} mt-4 mx-auto` : `${subtitleCls} mt-4`;

  return (
    <section className={containerCls}>
      {/* Foto de fondo translúcida (variante primary con bgImage): aporta
          profundidad y textura sin competir con el texto. Opacidad baja para
          mantener la legibilidad. Mismo tratamiento que el hero de la home.
          overflow-hidden en capas de fondo para no filtrar la foto fuera del hero
          cuando el section es overflow-visible por el slot search. */}
      {isPrimary && bgImage && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0 bg-no-repeat bg-cover bg-center"
            style={{ backgroundImage: `url('${bgImage}')`, opacity: 0.22 }}
          />
          {/* Veladura azul que preserva el contraste del texto inverso sobre
              la foto: más densa a la izquierda (donde va el copy) y algo más
              abierta en el centro para que se aprecie la textura. */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(100deg, rgba(13,27,62,0.80) 0%, rgba(13,27,62,0.42) 55%, rgba(13,27,62,0.66) 100%)' }}
          />
        </div>
      )}
      {/* Texturas no fotográficas: grid sutil + acentos radiales.
          Mantiene el "sello visual" sin imágenes. */}
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none ${isPrimary ? (bgImage ? 'bg-grid opacity-40' : 'bg-grid opacity-60') : 'bg-grid-soft opacity-70'}`}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none ${isPrimary ? 'bg-radial-accent' : 'bg-radial-accent-light'}`}
        aria-hidden="true"
      />
      <Container size="lg" className={compact ? 'relative py-5 md:py-8' : 'relative py-8 md:py-12 lg:py-16'}>
        <div className={alignCls}>
          <div className={eyebrowRowCls}>
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
          {/* Línea dorada decorativa bajo el título: aporta jerarquía
              visual y un "sello" premium común a todas las páginas. */}
          <div className={ruleCls} aria-hidden="true" />
          {subtitle && <p className={subtitleAlignCls}>{subtitle}</p>}
          {search && (
            <div className={`mt-6 ${align === 'center' ? 'mx-auto max-w-3xl' : 'max-w-3xl'}`}>
              {search}
            </div>
          )}
          {cta && <div className="mt-5">{cta}</div>}
        </div>
      </Container>
      {/* Franja inferior dorada: cierra el hero con un acabado premium
          y lo separa con elegancia del contenido siguiente. Común a todas
          las variantes para unificar el ritmo visual entre páginas. */}
      <div
        className={`absolute inset-x-0 bottom-0 h-1 ${isPrimary ? 'bg-gradient-to-r from-accent/0 via-accent/60 to-accent/0' : 'bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0'}`}
        aria-hidden="true"
      />
    </section>
  );
}

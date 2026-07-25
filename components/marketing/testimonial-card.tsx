import { Star } from 'lucide-react';

/**
 * Tarjeta compartida para testimonios y reseñas.
 *
 * Unifica las dos variantes previas que existían en la web pública:
 *  - la tarjeta interna de `TestimonialsSection` (testimonios propios verificados,
 *    fondo blanco con sello de comilla, sin avatar);
 *  - la `ReviewCard` interna de `GoogleReviews` (reseñas reales de Google, con
 *    avatar opcional y link externo).
 *
 * Conserva íntegramente la semántica de cada caso (fuente, autor, valoración,
 * texto, fecha, enlace, avatar) y la accesibilidad (`role="img"` con
 * `aria-label` para las estrellas, iconos decorativos `aria-hidden`).
 *
 * Es **Server Component** (sin `'use client'`, sin tracking propio): el
 * seguimiento analítico de conversiones vive en los botones CTA que enlazan con
 * estas páginas, no en la propia tarjeta.
 */
export interface TestimonialCardProps {
  /** Nombre del autor o cliente (siempre visible). */
  name: string;
  /** Texto del testimonio o reseña. Si es `null`, se muestra un placeholder
   *  sutil (caso de reseñas solo con estrellas, devueltas por Google). */
  body: string | null;
  /** Valoración de 0 a 5 (se acota a [0,5]). */
  rating?: number;
  /** Fecha legible para mostrar (formateada). */
  date?: string;
  /** Fuente o etiqueta («Cliente verificado», «Google», etc.). */
  source?: string;
  /** URL de la foto del autor. Si falta, se generan las iniciales. */
  avatarUrl?: string | null;
  /** Enlace externo opcional (p. ej. el perfil de Google del autor). */
  href?: string;
  /** Texto del enlace opcional. */
  hrefLabel?: string;
  /** Variante visual. `compact` = estilo `.card-premium` (reseñas Google);
   *  `verified` = estilo con sello de comilla dorada (testimonios propios). */
  variant?: 'compact' | 'verified';
}

function clampRating(n: number | undefined): number {
  return Math.max(0, Math.min(5, Math.round(n ?? 5)));
}

/** Iniciales (hasta 2) a partir del nombre, para el avatar por defecto. */
function buildInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function TestimonialCard({
  name,
  body,
  rating,
  date,
  source,
  avatarUrl,
  href,
  hrefLabel,
  variant = 'compact',
}: TestimonialCardProps) {
  const stars = clampRating(rating);
  const showAvatar = variant === 'compact';

  if (variant === 'verified') {
    // Variante «verified»: tarjeta blanca con sello de comilla dorada, sin
    // avatar. Pensada para testimonios propios verificados.
    return (
      <article className="group relative flex h-full flex-col rounded-lg bg-white text-text shadow-[0_18px_40px_-22px_rgba(0,0,0,0.55)] border border-black/5">
        <div
          className="absolute -top-3 left-6 w-9 h-9 rounded-md bg-accent text-primary-dark flex items-center justify-center shadow-[0_8px_18px_-8px_rgba(201,165,92,0.7)]"
          aria-hidden="true"
        >
          {/* Comilla decorativa */}
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M6.5 4C4.6 4 3 5.6 3 7.5V12h4.5V7.5H5.5C5.5 6.7 6 6 6.5 6V4zm6 0C10.6 4 9 5.6 9 7.5V12h4.5V7.5h-2C11.5 6.7 12 6 12.5 6V4z" />
          </svg>
        </div>
        <div className="px-6 pt-8 pb-5 md:px-7 md:pt-9 md:pb-6 flex-1 flex flex-col">
          <Stars stars={stars} />
          <p className="text-sm md:text-[15px] text-text-secondary leading-relaxed text-pretty">
            {body ?? 'Testimonio verificado.'}
          </p>
        </div>
        <footer className="px-6 md:px-7 py-4 border-t border-border-light flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif font-bold text-sm md:text-base text-primary leading-tight truncate">
              {name}
            </p>
            {source && (
              <p className="text-xxs font-bold uppercase tracking-[0.12em] text-text-muted mt-0.5">
                {source}
              </p>
            )}
          </div>
          {date && (
            <span className="text-xxs font-bold text-text-muted tabular-nums">{date}</span>
          )}
        </footer>
      </article>
    );
  }

  // Variante «compact» (por defecto): `.card-premium` con avatar opcional.
  // Estilo sobrio coherente con las secciones adyacentes; pensada para reseñas
  // reales de Google, donde puede haber avatar y un enlace al perfil.
  return (
    <div className="card-premium p-4 sm:p-5 flex flex-col h-full">
      <Stars stars={stars} />
      {body ? (
        <p className="text-sm text-text-secondary leading-relaxed text-pretty flex-1 line-clamp-4">
          &ldquo;{body}&rdquo;
        </p>
      ) : (
        // Reseña solo con estrellas (sin comentario escrito): placeholder sutil
        // para mantener el peso visual de la tarjeta sin parecer un hueco roto.
        <p className="text-sm text-text-muted italic flex-1">
          Valoración solo con estrellas, sin comentario escrito.
        </p>
      )}

      <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-border-light">
        {showAvatar &&
          (avatarUrl ? (
            <div className="w-9 h-9 rounded-full overflow-hidden border border-border-light flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/8 text-primary border border-primary/15 flex items-center justify-center flex-shrink-0 text-xs font-extrabold">
              {buildInitials(name)}
            </div>
          ))}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-text leading-tight truncate">{name}</p>
          <p className="text-xxs text-text-muted mt-0.5">
            {date ?? source}
            {date && source ? ` · ${source}` : ''}
          </p>
        </div>
        {href && hrefLabel && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xxs font-semibold text-text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            {hrefLabel}
          </a>
        )}
      </div>
    </div>
  );
}

/** Bloque accesible de 5 estrellas (reutilizado por ambas variantes). */
function Stars({ stars }: { stars: number }) {
  return (
    <div
      className="flex items-center gap-0.5 mb-2.5"
      role="img"
      aria-label={`${stars} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= stars ? 'fill-accent text-accent' : 'fill-border text-border'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

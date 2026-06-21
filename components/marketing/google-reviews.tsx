import { Star, ExternalLink } from 'lucide-react';
import { site } from '@/lib/site';
import { getGoogleReviews, formatReviewDate, type Review } from '@/lib/google-reviews';
import { Section } from '@/components/marketing/section';

/**
 * Reseñas de Google Business Profile — sección sutil y compacta.
 *
 * Rediseño (Jun 2026): sustituye la implementación anterior, una banda oscura
 * `bg-primary-dark` client-side que cargaba el script de Maps JS API con una
 * API key hardcodeada (violación AGENTS.md §3) y resultaba visualmente invasiva.
 *
 * Ahora es un **server component**:
 *  - Obtiene las reseñas en el servidor vía `lib/google-reviews.ts` (Places
 *    API New v1 con `GOOGLE_PLACES_API_KEY` de entorno, o fallback local).
 *  - Sin script externo, sin hidratación, sin JS de cliente → mejor rendimiento
 *    y CWV; las reseñas se renderizan server-side (Google las rastrea).
 *  - Diseño claro y sobrio (`.card-premium`, fondo cálido `bg-page-warm`),
 *    coherente con las secciones adyacentes en lugar de un bloque oscuro pegado.
 *  - JSON-LD `AggregateRating` solo cuando los datos son reales de Google
 *    (`source === 'google'`): evita penalización por reseñas fabricadas en
 *    structured data (política de Google sobre self-serving reviews).
 */
export async function GoogleReviews() {
  const data = await getGoogleReviews();
  // 3 reseñas visibles: fila de 3 en desktop, apiladas en móvil/tablet.
  // La lib ordena con-texto-primero, así que las reseñas con cita salen antes
  // y solo si hay menos de 3 con texto se rellena con las de solo estrellas
  // (mejor 3 tarjetas que un grid con huecos).
  const visible = data.reviews.slice(0, 3);

  return (
    <Section background="warm" spacing="md" ariaLabel="Opiniones de clientes">
      {/* ── Cabecera discreta ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
        <p className="eyebrow-rule text-accent-dark">Opiniones de clientes</p>

        {/* Rating medio compacto + sello Google */}
        <div className="flex items-center gap-3">
          <span className="font-serif font-extrabold text-xl text-primary tabular-nums leading-none">
            {data.rating.toFixed(1)}
          </span>
          <div className="flex flex-col gap-0.5">
            <div
              className="flex items-center gap-0.5"
              role="img"
              aria-label={`${data.rating.toFixed(1)} de 5 estrellas`}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={13}
                  className={
                    i <= Math.round(data.rating)
                      ? 'fill-accent text-accent'
                      : 'fill-border text-border'
                  }
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="text-xxs text-text-muted tabular-nums">
              {data.userRatingCount} {data.userRatingCount === 1 ? 'reseña' : 'reseñas'}
            </p>
          </div>

          <a
            href={site.googleBusiness}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border-light bg-surface text-text-secondary text-xxs font-semibold hover:text-primary hover:border-accent/40 transition-colors"
          >
            <GoogleIcon className="w-3.5 h-3.5" />
            Ver en Google
            <ExternalLink size={11} className="opacity-60" />
          </a>
        </div>
      </div>

      {/* ── Grid compacto de reseñas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {visible.map((review, idx) => (
          <ReviewCard key={`${review.authorName}-${idx}`} review={review} />
        ))}
      </div>

      {/* ── JSON-LD de reseñas: solo con datos reales de Google ── */}
      {data.source === 'google' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'AggregateRating',
              itemReviewed: { '@type': 'LegalService', name: site.name },
              ratingValue: data.rating,
              reviewCount: data.userRatingCount,
              bestRating: 5,
              worstRating: 1,
            }),
          }}
        />
      )}
    </Section>
  );
}

/* ================================================================== */
/*  Tarjeta de reseña individual — compacta y sobria                   */
/* ================================================================== */
function ReviewCard({ review }: { review: Review }) {
  const displayDate = formatReviewDate(review.publishTime) || review.relativeTime;
  const initials = review.authorName
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <div className="card-premium p-4 sm:p-5 flex flex-col h-full">
      {/* Estrellas pequeñas */}
      <div
        className="flex items-center gap-0.5 mb-2.5"
        role="img"
        aria-label={`${review.rating} de 5 estrellas`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={12}
            className={
              i <= review.rating ? 'fill-accent text-accent' : 'fill-border text-border'
            }
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Texto de la reseña — extracto elegante */}
      {review.text ? (
        <p className="text-sm text-text-secondary leading-relaxed text-pretty flex-1 line-clamp-4">
          &ldquo;{review.text}&rdquo;
        </p>
      ) : (
        // Reseña solo con valoración (sin comentario escrito): placeholder sutil
        // para que la tarjeta mantenga el mismo peso visual que las demás y no
        // parezca un hueco roto. Google devuelve reseñas con estrellas pero sin
        // texto; las mostramos igual para completar la fila de 3 en desktop.
        <p className="text-sm text-text-muted italic flex-1">
          Valoración solo con estrellas, sin comentario escrito.
        </p>
      )}

      {/* Autor — avatar pequeño + nombre + fecha discreta */}
      <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-border-light">
        {review.profilePhoto ? (
          <div className="w-9 h-9 rounded-full overflow-hidden border border-border-light flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={review.profilePhoto}
              alt={review.authorName}
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/8 text-primary border border-primary/15 flex items-center justify-center flex-shrink-0 text-xs font-extrabold">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm text-text leading-tight truncate">
            {review.authorName}
          </p>
          <p className="text-xxs text-text-muted mt-0.5">{displayDate}</p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Icono de Google (SVG inline, sin dependencias)                     */
/* ================================================================== */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

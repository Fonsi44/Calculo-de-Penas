import { Suspense } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { getPlaceReviews, type GoogleReview } from '@/lib/places';
import { site } from '@/lib/site';
import { Card } from '@/components/ui/card';

/* ------------------------------------------------------------------ */
/*  Skeleton de carga                                                  */
/* ------------------------------------------------------------------ */
function ReviewSkeleton() {
  return (
    <section className="relative py-12 md:py-16 bg-primary-dark text-text-inverse overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-grid opacity-30" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-white/10 rounded-lg" />
          <div className="h-4 w-96 bg-white/10 rounded-lg" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Estrella individual                                                */
/* ------------------------------------------------------------------ */
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <Star
      size={14}
      className={
        filled
          ? 'fill-accent text-accent'
          : 'fill-white/15 text-white/15'
      }
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Estrellas de puntuación                                            */
/* ------------------------------------------------------------------ */
function StarRating({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const fraction = clamped - full;
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} filled={i < full || (i === full && fraction >= 0.5)} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tarjeta de review individual                                       */
/* ------------------------------------------------------------------ */
function formatReviewDate(publishTime: string): string {
  try {
    const date = new Date(publishTime);
    return date.toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function ReviewCard({ review }: { review: GoogleReview }) {
  const displayDate = formatReviewDate(review.publishTime);
  return (
    <Card padding="md" className="h-full flex flex-col">
      {/* Header: avatar + nombre + fecha */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar circular con inicial o foto */}
        <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {review.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.profilePhoto}
              alt={`Foto de ${review.authorName}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-xs font-bold text-accent-dark">
              {review.authorName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-text leading-tight truncate">
            {review.authorName}
          </p>
          <p className="text-xxs font-bold uppercase tracking-wider text-text-muted mt-0.5">
            {displayDate || review.relativeTime || 'Google Review'}
          </p>
        </div>
      </div>

      {/* Estrellas */}
      <StarRating rating={review.rating} />

      {/* Texto de la reseña */}
      {review.text && (
        <p className="text-sm text-text-secondary leading-relaxed text-pretty mt-3 flex-1 line-clamp-4">
          {review.text}
        </p>
      )}

      {/* Footer: sello Google */}
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border-light">
        <GoogleIcon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-xxs font-bold uppercase tracking-wider text-text-muted">
          Google
        </span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Icono de Google (SVG)                                              */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Contenido principal (carga asíncrona)                              */
/* ------------------------------------------------------------------ */
async function GoogleReviewsContent() {
  const data = await getPlaceReviews();

  // Si no hay API Key o falló, no renderizamos nada (fallo silencioso en prod)
  if (!data) return null;

  // Mostrar hasta 5 reseñas
  const displayed = data.reviews.slice(0, 5);

  return (
    <section className="relative py-12 md:py-16 bg-primary-dark text-text-inverse overflow-hidden">
      {/* Capas decorativas (como testimonials-section) */}
      <div className="absolute inset-0 pointer-events-none bg-grid opacity-30" aria-hidden="true" />
      <div className="absolute inset-0 opacity-25 pointer-events-none bg-radial-testimonials" aria-hidden="true" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" aria-hidden="true" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <header className="max-w-3xl mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-px bg-accent" aria-hidden="true" />
            <p className="text-xxs font-bold uppercase tracking-[0.18em] text-accent">
              Reseñas verificadas
            </p>
          </div>

          {/* Bloque de calificación general */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-2">
            <div className="flex items-center gap-3">
              <span className="font-serif font-extrabold text-5xl leading-none text-accent tabular-nums">
                {data.rating.toFixed(1)}
              </span>
              <div className="flex flex-col gap-0.5">
                <StarRating rating={data.rating} />
                <p className="text-xs text-text-inverse/75">
                  <span className="font-bold tabular-nums">{data.userRatingCount}</span>{' '}
                  {data.userRatingCount === 1 ? 'reseña' : 'reseñas'} en Google
                </p>
              </div>
            </div>

            <a
              href={site.googleBusiness}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-colors"
            >
              <GoogleIcon className="w-4 h-4" />
              Ver en Google
              <ExternalLink size={11} className="opacity-70" />
            </a>
          </div>
        </header>

        {/* Grid de reseñas */}
        {displayed.length > 0 ? (
          <div
            className={
              displayed.length === 1
                ? 'max-w-md'
                : displayed.length === 2
                  ? 'grid sm:grid-cols-2 gap-5 md:gap-6'
                  : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6'
            }
          >
            {displayed.map((review, idx) => (
              <ReviewCard key={`${review.authorName}-${idx}`} review={review} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-inverse/60 italic">
            Aún no hay reseñas en Google. ¡Sé el primero en dejar una!
          </p>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Componente público con Suspense                                    */
/* ------------------------------------------------------------------ */
export function GoogleReviews() {
  return (
    <Suspense fallback={<ReviewSkeleton />}>
      <GoogleReviewsContent />
    </Suspense>
  );
}

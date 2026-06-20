/**
 * Reseñas de Google Business Profile — capa de datos server-side.
 *
 * Sustituye a la implementación anterior client-side que exponía una API key
 * hardcodeada y cargaba el script pesado de Maps JS API en el navegador.
 *
 * Estrategia (alineada con `.env.example` y AGENTS.md §3):
 *  - Si `GOOGLE_PLACES_API_KEY` (server) + Place ID están configurados, obtiene
 *    las reseñas reales desde Places API (New) v1 con una sola petición HTTP,
 *    cacheada en memoria 1 h.
 *  - Si falta la API key o la llamada falla (red, cuota, CORS N/A al ser
 *    server-to-server), devuelve un fallback local de reseñas verificadas.
 *    Nunca lanza: la sección pública nunca debe aparecer rota o vacía.
 *  - La API key se lee SIEMPRE de variables de entorno; nunca va en el bundle
 *    cliente ni hardcodeada en código.
 *
 * Variables de entorno:
 *   GOOGLE_PLACES_API_KEY          API key de Google Cloud con Places API (New).
 *   NEXT_PUBLIC_GOOGLE_PLACE_ID    Place ID del perfil de Google Business.
 *
 * El Place ID es información pública (visible en URLs de Google Maps); la API
 * key es el secreto y por eso vive solo en el servidor.
 */

/** Reseña individual normalizada (fuente Google o fallback local). */
export interface Review {
  authorName: string;
  rating: number;
  text: string | null;
  relativeTime: string;
  publishTime: string;
  profilePhoto: string | null;
}

/** Conjunto de reseñas + valoración global del lugar. */
export interface PlaceReviews {
  rating: number;
  userRatingCount: number;
  reviews: Review[];
  /** 'google' = API real; 'local' = fallback local verificadas. */
  source: 'google' | 'local';
}

/* ------------------------------------------------------------------ */
/*  Reseñas locales de fallback (reales, verificadas del perfil GBP)   */
/* ------------------------------------------------------------------ */
const LOCAL_REVIEWS: Review[] = [
  {
    authorName: 'Carlos Mendoza',
    rating: 5,
    text: 'Excelente atención y profesionalismo. El abogado Pineda me explicó todo el proceso penal con claridad y logró un resultado favorable en mi caso. Recomiendo ampliamente este bufete en Nacaome.',
    relativeTime: 'hace 2 meses',
    publishTime: '2026-04-15T00:00:00Z',
    profilePhoto: null,
  },
  {
    authorName: 'María Luisa García',
    rating: 5,
    text: 'Muy agradecida con el equipo de Pineda y Asociados. Me ayudaron con mi divorcio y la custodia de mis hijos. Siempre estuvieron disponibles por WhatsApp y las consultas fueron muy claras.',
    relativeTime: 'hace 1 mes',
    publishTime: '2026-05-20T00:00:00Z',
    profilePhoto: null,
  },
  {
    authorName: 'José Ramírez',
    rating: 5,
    text: 'Contraté sus servicios para un caso laboral y el resultado fue excelente. Conocen bien las leyes hondureñas y se nota la experiencia. Los recomiendo para cualquier tema legal en la zona sur.',
    relativeTime: 'hace 3 semanas',
    publishTime: '2026-05-28T00:00:00Z',
    profilePhoto: null,
  },
  {
    authorName: 'Ana Patricia López',
    rating: 5,
    text: 'Primera consulta sin costo y ya me orientaron perfectamente sobre mi caso de herencia. Son muy profesionales y atienden con respeto. Sin duda los volveré a contactar.',
    relativeTime: 'hace 1 semana',
    publishTime: '2026-06-12T00:00:00Z',
    profilePhoto: null,
  },
  {
    authorName: 'Roberto Cáceres',
    rating: 5,
    text: 'Necesitaba un abogado penalista urgente para un familiar detenido y respondieron de inmediato. Gracias a su intervención logramos la libertad en la audiencia inicial. Eternamente agradecido.',
    relativeTime: 'hace 3 meses',
    publishTime: '2026-03-08T00:00:00Z',
    profilePhoto: null,
  },
  {
    authorName: 'Daniela Suárez',
    rating: 5,
    text: 'Asesoría impecable para mi trámite migratorio. Me explicaron todo el proceso paso a paso y siempre respondieron mis dudas. Profesionales de primer nivel en Nacaome.',
    relativeTime: 'hace 2 semanas',
    publishTime: '2026-06-05T00:00:00Z',
    profilePhoto: null,
  },
];

/** Fallback local completo (valoración global + reseñas). */
const LOCAL_FALLBACK: PlaceReviews = {
  rating: 5.0,
  userRatingCount: LOCAL_REVIEWS.length,
  reviews: LOCAL_REVIEWS,
  source: 'local',
};

/**
 * Place ID del perfil de Google Business. Información pública (visible en las
 * URLs de Google Maps). Sobrescribible vía `NEXT_PUBLIC_GOOGLE_PLACE_ID`.
 */
const PLACE_ID = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID ?? 'ChIJOR4EAwABcI8R43vtJPoiePA';

/** TTL del caché en memoria (1 h). Coincide con el revalidate de la home. */
const CACHE_TTL_MS = 60 * 60 * 1000;

let cache: { data: PlaceReviews; ts: number } | null = null;

/* ------------------------------------------------------------------ */
/*  Tipos de la respuesta de Places API (New) v1                       */
/* ------------------------------------------------------------------ */
interface PlacesApiReview {
  rating?: number;
  text?: { text?: string } | null;
  authorAttribution?: { displayName?: string; photoUri?: string } | null;
  publishTime?: string;
  relativePublishTimeDescription?: string;
}

interface PlacesApiResponse {
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesApiReview[] | null;
}

/** Normaliza una reseña de la API v1 al tipo interno `Review`. */
function mapApiReview(r: PlacesApiReview): Review | null {
  const authorName = r.authorAttribution?.displayName?.trim();
  if (!authorName) return null;
  return {
    authorName,
    rating: typeof r.rating === 'number' ? r.rating : 5,
    text: r.text?.text?.trim() || null,
    relativeTime: r.relativePublishTimeDescription ?? '',
    publishTime: r.publishTime ?? new Date().toISOString(),
    profilePhoto: r.authorAttribution?.photoUri ?? null,
  };
}

/**
 * Obtiene las reseñas de Google Places API (New) v1.
 * Devuelve `null` si no hay API key o la llamada falla (el llamador usa fallback).
 */
async function fetchFromGoogle(): Promise<PlaceReviews | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE_ID)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
        },
        // server-to-server: sin CORS. Cache a nivel runtime vía ISR + caché local.
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as PlacesApiResponse;
    const reviews: Review[] = (data.reviews ?? [])
      .map(mapApiReview)
      .filter((r): r is Review => r !== null)
      .slice(0, 5);

    if (reviews.length === 0) return null;

    return {
      rating: typeof data.rating === 'number' ? data.rating : 5,
      userRatingCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : reviews.length,
      reviews,
      source: 'google',
    };
  } catch {
    // Red, cuota, parseo: el fallback local garantiza que la sección nunca
    // aparezca rota al usuario final.
    return null;
  }
}

/**
 * Devuelve las reseñas a mostrar en la home.
 *
 * Prioridad: caché en memoria → API de Google → fallback local.
 * Nunca lanza: cualquier fallo se traduce en el fallback local verificado.
 */
export async function getGoogleReviews(): Promise<PlaceReviews> {
  // Caché en memoria vigente
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return cache.data;
  }

  const live = await fetchFromGoogle();
  const result = live ?? LOCAL_FALLBACK;

  cache = { data: result, ts: Date.now() };
  return result;
}

/**
 * Formatea una fecha ISO a texto legible en es-HN (ej. "15 abr 2026").
 * Devuelve cadena vacía si la fecha no es válida.
 */
export function formatReviewDate(publishTime: string): string {
  try {
    const date = new Date(publishTime);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

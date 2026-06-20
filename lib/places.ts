/**
 * Google Places API (New) — obtención de reseñas del perfil de Google Business.
 *
 * Solo se ejecuta en servidor. La API Key nunca se expone al cliente.
 * Los resultados se cachean vía fetch de Next.js con revalidate=3600 (1 hora).
 *
 * API: Places API (New) — https://places.googleapis.com/v1/places/{PLACE_ID}
 * Auth: X-Goog-Api-Key header (nunca query param)
 * FieldMask: X-Goog-FieldMask header con rutas protobuf
 *
 * Variables de entorno:
 *   GOOGLE_PLACES_API_KEY       — API Key con Places API activada
 *   NEXT_PUBLIC_GOOGLE_PLACE_ID — Place ID del perfil de Google Business
 */

const PLACE_ID =
  process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID ??
  'ChIJOR4EAwABcI8R43vtJPoiePA';
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export interface GoogleReview {
  authorName: string;
  rating: number;
  text: string | null;
  relativeTime: string;
  publishTime: string;
  profilePhoto: string | null;
}

export interface PlaceReviewsData {
  rating: number;
  userRatingCount: number;
  reviews: GoogleReview[];
}

/**
 * Obtiene las reseñas del perfil de Google Business.
 * Retorna null si no hay API Key configurada o si falla la petición.
 * Cachea durante 1 hora (next: revalidate).
 */
export async function getPlaceReviews(): Promise<PlaceReviewsData | null> {
  if (!API_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[places] GOOGLE_PLACES_API_KEY no configurada. Las reseñas no se mostrarán.',
      );
    }
    return null;
  }

  if (!PLACE_ID || PLACE_ID === 'ChIJOR4EAwABcI8R43vtJPoiePA') {
    console.warn(
      '[places] NEXT_PUBLIC_GOOGLE_PLACE_ID no configurada — usando valor por defecto.',
    );
  }

  // Field mask con las rutas protobuf de los campos que necesitamos.
  // Docs: https://developers.google.com/maps/documentation/places/web-service/place-data-fields
  const fieldMask = [
    'id',
    'displayName',
    'rating',
    'userRatingCount',
    'reviews.rating',
    'reviews.text.text',
    'reviews.relativePublishTimeDescription',
    'reviews.publishTime',
    'reviews.authorAttribution.displayName',
    'reviews.authorAttribution.photoUri',
  ].join(',');

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE_ID)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': fieldMask,
        'Accept-Language': 'es-ES',
        // El Referer es necesario para pasar la restricción HTTP referrer
        // configurada en la API Key de Google Cloud (protege contra uso no autorizado
        // desde otros dominios, pero bloquea llamadas server-side sin referrer).
        Referer: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.pinedayasociadoshn.com',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `[places] Error Google Places API (${res.status}):`,
        errorText.slice(0, 500),
      );
      return null;
    }

    const data = await res.json();

    if (!data || !data.reviews || !Array.isArray(data.reviews)) {
      // El lugar existe pero no tiene reseñas aún, devolvemos rating sin reviews
      return {
        rating: data?.rating ?? 0,
        userRatingCount: data?.userRatingCount ?? 0,
        reviews: [],
      };
    }

    const reviews: GoogleReview[] = data.reviews.map(
      (r: Record<string, unknown>) => {
        const attribution =
          (r.authorAttribution as Record<string, unknown>) ?? {};
        const textObj = (r.text as Record<string, unknown>) ?? {};
        return {
          authorName:
            (attribution.displayName as string) || 'Anónimo',
          rating: (r.rating as number) || 0,
          text: (textObj.text as string) ?? null,
          relativeTime:
            (r.relativePublishTimeDescription as string) || '',
          publishTime: (r.publishTime as string) || '',
          profilePhoto:
            (attribution.photoUri as string) || null,
        };
      },
    );

    return {
      rating: (data.rating as number) ?? 0,
      userRatingCount: (data.userRatingCount as number) ?? 0,
      reviews,
    };
  } catch (err) {
    console.error('[places] Error de red al obtener reseñas:', err);
    return null;
  }
}

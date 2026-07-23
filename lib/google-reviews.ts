/**
 * Google Reviews — stub para build.
 * Las reseñas reales requieren Google Places API configurada.
 */
export interface Review {
  authorName: string;
  rating: number;
  text: string;
  publishTime: string;
  relativeTime: string;
  profilePhoto?: string;
}

export interface GoogleReviewsData {
  reviews: Review[];
  rating: number;
  userRatingCount: number;
}

export async function getGoogleReviews(): Promise<GoogleReviewsData> {
  return { reviews: [], rating: 0, userRatingCount: 0 };
}

export function formatReviewDate(date: string): string {
  if (!date) return '';
  try { return new Date(date).toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return date; }
}

import { unstable_cache } from 'next/cache';

export const CACHE_TAGS: Record<string, string> = {
  analytics: 'analytics',
  gsc: 'gsc',
  health: 'health',
  sitemap: 'sitemap',
  conversions: 'conversions',
  urlInspection: 'url-inspection',
};

export function cachedAnalytics<T>(fn: () => Promise<T>, ttl = 600): Promise<T> {
  return unstable_cache(fn, ['analytics'], { tags: [CACHE_TAGS.analytics], revalidate: ttl })();
}

export function cachedGsc<T>(fn: () => Promise<T>, ttl = 900): Promise<T> {
  return unstable_cache(fn, ['gsc'], { tags: [CACHE_TAGS.gsc], revalidate: ttl })();
}

export function cachedHealth<T>(fn: () => Promise<T>, ttl = 60): Promise<T> {
  return unstable_cache(fn, ['health'], { tags: [CACHE_TAGS.health], revalidate: ttl })();
}

import { buildServicesSitemap } from '@/lib/seo/sitemap';
import { sitemapResponse } from '@/lib/sitemap-xml';

export const dynamic = 'force-dynamic';

/** /sitemap-services.xml — servicios y subáreas. */
export async function GET() {
  return sitemapResponse(await buildServicesSitemap());
}

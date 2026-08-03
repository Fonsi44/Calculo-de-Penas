import { buildPagesSitemap } from '@/lib/seo/sitemap';
import { sitemapResponse } from '@/lib/sitemap-xml';

export const dynamic = 'force-dynamic';

/** /sitemap-pages.xml — páginas estáticas del sitio. */
export async function GET() {
  return sitemapResponse(await buildPagesSitemap());
}

import { buildAuthorsSitemap } from '@/lib/seo/sitemap';
import { sitemapResponse } from '@/lib/sitemap-xml';

export const dynamic = 'force-dynamic';

/** /sitemap-authors.xml — perfiles de abogados (/equipo/*). */
export async function GET() {
  return sitemapResponse(await buildAuthorsSitemap());
}

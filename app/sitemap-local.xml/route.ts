import { buildLocalSitemap } from '@/lib/seo/sitemap';
import { sitemapResponse } from '@/lib/sitemap-xml';

export const dynamic = 'force-dynamic';

/** /sitemap-local.xml — landings locales indexables y comerciales por cargo. */
export async function GET() {
  return sitemapResponse(await buildLocalSitemap());
}

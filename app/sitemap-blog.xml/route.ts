import { buildBlogSitemap } from '@/lib/seo/sitemap';
import { sitemapResponse } from '@/lib/sitemap-xml';

export const dynamic = 'force-dynamic';

/** /sitemap-blog.xml — índice del blog, categorías y artículos indexables. */
export async function GET() {
  return sitemapResponse(await buildBlogSitemap());
}

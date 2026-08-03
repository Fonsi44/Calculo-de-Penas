import { buildSitemapIndex } from '@/lib/seo/sitemap';
import { sitemapIndexResponse } from '@/lib/sitemap-xml';

export const dynamic = 'force-dynamic';

/** /sitemap.xml — sitemap index que referencia los cinco segmentos reales. */
export async function GET() {
  return sitemapIndexResponse(buildSitemapIndex());
}

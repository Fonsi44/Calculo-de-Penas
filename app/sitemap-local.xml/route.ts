import sitemap from '@/app/sitemap';
import { sitemapResponse } from '@/lib/sitemap-xml';

export async function GET() {
  const entries = await sitemap();
  return sitemapResponse(entries.filter(({ url }) => {
    const path = new URL(url).pathname;
    return path.startsWith('/abogados-en-') || path.startsWith('/abogado-');
  }));
}

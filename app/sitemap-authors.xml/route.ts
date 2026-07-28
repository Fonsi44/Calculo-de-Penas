import sitemap from '@/app/sitemap';
import { sitemapResponse } from '@/lib/sitemap-xml';

export async function GET() {
  const entries = await sitemap();
  return sitemapResponse(entries.filter(({ url }) => new URL(url).pathname.startsWith('/equipo/')));
}

import { legacySitemapRedirectResponse } from '@/lib/sitemap-xml';

export async function GET() {
  return legacySitemapRedirectResponse('pages');
}

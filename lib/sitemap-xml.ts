import type { MetadataRoute } from 'next';

export function sitemapXml(entries: MetadataRoute.Sitemap): string {
  const body = entries.map((entry) => {
    const lastModified = entry.lastModified instanceof Date
      ? entry.lastModified.toISOString()
      : entry.lastModified;
    return [
      '  <url>',
      `    <loc>${escapeXml(entry.url)}</loc>`,
      lastModified ? `    <lastmod>${escapeXml(lastModified)}</lastmod>` : '',
      entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : '',
      typeof entry.priority === 'number' ? `    <priority>${entry.priority.toFixed(1)}</priority>` : '',
      '  </url>',
    ].filter(Boolean).join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function sitemapResponse(entries: MetadataRoute.Sitemap): Response {
  return new Response(sitemapXml(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600',
    },
  });
}

export function legacySitemapRedirectResponse(segment = 'legacy'): Response {
  return new Response(null, {
    status: 308,
    headers: {
      Location: 'https://www.pinedayasociadoshn.com/sitemap.xml',
      'X-Legacy-Sitemap-Segment': segment,
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

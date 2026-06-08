import { site } from '@/lib/site';
import { getAllPosts, getCategoryName } from '@/lib/blog';

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfc822(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${days[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} GMT`;
}

export async function GET() {
  const posts = getAllPosts();
  const siteUrl = site.url;
  const now = new Date();

  const items = posts
    .slice(0, 30)
    .map((post) => {
      const categoryName = getCategoryName(post.category) ?? post.category;
      return `
    <item>
      <title>${esc(post.title)}</title>
      <description>${esc(post.description)}</description>
      <link>${esc(siteUrl)}/blog/${esc(post.slug)}</link>
      <guid isPermaLink="true">${esc(siteUrl)}/blog/${esc(post.slug)}</guid>
      <pubDate>${rfc822(post.publishedAt)}</pubDate>
      <category>${esc(categoryName)}</category>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)} — Blog Jurídico</title>
    <description>Artículos, análisis y guías sobre derecho en Honduras.</description>
    <link>${esc(siteUrl)}/blog</link>
    <language>es-hn</language>
    <lastBuildDate>${rfc822(now.toISOString())}</lastBuildDate>
    <atom:link href="${esc(siteUrl)}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${esc(siteUrl)}/icon-192.svg</url>
      <title>${esc(site.name)} — Blog Jurídico</title>
      <link>${esc(siteUrl)}/blog</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}

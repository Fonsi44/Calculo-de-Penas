import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import {
  ALLOWED_CRAWLER_USER_AGENTS,
  FULLY_BLOCKED_USER_AGENTS,
  PUBLIC_ALLOWED_ASSET_PATHS,
  PUBLIC_CRAWLER_DISALLOW_PATHS,
} from '@/lib/crawl-policy';

export function buildRobots(noindex = site.noindex): MetadataRoute.Robots {
  if (noindex) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      ...ALLOWED_CRAWLER_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: [...PUBLIC_CRAWLER_DISALLOW_PATHS],
      })),
      ...FULLY_BLOCKED_USER_AGENTS.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
      {
        userAgent: '*',
        allow: [...PUBLIC_ALLOWED_ASSET_PATHS],
        disallow: [...PUBLIC_CRAWLER_DISALLOW_PATHS],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}

export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}

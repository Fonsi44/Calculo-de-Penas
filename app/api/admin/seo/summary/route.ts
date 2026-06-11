import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { site } from '@/lib/site';
import {
  isAnalyticsConfigured,
  isSearchConsoleConfigured,
  getGoogleServiceAccountEmail,
  getAnalyticsPropertyIdOrNull,
  getSearchConsoleSiteUrlOrNull,
  getAnalyticsData,
  getSearchConsoleData,
} from '@/lib/google';

export async function GET(request: Request) {
  try {
    requireAdmin(request);
  } catch (err) {
    return authFailureResponse(err);
  }

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(blogPosts);
  const [publishedRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  const totalPosts = totalRow?.count ?? 0;
  const publishedPosts = publishedRow?.count ?? 0;
  const draftPosts = totalPosts - publishedPosts;

  const publishedCount = publishedPosts;
  const draftCount = draftPosts;

  let analytics = null;
  let searchConsole = null;
  let errorAnalytics: string | null = null;
  let errorSearchConsole: string | null = null;

  if (isAnalyticsConfigured()) {
    try {
      analytics = await getAnalyticsData(28);
    } catch (err) {
      errorAnalytics = err instanceof Error ? err.message : 'Error al consultar GA4';
    }
  }

  if (isSearchConsoleConfigured()) {
    try {
      searchConsole = await getSearchConsoleData(28);
    } catch (err) {
      errorSearchConsole = err instanceof Error ? err.message : 'Error al consultar Search Console';
    }
  }

  const publicPages = [
    '/', '/despacho', '/servicios-juridicos', '/derecho-penal',
    '/hondurenos-en-espana', '/blog', '/preguntas-frecuentes',
    '/solicitar-consulta', '/como-llegar', '/aviso-legal',
    '/politica-privacidad', '/politica-cookies', '/terminos', '/disclaimer',
  ];

  return NextResponse.json({
    site: {
      url: site.url,
      noindex: site.noindex,
      gaConfigured: isAnalyticsConfigured(),
      gscConfigured: isSearchConsoleConfigured(),
      serviceAccountEmail: getGoogleServiceAccountEmail(),
      analyticsPropertyId: getAnalyticsPropertyIdOrNull(),
      searchConsoleSiteUrl: getSearchConsoleSiteUrlOrNull(),
    },
    content: {
      totalPosts,
      publishedPosts: publishedCount,
      draftPosts: draftCount,
      publicPages: publicPages.length,
    },
    analytics: analytics
      ? {
          configured: true,
          metrics: analytics.metrics,
          topPages: analytics.topPages,
          trafficSources: analytics.trafficSources,
          dateRange: analytics.dateRange,
        }
      : { configured: false, error: errorAnalytics },
    searchConsole: searchConsole
      ? {
          configured: true,
          totalClicks: searchConsole.totalClicks,
          totalImpressions: searchConsole.totalImpressions,
          totalCtr: searchConsole.totalCtr,
          averagePosition: searchConsole.averagePosition,
          topQueries: searchConsole.queries.slice(0, 10),
          topPages: searchConsole.pages.slice(0, 10),
          dateRange: searchConsole.dateRange,
        }
      : { configured: false, error: errorSearchConsole },
  });
}

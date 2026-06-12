import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { blogPosts, newsletterSubscriptions, solicitudesConsulta } from '@/lib/schema';
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

  const [subscriberRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(newsletterSubscriptions);

  const [consultaRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(solicitudesConsulta);

  const [consultaMesRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(solicitudesConsulta)
    .where(sql`${solicitudesConsulta.creadoEn} >= now() - interval '30 days'`);

  const totalSubscribers = subscriberRow?.count ?? 0;
  const totalConsultas = consultaRow?.count ?? 0;
  const consultasUltimoMes = consultaMesRow?.count ?? 0;

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

  const gaFrontendConfigured = !!site.gaId;
  const indexNowConfigured = !!site.indexNowKey;
  const indexNowStatus = indexNowConfigured
    ? 'Configurado'
    : 'Sin configurar';

  return NextResponse.json({
    site: {
      url: site.url,
      noindex: site.noindex,
      gaConfigured: isAnalyticsConfigured(),
      gscConfigured: isSearchConsoleConfigured(),
      gaFrontendConfigured,
      indexNowConfigured,
      indexNowStatus,
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
    status: {
      sitemap: site.noindex ? 'noindex-bloqueado' : 'activo',
      robots: site.noindex ? 'noindex-bloqueado' : 'activo',
      jsonLd: 'activo',
      indexNow: indexNowStatus,
      noindex: site.noindex ? 'activo' : 'inactivo',
      gaFrontend: gaFrontendConfigured ? 'activo' : 'inactivo',
      gaBackend: isAnalyticsConfigured() ? 'activo' : 'inactivo',
      searchConsole: isSearchConsoleConfigured() ? 'activo' : 'inactivo',
    },
    conversion: {
      newsletterSubscribers: totalSubscribers,
      totalConsultas,
      consultasUltimoMes,
    },
  });
}

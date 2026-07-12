import { NextResponse } from 'next/server';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { site } from '@/lib/site';
import {
  isGoogleConfigured,
  isAnalyticsConfigured,
  isSearchConsoleConfigured,
  getAnalyticsPropertyIdOrNull,
  getSearchConsoleSiteUrlOrNull,
  getAnalyticsData,
  getSearchConsoleData,
} from '@/lib/google';

function getAuthMethod(): string {
  if (process.env.OAUTH_CLIENT_ID && process.env.OAUTH_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
    return 'OAuth 2.0';
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return `Service Account (${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL})`;
  }
  return 'ninguno';
}

type HealthStatus = 'active' | 'not_configured' | 'permission_error' | 'api_error' | 'property_error' | 'key_file_error' | 'error' | 'partial';

interface IntegrationHealth {
  id: string;
  label: string;
  status: HealthStatus;
  isActive: boolean;
  detail: string;
  errorCode: string | null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
  } catch (err) {
    return authFailureResponse(err);
  }

  const [ga4Health, gscHealth, ga4FrontendHealth, indexNowHealth, sitemapHealth, robotsHealth, jsonLdHealth] = await Promise.all([
    checkGa4DataApi(),
    checkSearchConsoleApi(),
    checkGa4Frontend(),
    checkIndexNow(),
    checkSitemap(),
    checkRobots(),
    checkJsonLd(),
  ]);

  const allIntegrations = [
    ga4Health, gscHealth, ga4FrontendHealth, indexNowHealth, sitemapHealth, robotsHealth, jsonLdHealth,
  ];
  const activeCount = allIntegrations.filter(h => h.isActive).length;
  const isIndexable = !site.noindex && sitemapHealth.isActive && robotsHealth.isActive;

  return NextResponse.json({
    integrations: {
      ga4DataApi: ga4Health,
      searchConsoleApi: gscHealth,
      ga4Frontend: ga4FrontendHealth,
      indexNow: indexNowHealth,
      sitemap: sitemapHealth,
      robots: robotsHealth,
      jsonLd: jsonLdHealth,
    },
    summary: {
      activeIntegrations: activeCount,
      totalIntegrations: allIntegrations.length,
      isFullyActive: activeCount === allIntegrations.length,
      globalIndexability: isIndexable ? 'INDEXABLE' : 'NO INDEXABLE',
      noindexActive: site.noindex,
    },
    checkedAt: new Date().toISOString(),
  });
}

/* -------------------------------------------------------------------------- */
/*  GA4 Data API                                                              */
/* -------------------------------------------------------------------------- */

async function checkGa4DataApi(): Promise<IntegrationHealth> {
  const id = 'ga4-data-api';
  const label = 'GA4 Data API';

  if (!isGoogleConfigured()) {
    return inactive(id, label, 'not_configured',
      'Sin credenciales Google. Define OAUTH_CLIENT_ID + OAUTH_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN (recomendado) o GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.');
  }

  if (!isAnalyticsConfigured()) {
    return inactive(id, label, 'not_configured',
      `Autenticación configurada (${getAuthMethod()}), pero falta GOOGLE_ANALYTICS_PROPERTY_ID.`,
      'missing_property_id');
  }

  try {
    const data = await getAnalyticsData(7);
    const users = data.metrics.activeUsers ?? 0;
    return active(id, label,
      `Conexion exitosa. ${data.topPages.length} paginas con trafico. Usuarios activos (7d): ${users}.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    const code = classifyGoogleError(msg);

    if (code === 'permission_denied') {
      return inactive(id, label, 'permission_error',
        `Acceso denegado. Verifica que la cuenta asociada (${getAuthMethod()}) tenga acceso como "Lector" en GA4 > Admin > Acceso a la propiedad.`,
        'ga4_permission_denied');
    }
    if (code === 'not_found') {
      return inactive(id, label, 'property_error',
        `Propiedad GA4 no encontrada (${getAnalyticsPropertyIdOrNull()}). Verifica el ID.`,
        'ga4_property_not_found');
    }
    if (code === 'api_disabled') {
      return inactive(id, label, 'api_error',
        'API no habilitada. Ejecuta: gcloud services enable analyticsdata.googleapis.com',
        'ga4_api_disabled');
    }
    return inactive(id, label, 'api_error', `Error API: ${sanitize(msg, 150)}`, 'ga4_api_error');
  }
}

/* -------------------------------------------------------------------------- */
/*  Search Console API                                                        */
/* -------------------------------------------------------------------------- */

async function checkSearchConsoleApi(): Promise<IntegrationHealth> {
  const id = 'search-console-api';
  const label = 'Search Console API';

  if (!isGoogleConfigured()) {
    return inactive(id, label, 'not_configured',
      'Sin credenciales Google. Define OAUTH_CLIENT_ID + OAUTH_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN o GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.');
  }

  if (!isSearchConsoleConfigured()) {
    return inactive(id, label, 'not_configured',
      `Autenticación configurada (${getAuthMethod()}), pero falta GOOGLE_SEARCH_CONSOLE_SITE_URL.`, 'missing_site_url');
  }

  try {
    const data = await getSearchConsoleData(7);
    return active(id, label,
      `Conexion exitosa. ${data.totalClicks} clicks, ${data.totalImpressions} impresiones (7d). ${data.queries.length} consultas.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    const code = classifyGoogleError(msg);

    if (code === 'permission_denied') {
      return inactive(id, label, 'permission_error',
        `Acceso denegado. Verifica que la cuenta asociada (${getAuthMethod()}) tenga acceso como usuario en Search Console > Ajustes > Usuarios y permisos.`,
        'gsc_permission_denied');
    }
    if (code === 'not_found') {
      return inactive(id, label, 'property_error',
        `Propiedad no encontrada (${getSearchConsoleSiteUrlOrNull()}). Verifica que este verificada en Search Console.`,
        'gsc_property_not_found');
    }
    if (code === 'api_disabled') {
      return inactive(id, label, 'api_error',
        'API no habilitada. Ejecuta: gcloud services enable searchconsole.googleapis.com',
        'gsc_api_disabled');
    }
    return inactive(id, label, 'api_error', `Error API: ${sanitize(msg, 150)}`, 'gsc_api_error');
  }
}

/* -------------------------------------------------------------------------- */
/*  GA4 Frontend                                                              */
/* -------------------------------------------------------------------------- */

function checkGa4Frontend(): IntegrationHealth {
  const id = 'ga4-frontend';
  const label = 'GA4 Frontend';

  if (site.gaId) {
    return active(id, label, 'GA4 Measurement ID configurado. Tag inyectado en layout via next/script.');
  }
  return inactive(id, label, 'not_configured',
    'NEXT_PUBLIC_GA_ID no definido.', 'missing_ga_id');
}

/* -------------------------------------------------------------------------- */
/*  IndexNow                                                                  */
/* -------------------------------------------------------------------------- */

async function checkIndexNow(): Promise<IntegrationHealth> {
  const id = 'indexnow';
  const label = 'IndexNow';

  if (!site.indexNowKey) {
    return inactive(id, label, 'not_configured',
      'INDEXNOW_KEY no definida. Genera una clave en https://www.bing.com/indexnow/getstarted',
      'missing_key');
  }

  try {
    const keyUrl = `${site.url}/${site.indexNowKey}.txt`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(keyUrl, { signal: controller.signal });
    clearTimeout(timeout);

    const body = (await res.text()).trim();

    if (!res.ok) {
      return inactive(id, label, 'key_file_error',
        `Key file responde HTTP ${res.status} en ${keyUrl}. Verifica rewrite en next.config.ts y /api/indexnow-key.`,
        `key_file_http_${res.status}`);
    }

    if (body !== site.indexNowKey) {
      return inactive(id, label, 'key_file_error',
        `Contenido del key file no coincide. Esperado: "${site.indexNowKey.substring(0, 4)}...", Recibido: "${body.substring(0, 4)}..."`,
        'key_mismatch');
    }

    return active(id, label, `IndexNow configurado. Key file verificado en ${keyUrl}.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return inactive(id, label, 'key_file_error',
      `No se pudo verificar key file: ${sanitize(msg, 100)}`, 'key_file_unreachable');
  }
}

/* -------------------------------------------------------------------------- */
/*  Sitemap                                                                   */
/* -------------------------------------------------------------------------- */

async function checkSitemap(): Promise<IntegrationHealth> {
  const id = 'sitemap';
  const label = 'Sitemap';

  if (site.noindex) {
    return inactive(id, label, 'not_configured',
      'Sitemap vacio (NEXT_PUBLIC_NOINDEX=true). Cambia a false para produccion.', 'noindex_active');
  }

  try {
    const [publishedRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));
    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(blogPosts);

    const publishedPosts = publishedRow?.count ?? 0;
    const totalPosts = totalRow?.count ?? 0;
    const sitemapUrl = `${site.url}/sitemap.xml`;

    return active(id, label,
      `Sitemap activo: ~37 paginas estaticas + ${publishedPosts} posts = ~${37 + publishedPosts} URLs. ${totalPosts - publishedPosts} borradores excluidos. ${sitemapUrl}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return inactive(id, label, 'error', `Error DB: ${sanitize(msg, 100)}`, 'sitemap_db_error');
  }
}

/* -------------------------------------------------------------------------- */
/*  robots.txt                                                                */
/* -------------------------------------------------------------------------- */

async function checkRobots(): Promise<IntegrationHealth> {
  const id = 'robots';
  const label = 'robots.txt';

  try {
    const robotsUrl = `${site.url}/robots.txt`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(robotsUrl, { signal: controller.signal });
    clearTimeout(timeout);

    const body = await res.text();

    if (!res.ok) {
      return inactive(id, label, 'error',
        `robots.txt responde HTTP ${res.status} en ${robotsUrl}.`, `robots_http_${res.status}`);
    }

    const checks: string[] = [];
    const hasSitemapRef = body.includes('Sitemap:');
    const blocksIntranet = body.includes('/intranet/');
    const blocksApi = body.includes('/api/');
    const allowsRoot = body.includes('Allow: /') || !body.includes('Disallow: /');

    checks.push(hasSitemapRef ? 'Referencia sitemap: OK' : 'Falta referencia Sitemap');
    checks.push(blocksIntranet ? 'Bloquea intranet: OK' : 'No bloquea intranet');
    checks.push(blocksApi ? 'Bloquea API: OK' : 'No bloquea API');
    checks.push(allowsRoot ? 'Permite rastreo publico: OK' : 'No permite rastreo publico');

    const allOk = hasSitemapRef && blocksIntranet && blocksApi && allowsRoot;

    if (allOk) {
      return active(id, label, `robots.txt correcto. ${checks.join(' | ')}`);
    }
    return { id, label, status: 'partial', isActive: allOk, detail: checks.join('. '), errorCode: 'robots_incomplete' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return inactive(id, label, 'error', `Error verificando robots.txt: ${sanitize(msg, 100)}`, 'robots_unreachable');
  }
}

/* -------------------------------------------------------------------------- */
/*  Datos estructurados (JSON-LD)                                             */
/* -------------------------------------------------------------------------- */

async function checkJsonLd(): Promise<IntegrationHealth> {
  const id = 'json-ld';
  const label = 'JSON-LD';

  try {
    const homeUrl = site.url;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(homeUrl, { signal: controller.signal });
    clearTimeout(timeout);

    const html = await res.text();

    const schemasFound: string[] = [];
    if (html.includes('"@type":"LegalService"') || html.includes('"@type": "LegalService"')) schemasFound.push('LegalService');
    if (html.includes('"@type":"Organization"') || html.includes('"@type": "Organization"')) schemasFound.push('Organization');
    if (html.includes('"@type":"WebSite"') || html.includes('"@type": "WebSite"')) schemasFound.push('WebSite');
    if (html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"')) schemasFound.push('FAQPage');
    if (html.includes('"@type":"BlogPosting"') || html.includes('"@type": "BlogPosting"')) schemasFound.push('BlogPosting');
    if (html.includes('"@type":"BreadcrumbList"') || html.includes('"@type": "BreadcrumbList"')) schemasFound.push('BreadcrumbList');
    if (html.includes('"@type":"PostalAddress"') || html.includes('"@type": "PostalAddress"')) schemasFound.push('PostalAddress');

    const hasJsonLd = html.includes('application/ld+json');

    if (!hasJsonLd) {
      return inactive(id, label, 'partial',
        'No se detecto JSON-LD en la home. Verifica app/(public)/layout.tsx.',
        'jsonld_not_found');
    }

    if (schemasFound.length >= 4) {
      return active(id, label, `JSON-LD detectado: ${schemasFound.join(', ')}.`);
    }

    if (schemasFound.length > 0) {
      return { id, label, status: 'partial', isActive: schemasFound.length >= 4, detail: `Esquemas detectados: ${schemasFound.join(', ')}.`, errorCode: 'jsonld_partial' };
    }

    return inactive(id, label, 'partial', 'JSON-LD presente pero no se detectaron esquemas conocidos.', 'jsonld_unknown');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return inactive(id, label, 'error', `Error verificando JSON-LD: ${sanitize(msg, 100)}`, 'jsonld_unreachable');
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function active(id: string, label: string, detail: string): IntegrationHealth {
  return { id, label, status: 'active', isActive: true, detail, errorCode: null };
}

function inactive(id: string, label: string, status: HealthStatus, detail: string, errorCode?: string): IntegrationHealth {
  return { id, label, status, isActive: false, detail, errorCode: errorCode ?? null };
}

function classifyGoogleError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('permission_denied') || lower.includes('forbidden') || lower.includes('403') || lower.includes('not authorized')) return 'permission_denied';
  if (lower.includes('not found') || lower.includes('404')) return 'not_found';
  if (lower.includes('api not enabled') || lower.includes('has not been used') || lower.includes('disabled')) return 'api_disabled';
  return 'unknown';
}

function sanitize(input: string, maxLen = 150): string {
  const cleaned = input.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  return cleaned.length <= maxLen ? cleaned : cleaned.substring(0, maxLen) + '...';
}

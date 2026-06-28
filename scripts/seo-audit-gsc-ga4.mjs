/**
 * Auditoría SEO automatizada: Google Search Console + Google Analytics 4.
 *
 * Lee credenciales de .env.local (OAuth refresh token con scopes webmasters +
 * analytics.readonly, o service account) y produce un JSON + log legible con:
 *   - Propiedad GSC verificada
 *   - Sitemaps enviados y su estado
 *   - Indexación: top queries y top pages (28d)
 *   - Estado de cobertura (descubiertas, rastreadas, indexadas, excluidas)
 *     vía URL Inspection API sobre una muestra de URLs prioritarias
 *   - GA4: métricas globales, top páginas, fuentes, países, dispositivos
 *
 * Uso:
 *   node scripts/seo-audit-gsc-ga4.mjs
 *
 * Salida:
 *   - stdout: resumen legible
 *   - scripts/.seo-audit.json: datos crudos para el informe
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env.local') });
config({ path: resolve(root, '.env') });

const { google } = await import('googleapis');

const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SA_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
const SITE_URL = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;

function isPublicPagePath(path) {
  return typeof path === 'string'
    && path.startsWith('/')
    && !path.startsWith('/intranet')
    && !path.startsWith('/api')
    && !path.startsWith('/preview');
}

function buildAuth(scopes) {
  if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
    const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost:3000');
    oauth2.setCredentials({ refresh_token: REFRESH_TOKEN });
    return oauth2;
  }
  if (SA_EMAIL && SA_KEY) {
    return new google.auth.JWT({
      email: SA_EMAIL,
      key: SA_KEY.replace(/\\n/g, '\n'),
      scopes,
    });
  }
  throw new Error('Sin credenciales Google (OAuth o service account).');
}

const authSc = buildAuth(['https://www.googleapis.com/auth/webmasters.readonly']);
const sc = google.searchconsole({ version: 'v1', auth: authSc });

const authGa = buildAuth(['https://www.googleapis.com/auth/analytics.readonly']);
const ga = google.analyticsdata({ version: 'v1beta', auth: authGa });

// Muestra de URLs prioritarias para URL Inspection.
const PRIORITY_URLS = [
  'https://www.pinedayasociadoshn.com/',
  'https://www.pinedayasociadoshn.com/servicios-juridicos',
  'https://www.pinedayasociadoshn.com/derecho-penal',
  'https://www.pinedayasociadoshn.com/solicitar-consulta',
  'https://www.pinedayasociadoshn.com/como-llegar',
  'https://www.pinedayasociadoshn.com/abogados-en-nacaome',
  'https://www.pinedayasociadoshn.com/abogados-en-choluteca',
  'https://www.pinedayasociadoshn.com/abogados-en-san-lorenzo',
  'https://www.pinedayasociadoshn.com/blog',
  'https://www.pinedayasociadoshn.com/preguntas-frecuentes',
];

const out = { generatedAt: new Date().toISOString(), gsc: {}, ga4: {} };

// ---------------------------------------------------------------------------
// GSC: lista de sitios (confirma propiedad)
// ---------------------------------------------------------------------------
try {
  const sites = await sc.sites.list();
  out.gsc.sites = (sites.data.siteEntry ?? []).map((s) => ({
    url: s.siteUrl,
    permissionLevel: s.permissionLevel,
    verified: true,
  }));
  console.log('GSC sitios verificados:');
  for (const s of out.gsc.sites) console.log(`  • ${s.url} (${s.permissionLevel})`);
} catch (e) {
  out.gsc.sitesError = e.message;
  console.log('GSC sites ERROR:', e.message);
}

// ---------------------------------------------------------------------------
// GSC: sitemaps
// ---------------------------------------------------------------------------
try {
  const sm = await sc.sitemaps.list({ siteUrl: SITE_URL });
  out.gsc.sitemaps = (sm.data.sitemap ?? []).map((s) => ({
    path: s.path,
    lastSubmitted: s.lastSubmitted,
    status: s.status,
    errors: s.errors,
    warnings: s.warnings,
    indexed: s.contents?.indexed,
    submitted: s.contents?.submitted,
  }));
  console.log('\nGSC sitemaps:');
  for (const s of out.gsc.sitemaps) {
    console.log(`  • ${s.path} — estado: ${s.status}, enviadas: ${s.submitted}, indexadas: ${s.indexed}, errores: ${s.errors}, avisos: ${s.warnings}`);
  }
} catch (e) {
  out.gsc.sitemapsError = e.message;
  console.log('GSC sitemaps ERROR:', e.message);
}

// ---------------------------------------------------------------------------
// GSC: rendimiento (28 días) por query y por page
// ---------------------------------------------------------------------------
const today = new Date();
const start28 = new Date(today.getTime() - 28 * 86400000);
const fmt = (d) => d.toISOString().split('T')[0];
const range = { startDate: fmt(start28), endDate: fmt(today) };
out.gsc.dateRange = range;

try {
  const [qRes, pRes] = await Promise.all([
    sc.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: { startDate: range.startDate, endDate: range.endDate, dimensions: ['query'], rowLimit: 25 },
    }),
    sc.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: { startDate: range.startDate, endDate: range.endDate, dimensions: ['page'], rowLimit: 25 },
    }),
  ]);
  const sum = (rows) => rows.reduce((acc, r) => {
    acc.clicks += r.clicks ?? 0;
    acc.impressions += r.impressions ?? 0;
    return acc;
  }, { clicks: 0, impressions: 0 });
  const qTotals = sum(qRes.data.rows ?? []);
  out.gsc.totalClicks = qTotals.clicks;
  out.gsc.totalImpressions = qTotals.impressions;
  out.gsc.ctr = qTotals.impressions ? qTotals.clicks / qTotals.impressions : 0;
  out.gsc.topQueries = (qRes.data.rows ?? []).map((r) => ({ query: r.keys?.[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
  out.gsc.topPages = (pRes.data.rows ?? []).map((r) => ({ page: r.keys?.[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
  console.log(`\nGSC rendimiento (${range.startDate} → ${range.endDate}):`);
  console.log(`  Clicks totales: ${qTotals.clicks}, Impresiones: ${qTotals.impressions}, CTR: ${(out.gsc.ctr * 100).toFixed(2)}%`);
  console.log('  Top queries:');
  for (const q of out.gsc.topQueries.slice(0, 10)) console.log(`    • "${q.query}": ${q.clicks}c / ${q.impressions}i / pos ${q.position?.toFixed(1)}`);
  console.log('  Top pages:');
  for (const p of out.gsc.topPages.slice(0, 10)) console.log(`    • ${p.page}: ${p.clicks}c / ${p.impressions}i / pos ${p.position?.toFixed(1)}`);
} catch (e) {
  out.gsc.performanceError = e.message;
  console.log('GSC performance ERROR:', e.message);
}

// ---------------------------------------------------------------------------
// GSC: URL Inspection sobre muestra prioritaria
// ---------------------------------------------------------------------------
out.gsc.urlInspection = [];
console.log('\nGSC URL Inspection (muestra prioritaria):');
for (const url of PRIORITY_URLS) {
  try {
    const r = await sc.urlInspection.index.inspect({
      requestBody: { inspectionUrl: url, siteUrl: SITE_URL, languageCode: 'es-HN' },
    });
    const ins = r.data.inspectionResult?.indexStatusResult;
    const entry = {
      url,
      verdict: ins?.verdict ?? null,
      coverageState: ins?.coverageState ?? null,
      indexingState: ins?.indexingState ?? null,
      robotsTxtState: ins?.robotsTxtState ?? null,
      pageFetchState: ins?.pageFetchState ?? null,
      googleCanonical: ins?.googleCanonical ?? null,
      userCanonical: ins?.userCanonical ?? null,
      lastCrawlTime: ins?.lastCrawlTime ?? null,
    };
    out.gsc.urlInspection.push(entry);
    console.log(`  • ${url.replace('https://www.pinedayasociadoshn.com', '') || '/'} → ${entry.verdict} (${entry.coverageState})`);
  } catch (e) {
    out.gsc.urlInspection.push({ url, error: e.message });
    console.log(`  • ${url} → ERROR: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// GA4: métricas globales (28d), top páginas, fuentes, países, dispositivos
// ---------------------------------------------------------------------------
if (PROPERTY_ID) {
  const property = `properties/${PROPERTY_ID}`;
  try {
    const [metricsRes, pagesRes, sourcesRes, countriesRes, devicesRes] = await Promise.all([
      ga.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
          metrics: [
            { name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
            { name: 'newUsers' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' },
          ],
        },
      }),
      ga.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: '25',
        },
      }),
      ga.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: '15',
        },
      }),
      ga.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: '10',
        },
      }),
      ga.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'activeUsers' }],
        },
      }),
    ]);

    const gm = (idx) => {
      const v = metricsRes.data.rows?.[0]?.metricValues?.[idx]?.value;
      return v ? Number(v) : null;
    };
    out.ga4.metrics = {
      activeUsers: gm(0), sessions: gm(1), screenPageViews: gm(2),
      newUsers: gm(3), averageSessionDuration: gm(4), bounceRate: gm(5),
    };
    out.ga4.topPages = (pagesRes.data.rows ?? []).map((r) => ({ page: r.dimensionValues?.[0]?.value, views: Number(r.metricValues?.[0]?.value ?? 0) }));
    out.ga4.topPublicPages = out.ga4.topPages.filter((p) => isPublicPagePath(p.page));
    out.ga4.topInternalPages = out.ga4.topPages.filter((p) => !isPublicPagePath(p.page));
    out.ga4.sources = (sourcesRes.data.rows ?? []).map((r) => ({ source: r.dimensionValues?.[0]?.value, sessions: Number(r.metricValues?.[0]?.value ?? 0) }));
    out.ga4.countries = (countriesRes.data.rows ?? []).map((r) => ({ country: r.dimensionValues?.[0]?.value, users: Number(r.metricValues?.[0]?.value ?? 0) }));
    out.ga4.devices = (devicesRes.data.rows ?? []).map((r) => ({ device: r.dimensionValues?.[0]?.value, users: Number(r.metricValues?.[0]?.value ?? 0) }));

    console.log('\nGA4 métricas (28d):');
    console.log(`  Usuarios: ${out.ga4.metrics.activeUsers}, Sesiones: ${out.ga4.metrics.sessions}, Páginas vistas: ${out.ga4.metrics.screenPageViews}`);
    console.log(`  Nuevos: ${out.ga4.metrics.newUsers}, Duración media: ${out.ga4.metrics.averageSessionDuration?.toFixed(1)}s, Rebote: ${((out.ga4.metrics.bounceRate ?? 0) * 100).toFixed(1)}%`);
    console.log('  Top páginas:');
    for (const p of out.ga4.topPages.slice(0, 10)) console.log(`    • ${p.page}: ${p.views} vistas`);
    console.log('  Top páginas públicas:');
    for (const p of out.ga4.topPublicPages.slice(0, 10)) console.log(`    • ${p.page}: ${p.views} vistas`);
    if (out.ga4.topInternalPages.length > 0) {
      console.log('  Páginas internas/no públicas detectadas en GA4 (contaminación de análisis público):');
      for (const p of out.ga4.topInternalPages.slice(0, 10)) console.log(`    • ${p.page}: ${p.views} vistas`);
    }
    console.log('  Fuentes:');
    for (const s of out.ga4.sources.slice(0, 8)) console.log(`    • ${s.source || '(direct)'}: ${s.sessions} sesiones`);
    console.log('  Países:');
    for (const c of out.ga4.countries.slice(0, 5)) console.log(`    • ${c.country}: ${c.users} usuarios`);
    console.log('  Dispositivos:');
    for (const d of out.ga4.devices) console.log(`    • ${d.device}: ${d.users} usuarios`);
  } catch (e) {
    out.ga4.error = e.message;
    console.log('GA4 ERROR:', e.message);
  }
} else {
  out.ga4.error = 'GOOGLE_ANALYTICS_PROPERTY_ID no configurado';
  console.log('GA4 SKIP: falta property ID');
}

// ---------------------------------------------------------------------------
// GA4: eventos (28d) — busca los de tracking definidos en lib/analytics.ts
// ---------------------------------------------------------------------------
if (PROPERTY_ID && !out.ga4.error) {
  try {
    const evRes = await ga.properties.runReport({
      property: `properties/${PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: '50',
      },
    });
    out.ga4.events = (evRes.data.rows ?? []).map((r) => ({ name: r.dimensionValues?.[0]?.value, count: Number(r.metricValues?.[0]?.value ?? 0) }));
    const TRACKED = ['whatsapp_click', 'phone_click', 'form_click', 'lead_generated', 'email_click', 'directions_click'];
    out.ga4.trackedEvents = out.ga4.events.filter((e) => TRACKED.includes(e.name));
    console.log('\nGA4 eventos (28d) — top 15:');
    for (const e of out.ga4.events.slice(0, 15)) console.log(`    • ${e.name}: ${e.count}`);
    console.log('  Eventos tracked (lib/analytics.ts):');
    for (const t of TRACKED) {
      const found = out.ga4.events.find((e) => e.name === t);
      console.log(`    • ${t}: ${found ? found.count + ' disparos' : 'NO REGISTRADO'}`);
    }
  } catch (e) {
    out.ga4.eventsError = e.message;
    console.log('GA4 eventos ERROR:', e.message);
  }
}

// ---------------------------------------------------------------------------
// Guardar salida
// ---------------------------------------------------------------------------
writeFileSync(resolve(root, 'scripts/.seo-audit.json'), JSON.stringify(out, null, 2), 'utf8');
console.log('\n✅ Datos guardados en scripts/.seo-audit.json');

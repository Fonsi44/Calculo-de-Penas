/**
 * Consulta datos de Search Analytics de Google Search Console.
 * Usa el mismo OAuth2 refresh token que submit-sitemap-gsc.mjs.
 *
 * Uso:
 *   npx tsx scripts/gsc-analytics.mjs                          # resumen últimos 7 días
 *   npx tsx scripts/gsc-analytics.mjs --days 30                # últimos 30 días
 *   npx tsx scripts/gsc-analytics.mjs --start 2026-06-01 --end 2026-06-19
 *   npx tsx scripts/gsc-analytics.mjs --dimension query        # top queries
 *   npx tsx scripts/gsc-analytics.mjs --dimension page         # top páginas
 *   npx tsx scripts/gsc-analytics.mjs --dimension country      # por país
 *   npx tsx scripts/gsc-analytics.mjs --dimension device       # móvil/desktop/tablet
 *   npx tsx scripts/gsc-analytics.mjs --dimension date         # evolución diaria
 *   npx tsx scripts/gsc-analytics.mjs --top 20                 # top 20 filas
 *   npx tsx scripts/gsc-analytics.mjs --json                   # salida JSON cruda
 *   npx tsx scripts/gsc-analytics.mjs --all                    # resumen completo
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { google } from 'googleapis';

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

function getArg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
function hasFlag(name) {
  return args.includes(name);
}

const now = new Date();
const endDateDefault = now.toISOString().slice(0, 10);
const startDateDefault = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const START = getArg('--start') || startDateDefault;
const END = getArg('--end') || endDateDefault;
const DIMENSION = getArg('--dimension') || 'query'; // query, page, country, device, date
const ROW_LIMIT = parseInt(getArg('--top') || '10', 10);
const AS_JSON = hasFlag('--json');
const SHOW_ALL = hasFlag('--all');

const DIMENSIONS_MAP = {
  query: ['query'],
  page: ['page'],
  country: ['country'],
  device: ['device'],
  date: ['date'],
};

const DIMENSION_LABELS = {
  query: 'Consulta',
  page: 'Página',
  country: 'País',
  device: 'Dispositivo',
  date: 'Fecha',
};

function formatNumber(n) {
  return Number(n).toLocaleString('es-HN');
}

function formatPct(n) {
  return (Number(n) * 100).toFixed(2) + '%';
}

function formatPosition(n) {
  return Number(n).toFixed(1);
}

// ---------------------------------------------------------------------------
// Consulta GSC
// ---------------------------------------------------------------------------
async function queryAnalytics(siteUrl, auth, dimensions, startDate, endDate, rowLimit) {
  const sc = google.searchconsole({ version: 'v1', auth });

  // Primera consulta con la dimensión especificada
  const result = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions,
      rowLimit,
      orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
    },
  });

  return result.data;
}

async function getSummary(siteUrl, auth, startDate, endDate) {
  // Consulta sin dimensión para métricas agregadas
  const sc = google.searchconsole({ version: 'v1', auth });

  const result = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 365,
    },
  });

  const rows = result.data.rows ?? [];
  let totalClicks = 0;
  let totalImpressions = 0;
  let totalCtrSum = 0;
  let totalPositionSum = 0;
  let count = 0;

  for (const r of rows) {
    totalClicks += Number(r.clicks ?? 0);
    totalImpressions += Number(r.impressions ?? 0);
    totalCtrSum += Number(r.ctr ?? 0);
    totalPositionSum += Number(r.position ?? 0);
    count++;
  }

  return {
    clicks: totalClicks,
    impressions: totalImpressions,
    ctr: count > 0 ? totalCtrSum / count : 0,
    position: count > 0 ? totalPositionSum / count : 0,
    days: count,
  };
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------
function printTable(rows, dimension, startDate, endDate) {
  const label = DIMENSION_LABELS[dimension] || dimension;
  const header = `${label}`;
  const colWidth = Math.max(header.length, 30);

  console.log('');
  console.log(`── Top ${rows.length} por ${label} (${startDate} → ${endDate}) ─${'─'.repeat(colWidth)}`);
  console.log(
    `  ${label.padEnd(colWidth)}  Clics     Impresiones  CTR      Posición`
  );
  console.log(`  ${'─'.repeat(colWidth)}  ───────  ───────────  ──────  ────────`);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const key = (dimension === 'query'
      ? (r.keys?.[0] ?? '(sin datos)')
      : dimension === 'page'
        ? (r.keys?.[0] ?? '').replace(/^https:\/\/[^/]+/, '').slice(0, colWidth)
        : dimension === 'country'
          ? (r.keys?.[0] ?? '')
          : dimension === 'device'
            ? (r.keys?.[0] ?? '')
            : (r.keys?.[0] ?? '')
    ).padEnd(colWidth);

    const clicks = formatNumber(r.clicks ?? 0).padStart(7);
    const impressions = formatNumber(r.impressions ?? 0).padStart(11);
    const ctr = formatPct(r.ctr ?? 0).padStart(6);
    const pos = formatPosition(r.position ?? 0).padStart(8);

    console.log(`  ${key}  ${clicks}  ${impressions}  ${ctr}  ${pos}`);
  }
  console.log('');
}

function printJSON(data) {
  console.log(JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!siteUrl || !clientId || !clientSecret || !refreshToken) {
    console.error('❌ Faltan variables: GOOGLE_SEARCH_CONSOLE_SITE_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(' Google Search Console — Search Analytics');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Sitio:           ${siteUrl}`);
  console.log(`Período:         ${START} → ${END}`);
  console.log(`Dimensión:       ${DIMENSION}`);
  console.log('');

  // Auth
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost');
  oauth2.setCredentials({ refresh_token: refreshToken });
  console.log(`🔑 Autenticando...`);
  await oauth2.getAccessToken();
  console.log(`✅ Token OK`);
  console.log('');

  if (SHOW_ALL) {
    // --- Resumen general ---
    console.log('── Resumen general del período ─────────────────────────');
    const summary = await getSummary(siteUrl, oauth2, START, END);
    console.log(`Días con datos:  ${summary.days}`);
    console.log(`Clics totales:   ${formatNumber(summary.clicks)}`);
    console.log(`Impresiones:     ${formatNumber(summary.impressions)}`);
    console.log(`CTR medio:       ${formatPct(summary.ctr)}`);
    console.log(`Posición media:  ${formatPosition(summary.position)}`);
    console.log('');

    // --- Top queries ---
    const qData = await queryAnalytics(siteUrl, oauth2, ['query'], START, END, ROW_LIMIT);
    if (qData.rows?.length) printTable(qData.rows, 'query', START, END);

    // --- Top páginas ---
    const pData = await queryAnalytics(siteUrl, oauth2, ['page'], START, END, ROW_LIMIT);
    if (pData.rows?.length) printTable(pData.rows, 'page', START, END);

    // --- Por país ---
    const cData = await queryAnalytics(siteUrl, oauth2, ['country'], START, END, ROW_LIMIT);
    if (cData.rows?.length) printTable(cData.rows, 'country', START, END);

    // --- Por dispositivo ---
    const dData = await queryAnalytics(siteUrl, oauth2, ['device'], START, END, ROW_LIMIT);
    if (dData.rows?.length) printTable(dData.rows, 'device', START, END);

    // --- Evolución diaria (últimos 30 días máximo) ---
    const daysRange = Math.min(Math.ceil((new Date(END) - new Date(START)) / (1000*60*60*24)) + 1, 31);
    const dateData = await queryAnalytics(siteUrl, oauth2, ['date'], START, END, daysRange);
    if (dateData.rows?.length) printTable(dateData.rows, 'date', START, END);

    console.log(`✅ Resumen completo. Período: ${START} → ${END}`);
    return;
  }

  if (AS_JSON) {
    const data = await queryAnalytics(siteUrl, oauth2, DIMENSIONS_MAP[DIMENSION] || ['query'], START, END, ROW_LIMIT);
    printJSON(data);
    return;
  }

  // Una sola dimensión
  const dims = DIMENSIONS_MAP[DIMENSION] || ['query'];
  if (!DIMENSIONS_MAP[DIMENSION]) {
    console.warn(`⚠️ Dimensión "${DIMENSION}" no reconocida. Usando "query".`);
    console.warn(`   Válidas: ${Object.keys(DIMENSIONS_MAP).join(', ')}`);
  }

  const data = await queryAnalytics(siteUrl, oauth2, dims, START, END, ROW_LIMIT);

  if (!data.rows || data.rows.length === 0) {
    console.log('ℹ️  Sin datos en el período seleccionado.');
    console.log('   Prueba con un rango más amplio (--days 90) o fechas más recientes.');
    return;
  }

  printTable(data.rows, DIMENSION, START, END);

  console.log(`📊 ${data.rows.length} filas mostradas de ${ROW_LIMIT} solicitadas.`);
  if (DIMENSION === 'query') {
    console.log('💡 Usa --dimension page para ver por página, --dimension date para evolución.');
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message?.substring(0, 300) || err);
  process.exit(1);
});

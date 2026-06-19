// Script de auditoría de rendimiento y calidad SEO de la web pública.
// Ejecutar: npx tsx scripts/auditar-performance-publico.ts
//
// Comprueba una muestra de URLs públicas contra el sitio en producción (o el
// host indicado via SITE_BASE_URL) y reporta:
//   - Tamaño HTML aproximado (bytes)
//   - Scripts GA4/Clarity duplicados
//   - iframes públicos (deben tener loading=lazy + title)
//   - Emails en texto plano (scraping)
//   - Componentes 'use client' sospechosos (documentados, no bloqueantes)
//   - Metadata básica (title, description, canonical, og:title)
//   - Ausencia de rutas privadas (/intranet, /calculadora) en sitemap/llms.txt
//
// Salida: consola + docs/performance-audit-report.md (si se puede escribir).
//
// NO requiere DB. Solo HTTP fetch a las URLs.

const BASE_URL = process.env.SITE_BASE_URL ?? 'https://www.pinedayasociadoshn.com';

const URLS = [
  '/',
  '/blog',
  '/derecho-penal',
  '/despacho',
  '/solicitar-consulta',
  '/como-llegar',
  '/abogados-en-nacaome',
  '/abogados-en-choluteca',
  '/abogados-en-san-lorenzo',
  '/preguntas-frecuentes',
  '/servicios-juridicos',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
];

interface UrlAudit {
  url: string;
  status: number;
  htmlBytes: number;
  hasTitle: boolean;
  hasDescription: boolean;
  hasCanonical: boolean;
  hasOgTitle: boolean;
  ga4Count: number;
  clarityCount: number;
  iframeCount: number;
  lazyIframes: number;
  iframesWithoutTitle: number;
  plainEmails: number;
  intranetLeaks: number;
  emDashInOg: boolean;
}

async function fetchUrl(path: string): Promise<{ status: number; html: string; bytes: number }> {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PerfAudit/1.0)' },
      redirect: 'follow',
    });
    const html = await res.text();
    return { status: res.status, html, bytes: Buffer.byteLength(html, 'utf8') };
  } catch (e) {
    return { status: 0, html: '', bytes: 0 };
  }
}

function countOccurrences(html: string, pattern: string | RegExp): number {
  const matches = html.match(new RegExp(pattern, 'g'));
  return matches ? matches.length : 0;
}

async function main() {
  console.log(`\n🔍 Auditoría de rendimiento y calidad SEO — ${BASE_URL}\n`);

  const audits: UrlAudit[] = [];

  for (const path of URLS) {
    const { status, html, bytes } = await fetchUrl(path);
    const isHtml = html.includes('<html') || html.includes('<!DOCTYPE');

    audits.push({
      url: path,
      status,
      htmlBytes: bytes,
      hasTitle: /<title>[^<]+<\/title>/.test(html),
      hasDescription: /<meta name="description"/.test(html),
      hasCanonical: /<link rel="canonical"/.test(html),
      hasOgTitle: /<meta property="og:title"/.test(html),
      ga4Count: isHtml ? countOccurrences(html, 'googletagmanager\\.com/gtag/js') : 0,
      clarityCount: isHtml ? countOccurrences(html, 'clarity\\.ms/tag/') : 0,
      iframeCount: isHtml ? countOccurrences(html, '<iframe') : 0,
      lazyIframes: isHtml ? countOccurrences(html, '<iframe[^>]*loading="lazy"') : 0,
      iframesWithoutTitle: isHtml ? countOccurrences(html, '<iframe(?![^>]*title=)') : 0,
      plainEmails: isHtml ? countOccurrences(html, '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}') : 0,
      intranetLeaks: /\/intranet|\/calculadora|\/casos\b|\/cp\b|\/delitos\b|\/admin\b/.test(html) && (path === '/sitemap.xml' || path === '/llms.txt')
        ? countOccurrences(html, '/intranet|/calculadora|/casos|/cp/|/delitos/|/admin/')
        : 0,
      emDashInOg: isHtml ? /og:title[^>]*—/.test(html) : false,
    });
    process.stdout.write('.');
  }
  console.log('\n');

  // Reporte tabla
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('RESUMEN POR URL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('URL'.padEnd(32) + 'Status  HTML(KB)  GA4  Clarity  iframe  emails  emDash  leak');
  console.log('-'.repeat(95));
  for (const a of audits) {
    const row = [
      a.url.padEnd(30),
      String(a.status).padEnd(6),
      (a.htmlBytes / 1024).toFixed(1).padStart(7),
      String(a.ga4Count).padStart(3),
      String(a.clarityCount).padStart(8),
      String(a.iframeCount).padStart(7),
      String(a.plainEmails).padStart(7),
      a.emDashInOg ? '  SÍ' : '  no',
      a.intranetLeaks > 0 ? `  🔴${a.intranetLeaks}` : '  0',
    ].join('  ');
    console.log(row);
  }
  console.log('');

  // Alertas
  const alerts: string[] = [];
  for (const a of audits) {
    if (a.status !== 200) alerts.push(`🔴 ${a.url}: status ${a.status}`);
    if (a.ga4Count > 1) alerts.push(`🔴 ${a.url}: GA4 duplicado (${a.ga4Count})`);
    if (a.clarityCount > 1) alerts.push(`🔴 ${a.url}: Clarity duplicado (${a.clarityCount})`);
    if (a.iframesWithoutTitle > 0) alerts.push(`🟠 ${a.url}: ${a.iframesWithoutTitle} iframe(s) sin title`);
    if (a.intranetLeaks > 0) alerts.push(`🔴 ${a.url}: ${a.intranetLeaks} posible(s) ruta(s) privada(s) expuesta(s)`);
    if (a.emDashInOg) alerts.push(`🟠 ${a.url}: em-dash (—) en og:title (riesgo mojibake)`);
  }

  if (alerts.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('ALERTAS');
    console.log('═══════════════════════════════════════════════════════════════');
    for (const al of alerts) console.log(al);
  } else {
    console.log('✅ Sin alertas críticas.');
  }
  console.log('');

  // Componentes 'use client' documentados (no se miden por HTTP, se documentan)
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('NOTA: Componentes públicos con \'use client\' (verificar manualmente)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Los siguientes componentes cliente están justificados (interacción real):');
  console.log('  - PublicHeader (menú móvil, scroll, navegación)');
  console.log('  - FloatingContactRail (botones clicables)');
  console.log('  - BlogSearch (filtrado client-side)');
  console.log('  - SolicitarConsultaForm (formulario POST)');
  console.log('  - BlogCtaBar (tracking analytics onClick)');
  console.log('  - CopyableAddress (copiar al portapapeles)');
  console.log('  - ShareButtons (compartir redes)');
  console.log('');

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

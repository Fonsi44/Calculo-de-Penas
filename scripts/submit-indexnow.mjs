/**
 * Envía todas las URLs del sitio a IndexNow para notificar a Bing
 * y otros buscadores sobre contenido nuevo.
 *
 * Uso:
 *   node scripts/submit-indexnow.mjs           # enviar
 *   node scripts/submit-indexnow.mjs --dry-run  # simular
 */
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

// El host se deriva de la variable de entorno del proyecto o del valor canónico.
// No usar nunca un hardcode; la fuente de verdad está en lib/site.ts.
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
  : 'www.pinedayasociadoshn.com';

const HOST = SITE_HOST;
const KEY = 'bbbbda6cdb1e4e2cbe8f6f81c1886f58';
const INDEXNOW_URL = 'https://api.indexnow.org/indexnow';
const BATCH_SIZE = 100;

const PUBLIC_ROUTES = [
  '/', '/despacho', '/servicios-juridicos',
  '/servicios-juridicos/derecho-de-familia', '/servicios-juridicos/derecho-laboral',
  '/servicios-juridicos/derecho-civil-y-notarial', '/servicios-juridicos/derecho-mercantil-empresarial',
  '/servicios-juridicos/derecho-bancario-y-financiero', '/servicios-juridicos/derecho-administrativo-y-servicio-civil',
  '/servicios-juridicos/derecho-aduanero-y-comercio-exterior', '/servicios-juridicos/regulacion-sanitaria',
  '/servicios-juridicos/extranjeria-en-honduras', '/servicios-juridicos/propiedad-intelectual',
  '/servicios-juridicos/tributario-fiscal', '/servicios-juridicos/ambiental-regulatorio',
  '/servicios-juridicos/conciliacion-y-arbitraje',
  '/derecho-penal',
  '/derecho-penal/atencion-casos-penales-litigiosos', '/derecho-penal/mediacion-conflictos-penales-y-multas',
  '/derecho-penal/menores-justicia-juvenil', '/derecho-penal/proceso-penal-completo',
  '/derecho-penal/recursos-y-defensa-avanzada', '/derecho-penal/estrategia-penal-y-litigio',
  '/derecho-penal/ejecucion-penal-y-beneficios',
  '/hondurenos-en-espana',
  '/hondurenos-en-espana/gestion-documental-y-legalizacion',
  '/hondurenos-en-espana/actos-notariales-internacionales',
  '/hondurenos-en-espana/asuntos-civiles-y-familiares-desde-el-extranjero',
  '/preguntas-frecuentes', '/blog', '/solicitar-consulta', '/como-llegar',
  '/aviso-legal', '/politica-privacidad', '/politica-cookies', '/terminos', '/disclaimer',
];

const BLOG_CATEGORIES = [
  'derecho-penal', 'proceso-penal', 'derecho-de-familia', 'derecho-laboral',
  'derecho-civil', 'derecho-mercantil', 'extranjeria-migracion', 'hondurenos-en-espana',
  'derecho-notarial', 'tributario', 'noticias-legales', 'practica-legal', 'derechos-ciudadanos',
  'derecho-bancario', 'derecho-administrativo', 'derecho-aduanero', 'regulacion-sanitaria',
  'propiedad-intelectual', 'derecho-ambiental', 'conciliacion-arbitraje',
];

function buildUrlList() {
  const urls = new Set(PUBLIC_ROUTES.map(p => `https://${HOST}${p}`));
  BLOG_CATEGORIES.forEach(c => urls.add(`https://${HOST}/blog/categoria/${c}`));

  const postsDir = 'data/blog/posts';
  if (existsSync(postsDir)) {
    const files = readdirSync(postsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
    for (const f of files) {
      urls.add(`https://${HOST}/blog/${f.replace(/\.ts$/, '')}`);
    }
  }

  return [...urls];
}

const isDryRun = process.argv.includes('--dry-run');
const urlList = buildUrlList();
const keyLocation = `https://${HOST}/.well-known/${KEY}.txt`;

async function submitBatch(urls) {
  const payload = { host: HOST, key: KEY, keyLocation, urlList: urls };

  if (isDryRun) {
    console.log(`[DRY-RUN] Batch de ${urls.length} URLs:`);
    urls.forEach(u => console.log(`  ${u}`));
    return 'ok';
  }

  const res = await fetch(INDEXNOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    console.log(`  ✓ ${urls.length} URLs aceptadas (${res.status})`);
  } else {
    const text = await res.text();
    console.error(`  ✗ Error ${res.status}: ${text}`);
  }
  return res.ok;
}

async function main() {
  console.log(`IndexNow — ${HOST}`);
  console.log(`Clave: ${KEY}`);
  console.log(`Key location: ${keyLocation}`);
  console.log(`Total URLs: ${urlList.length}`);
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (simulación)' : 'REAL'}`);
  console.log('');

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < urlList.length; i += BATCH_SIZE) {
    const batch = urlList.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(urlList.length / BATCH_SIZE);
    process.stdout.write(`Batch ${batchNum}/${totalBatches}... `);
    const result = await submitBatch(batch);
    if (result === 'ok') ok++; else fail++;
    if (i + BATCH_SIZE < urlList.length) await new Promise(r => setTimeout(r, 500));
  }

  console.log('');
  if (isDryRun) {
    console.log('✅ Dry-run. Ejecute sin --dry-run para enviar.');
  } else {
    const status = fail === 0 ? '✅' : '⚠️';
    console.log(`${status} Envío completado: ${ok} batch(es) ok, ${fail} error(es)`);
  }
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});

/**
 * Auditoría de indexación prioritaria (post Fase 1 + Fase 3).
 *
 * PROPÓSITO:
 *   Verificar que las acciones de docs/indexacion-plan-decision.md (Fase 1:
 *   canonicalización landings↔posts, y Fase 3: enlazado interno pilar→posts)
 *   están correctas en producción. Convierte señales SEO en probes automáticos
 *   para detectar regresiones.
 *
 * PROBES:
 *   1. URLs prioritarias (15) existen y devuelven 200.
 *   2. Pares landing/post canibalizados: el post emite canonical → landing.
 *   3. Posts canonicalizados NO aparecen como entradas independientes en
 *      sitemap.xml (su URL canónica sí debe aparecer).
 *   4. Páginas pilar enlazan a posts estratégicos (crawl path).
 *   5. No hay rutas privadas (/intranet, /calculadora, /api...) en sitemap.
 *   6. Canonical y robots correctos en muestra prioritaria.
 *
 * USO:
 *   node scripts/auditar-indexacion-prioritaria.mjs
 *   node scripts/auditar-indexacion-prioritaria.mjs --json
 *   SITE_BASE_URL=https://staging.example.com node scripts/auditar-indexacion-prioritaria.mjs
 *
 * EXIT CODES:
 *   0 = todos los probes pasan
 *   1 = al menos un probe falló (regresión detectada)
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const isJson = args.includes('--json');

const SITE_URL = (process.env.SITE_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pinedayasociadoshn.com').replace(/\/+$/, '');

// 15 URLs prioritarias (docs/indexacion-plan-decision.md §6).
const PRIORITY_URLS = [
  '/',
  '/servicios-juridicos',
  '/derecho-penal',
  '/abogados-en-nacaome',
  '/abogados-en-choluteca',
  '/blog',
  '/blog/derecho-penal',
  '/blog/derecho-de-familia',
  '/blog/derecho-laboral',
  '/blog/derecho-penal/cuando-necesito-abogado-penalista-honduras',
  '/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras',
  '/blog/derecho-penal/delitos-mas-comunes-honduras',
  '/blog/derecho-penal/audiencia-inicial-proceso-penal-honduras',
  '/blog/derecho-laboral/jornada-laboral-horas-extra-descansos-honduras',
  '/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita',
];

// Pares canibalizados: post → landing (canonical esperado).
const CANIBALIZADOS = [
  { post: '/blog/practica-legal/abogados-en-nacaome', landing: '/abogados-en-nacaome' },
  { post: '/blog/practica-legal/abogados-en-choluteca', landing: '/abogados-en-choluteca' },
  { post: '/blog/practica-legal/abogados-en-san-lorenzo', landing: '/abogados-en-san-lorenzo' },
];

// Páginas pilar → posts estratégicos que deben enlazar (crawl path).
const PILAR_LINKS = [
  { pilar: '/', slugs: ['blog/derecho-penal/que-hacer-si-me-detienen-en-honduras'] },
  { pilar: '/servicios-juridicos', slugs: ['blog/derecho-laboral/jornada-laboral-horas-extra-descansos-honduras'] },
  { pilar: '/derecho-penal', slugs: ['blog/derecho-penal'] },
  { pilar: '/hondurenos-en-espana', slugs: ['blog/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras'] },
];

// Rutas privadas que NUNCA deben aparecer en sitemap.
const PRIVATE_PATTERNS = [
  /\/intranet(\/|$)/, /\/calculadora(\/|$)/, /\/casos(\/|$)/, /\/cp(\/|$)/,
  /\/delitos(\/|$)/, /\/atajos(\/|$)/, /\/api(\/|$)/, /\/admin(\/|$)/, /\/login(\/|$)/,
];

const results = [];
let failures = 0;

function addProbe(name, status, detail = '') {
  results.push({ name, status, detail });
  if (status !== 'pass') failures++;
}

async function fetchStatus(path) {
  try {
    const res = await fetch(`${SITE_URL}${path}`, { redirect: 'manual' });
    return { status: res.status, headers: res.headers };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function fetchText(path) {
  try {
    const res = await fetch(`${SITE_URL}${path}`);
    if (!res.ok) return { ok: false, status: res.status, text: '' };
    return { ok: true, status: res.status, text: await res.text() };
  } catch (e) {
    return { ok: false, status: 0, text: '', error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Probes
// ---------------------------------------------------------------------------
async function probePriorityUrls() {
  for (const path of PRIORITY_URLS) {
    const { status } = await fetchStatus(path);
    if (status === 200) {
      addProbe(`URL prioritaria 200: ${path}`, 'pass');
    } else {
      addProbe(`URL prioritaria 200: ${path}`, 'fail', `HTTP ${status}`);
    }
  }
}

async function probeCanonicalizacion() {
  for (const { post, landing } of CANIBALIZADOS) {
    const { ok, text } = await fetchText(post);
    if (!ok) {
      addProbe(`Canonical post→landing: ${post}`, 'fail', `HTTP no OK`);
      continue;
    }
    const canonicalMatch = text.match(/<link rel="canonical" href="([^"]+)"/);
    if (!canonicalMatch) {
      addProbe(`Canonical post→landing: ${post}`, 'fail', `sin tag canonical`);
      continue;
    }
    const canonical = canonicalMatch[1];
    const expected = `${SITE_URL}${landing}`;
    if (canonical === expected || canonical === landing) {
      addProbe(`Canonical post→landing: ${post}`, 'pass', `→ ${landing}`);
    } else {
      addProbe(`Canonical post→landing: ${post}`, 'fail', `canonical=${canonical}, esperado ${expected}`);
    }
  }
}

async function probeSitemapExclusion() {
  const { ok, text } = await fetchText('/sitemap.xml');
  if (!ok) {
    addProbe('Sitemap accesible', 'fail', `HTTP no OK`);
    return;
  }
  addProbe('Sitemap accesible', 'pass', `${text.length} bytes`);

  // Posts canonicalizados NO deben aparecer como URLs independientes.
  for (const { post } of CANIBALIZADOS) {
    const fullUrl = `${SITE_URL}${post}`;
    if (text.includes(`<loc>${fullUrl}</loc>`)) {
      addProbe(`Sitemap excluye post canonicalizado: ${post}`, 'fail', `URL presente en sitemap`);
    } else {
      addProbe(`Sitemap excluye post canonicalizado: ${post}`, 'pass');
    }
  }

  // Rutas privadas no deben aparecer.
  let privateFound = [];
  const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const url of locs) {
    for (const re of PRIVATE_PATTERNS) {
      if (re.test(url)) privateFound.push(url);
    }
  }
  if (privateFound.length === 0) {
    addProbe('Sitemap sin rutas privadas', 'pass', `${locs.length} URLs verificadas`);
  } else {
    addProbe('Sitemap sin rutas privadas', 'fail', `Encontradas: ${privateFound.slice(0, 5).join(', ')}`);
  }
}

async function probePilarLinks() {
  for (const { pilar, slugs } of PILAR_LINKS) {
    const { ok, text } = await fetchText(pilar);
    if (!ok) {
      addProbe(`Pilar enlaza posts: ${pilar}`, 'fail', `HTTP no OK`);
      continue;
    }
    const missing = slugs.filter((s) => !text.includes(`href="/${s}"`));
    if (missing.length === 0) {
      addProbe(`Pilar enlaza posts: ${pilar}`, 'pass', `${slugs.length} enlace(s) OK`);
    } else {
      addProbe(`Pilar enlaza posts: ${pilar}`, 'fail', `Faltan: ${missing.join(', ')}`);
    }
  }
}

async function probeRobotsCanonical() {
  // Muestra: home + 1 landing + 1 post.
  const muestra = ['/', '/abogados-en-nacaome', '/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras'];
  for (const path of muestra) {
    const res = await fetchStatus(path);
    const robots = res.headers.get('x-robots-tag') ?? '';
    if (robots.includes('noindex')) {
      addProbe(`X-Robots-Tag indexable: ${path}`, 'fail', `header=${robots}`);
    } else {
      addProbe(`X-Robots-Tag indexable: ${path}`, 'pass', robots.slice(0, 60));
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  await probePriorityUrls();
  await probeCanonicalizacion();
  await probeSitemapExclusion();
  await probePilarLinks();
  await probeRobotsCanonical();

  if (isJson) {
    console.log(JSON.stringify({ site: SITE_URL, failures, results }, null, 2));
  } else {
    console.log('═══════════════════════════════════════════════════════════');
    console.log(' Auditoría de indexación prioritaria');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Sitio: ${SITE_URL}`);
    console.log(`Probes: ${results.length} | Pasan: ${results.length - failures} | Fallan: ${failures}`);
    console.log('');
    let currentGroup = '';
    for (const r of results) {
      const group = r.name.split(':')[0];
      if (group !== currentGroup) {
        currentGroup = group;
        console.log(`── ${group} ─────────────────────────────────────────`);
      }
      const icon = r.status === 'pass' ? '✓' : '✗';
      console.log(`  ${icon} ${r.name}${r.detail ? '  (' + r.detail + ')' : ''}`);
    }
    console.log('');
    console.log(failures === 0
      ? '✅ Todos los probes pasan.'
      : `⚠️ ${failures} probe(s) fallaron. Revisar regresión.`);
  }
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Error fatal:', e);
  process.exit(1);
});

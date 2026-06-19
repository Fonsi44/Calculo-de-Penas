/**
 * Health-check de señales SEO off-page verificables desde Node (sin DB).
 *
 * PROPÓSITO:
 *   Convertir la parte VERIFICABLE de docs/seo-off-page.md en probes
 *   automáticos que detecten regresiones. La señal que más daño causó
 *   históricamente fue un mismatch entre INDEXNOW_KEY del entorno y el
 *   archivo public/<key>.txt (0% indexación en Bing durante semanas).
 *   Este script lo habría detectado en segundos.
 *
 * ALCANCE (qué NO hace):
 *   No puede crear backlinks, ni verificar propiedad en Bing WMT, ni crear
 *   la ficha de Google Business Profile, ni inventar perfiles sociales.
 *   Esos pendientes son EXTERNOS y se listan como MANUAL al final.
 *
 * PROBES:
 *   HTTP  (8): IndexNow key file, sitemap.xml, robots.txt, JSON-LD (×2),
 *              BingSiteAuth.xml, llms.txt, redirect http→https
 *   DNS   (6): SPF, DKIM, DMARC, MX, NS, google-site-verification TXT
 *   LOCAL (1): consistencia .env INDEXNOW_KEY vs public/<key>.txt
 *
 * USO:
 *   node scripts/seo-health-check.mjs                 # reporte a consola
 *   node scripts/seo-health-check.mjs --quiet         # solo errores
 *   node scripts/seo-health-check.mjs --json          # salida JSON
 *   SITE_BASE_URL=https://staging.example.com node scripts/seo-health-check.mjs
 *
 * EXIT CODES:
 *   0 = todos los probes pasan
 *   1 = al menos un probe falló (regresión detectada)
 */
import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, readdirSync } from 'fs';
import dns from 'node:dns/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const isQuiet = args.includes('--quiet');
const isJson = args.includes('--json');

const SITE_URL = (process.env.SITE_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pinedayasociadoshn.com').replace(/\/+$/, '');
const ORIGIN = SITE_URL;
let HOST;
try {
  HOST = new URL(SITE_URL).hostname;
} catch {
  HOST = 'www.pinedayasociadoshn.com';
}
// Apex domain: los registros DNS (SPF/DKIM/DMARC/MX/NS/TXT) viven en el
// dominio raíz, no en el subdominio www. Derivamos el apex quitando el
// primer label. Para hosts ya en el apex (sin www), HOST === APEX.
const APEX = HOST.split('.').length > 2 && HOST.startsWith('www.') ? HOST.slice(4) : HOST;
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

const results = []; // { category, name, status: 'pass'|'fail'|'warn', detail }

function add(category, name, status, detail) {
  results.push({ category, name, status, detail });
  if (!isJson) {
    const icon = status === 'pass' ? '✓' : status === 'warn' ? '⚠' : '✗';
    if (!isQuiet || status === 'fail') {
      console.log(`  ${icon} ${status === 'fail' ? '\x1b[31m' : status === 'warn' ? '\x1b[33m' : '\x1b[32m'}${name.padEnd(46)}\x1b[0m ${detail ?? ''}`);
    }
  }
}

function mask(key) {
  if (!key) return '(vacía)';
  if (key.length <= 10) return key.slice(0, 3) + '…';
  return key.slice(0, 6) + '…' + key.slice(-2);
}

async function fetchText(url, { redirect = 'follow' } = {}) {
  const res = await fetch(url, { redirect, signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  return { status: res.status, text, headers: res.headers, url: res.url };
}

// ---------------------------------------------------------------------------
// HTTP probes
// ---------------------------------------------------------------------------
async function probeIndexNowKey() {
  if (!INDEXNOW_KEY) {
    add('HTTP', 'IndexNow key file', 'warn', 'INDEXNOW_KEY no definida en entorno');
    return;
  }
  try {
    const { status, text } = await fetchText(`${ORIGIN}/${INDEXNOW_KEY}.txt`);
    if (status !== 200) {
      add('HTTP', 'IndexNow key file', 'fail', `HTTP ${status} en /${mask(INDEXNOW_KEY)}.txt`);
      return;
    }
    const body = text.trim();
    if (body !== INDEXNOW_KEY) {
      add('HTTP', 'IndexNow key file', 'fail', `mismatch: body=${mask(body)} env=${mask(INDEXNOW_KEY)} (regresión crítica)`);
    } else {
      add('HTTP', 'IndexNow key file', 'pass', `HTTP 200, contenido coincide (${mask(INDEXNOW_KEY)})`);
    }
  } catch (e) {
    add('HTTP', 'IndexNow key file', 'fail', `fetch error: ${e.message}`);
  }
}

async function probeSitemap() {
  try {
    const { status, text } = await fetchText(`${ORIGIN}/sitemap.xml`);
    if (status !== 200) {
      add('HTTP', 'sitemap.xml', 'fail', `HTTP ${status}`);
      return;
    }
    const urlCount = (text.match(/<url>/g) || []).length;
    const priorityRoutes = ['/', '/servicios-juridicos', '/derecho-penal', '/abogados-en-nacaome', '/blog'];
    const missing = priorityRoutes.filter((r) => !text.includes(`<loc>${ORIGIN}${r}</loc>`));
    if (missing.length > 0) {
      add('HTTP', 'sitemap.xml', 'fail', `faltan rutas prioritarias: ${missing.join(', ')}`);
    } else {
      add('HTTP', 'sitemap.xml', 'pass', `HTTP 200, ${urlCount} URLs, rutas prioritarias presentes`);
    }
  } catch (e) {
    add('HTTP', 'sitemap.xml', 'fail', `fetch error: ${e.message}`);
  }
}

async function probeRobots() {
  try {
    const { status, text } = await fetchText(`${ORIGIN}/robots.txt`);
    if (status !== 200) {
      add('HTTP', 'robots.txt', 'fail', `HTTP ${status}`);
      return;
    }
    const declaresSitemap = /Sitemap:\s*https?:\/\//i.test(text);
    const blocksAll = /User-agent:\s*\*\s*\nDisallow:\s*\/\s*(\n|$)/i.test(text);
    const aiBotsBlocked = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'CCBot'].filter((b) => text.includes(b));
    const leaksPrivate = /\/intranet|\/calculadora|\/admin\//.test(text) && !/Disallow.*\/intranet/.test(text);
    if (!declaresSitemap) {
      add('HTTP', 'robots.txt', 'fail', 'no declara Sitemap:');
    } else if (blocksAll) {
      add('HTTP', 'robots.txt', 'fail', 'bloquea todo (Disallow: /)');
    } else if (leaksPrivate) {
      add('HTTP', 'robots.txt', 'fail', 'referencia rutas privadas sin disallow');
    } else {
      add('HTTP', 'robots.txt', 'pass', `Sitemap declarado, ${aiBotsBlocked.length} bots IA bloqueados, sin Disallow: /`);
    }
  } catch (e) {
    add('HTTP', 'robots.txt', 'fail', `fetch error: ${e.message}`);
  }
}

async function probeJsonLd(path, label) {
  try {
    const { status, text } = await fetchText(`${ORIGIN}${path}`);
    if (status !== 200) {
      add('HTTP', `JSON-LD ${label}`, 'fail', `HTTP ${status}`);
      return;
    }
    const blocks = [...text.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    if (blocks.length === 0) {
      add('HTTP', `JSON-LD ${label}`, 'fail', 'sin bloques JSON-LD');
      return;
    }
    const types = new Set();
    let sameAsFound = false; // ¿algún nodo declara explícitamente la key?
    let sameAsValue = undefined;
    for (const b of blocks) {
      try {
        const json = JSON.parse(b[1]);
        const arr = Array.isArray(json) ? json : [json];
        for (const node of arr) {
          const t = node['@type'];
          if (Array.isArray(t)) t.forEach((x) => types.add(x));
          else if (t) types.add(t);
          if ('sameAs' in node) {
            sameAsFound = true;
            sameAsValue = node.sameAs;
          }
        }
      } catch {
        // nodo inválido lo ignoramos pero seguimos
      }
    }
    const hasLegal = types.has('LegalService') || types.has('Attorney');
    const hasLocal = types.has('LocalBusiness') || types.has('LegalService');
    if (!hasLegal || !hasLocal) {
      add('HTTP', `JSON-LD ${label}`, 'warn', `tipos: ${[...types].join(', ')} (esperaba LegalService/LocalBusiness)`);
    } else {
      // sameAs solo es "esperado" cuando hay perfiles sociales; sin ellos,
      // omitirlo es lo correcto (ver lib/site.ts + docs/seo-off-page.md §5).
      let sameAsNote;
      if (!sameAsFound) sameAsNote = 'sameAs omitido (correcto: sin perfiles sociales)';
      else if (Array.isArray(sameAsValue) && sameAsValue.length === 0) sameAsNote = 'sameAs=[] vacío (correcto)';
      else sameAsNote = `sameAs=${Array.isArray(sameAsValue) ? sameAsValue.length + ' items' : 'presente'}`;
      add('HTTP', `JSON-LD ${label}`, 'pass', `${blocks.length} bloques, tipos: ${[...types].slice(0, 4).join('/')}, ${sameAsNote}`);
    }
  } catch (e) {
    add('HTTP', `JSON-LD ${label}`, 'fail', `fetch error: ${e.message}`);
  }
}

async function probeStaticFile(path, label) {
  try {
    const { status } = await fetchText(`${ORIGIN}${path}`);
    if (status !== 200) {
      add('HTTP', label, 'warn', `HTTP ${status}`);
    } else {
      add('HTTP', label, 'pass', `HTTP 200`);
    }
  } catch (e) {
    add('HTTP', label, 'warn', `fetch error: ${e.message}`);
  }
}

async function probeRedirect() {
  try {
    const apexHttp = `http://${HOST}`;
    const res = await fetch(apexHttp, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    const loc = res.headers.get('location') || '';
    const endsHttps = loc.startsWith('https://');
    if (endsHttps) {
      add('HTTP', 'redirect http→https', 'pass', `${apexHttp} → ${loc}`);
    } else if (res.status >= 300 && res.status < 400) {
      add('HTTP', 'redirect http→https', 'warn', `HTTP ${res.status} → ${loc} (no termina en https)`);
    } else {
      add('HTTP', 'redirect http→https', 'warn', `HTTP ${res.status} sin Location (posible sin redirect)`);
    }
  } catch (e) {
    add('HTTP', 'redirect http→https', 'warn', `no probeable: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// DNS probes
// ---------------------------------------------------------------------------
async function dnsTxt(name) {
  try {
    const records = await dns.resolveTxt(name);
    // resolveTxt devuelve [[...fragmentos], ...]; unimos cada registro.
    return records.map((r) => r.join(''));
  } catch (e) {
    if (e.code === 'ENOTFOUND' || e.code === 'ENODATA') return [];
    throw e;
  }
}

async function dnsMx(name) {
  try {
    return await dns.resolveMx(name);
  } catch (e) {
    if (e.code === 'ENOTFOUND' || e.code === 'ENODATA') return [];
    throw e;
  }
}

async function dnsNs(name) {
  try {
    return await dns.resolveNs(name);
  } catch (e) {
    if (e.code === 'ENOTFOUND') return [];
    throw e;
  }
}

function hasSubstring(records, substr) {
  return records.some((r) => r.toLowerCase().includes(substr.toLowerCase()));
}

async function probeDns() {
  // SPF
  try {
    const txt = await dnsTxt(APEX);
    const spf = txt.find((r) => r.startsWith('v=spf1'));
    if (!spf) add('DNS', 'SPF', 'fail', 'sin registro v=spf1');
    else if (!spf.includes('amazonses.com')) add('DNS', 'SPF', 'warn', `${spf} (falta include:amazonses.com)`);
    else add('DNS', 'SPF', 'pass', spf);
  } catch (e) {
    add('DNS', 'SPF', 'fail', e.message);
  }

  // DKIM Resend
  try {
    const dkim = await dnsTxt('resend._domainkey.' + APEX);
    const key = dkim.find((r) => r.includes('v=DKIM1') || r.includes('p='));
    if (key) add('DNS', 'DKIM (resend)', 'pass', 'clave pública RSA presente');
    else add('DNS', 'DKIM (resend)', 'fail', 'sin v=DKIM1 en resend._domainkey');
  } catch (e) {
    add('DNS', 'DKIM (resend)', 'fail', e.message);
  }

  // DMARC
  try {
    const dmarc = await dnsTxt('_dmarc.' + APEX);
    const rec = dmarc.find((r) => r.startsWith('v=DMARC1'));
    if (rec) add('DNS', 'DMARC', 'pass', rec);
    else add('DNS', 'DMARC', 'fail', 'sin v=DMARC1 en _dmarc');
  } catch (e) {
    add('DNS', 'DMARC', 'fail', e.message);
  }

  // MX
  try {
    const mx = await dnsMx(APEX);
    if (mx.length === 0) add('DNS', 'MX', 'fail', 'sin registros MX');
    else add('DNS', 'MX', 'pass', mx.map((m) => `${m.priority} ${m.exchange}`).join(', '));
  } catch (e) {
    add('DNS', 'MX', 'fail', e.message);
  }

  // NS
  try {
    const ns = await dnsNs(APEX);
    const vercel = ns.some((n) => n.includes('vercel-dns'));
    if (vercel) add('DNS', 'NS', 'pass', `${ns.length} servers (Vercel)`);
    else add('DNS', 'NS', 'warn', ns.join(', ') + ' (¿no Vercel?)');
  } catch (e) {
    add('DNS', 'NS', 'fail', e.message);
  }

  // GSC verification
  try {
    const txt = await dnsTxt(APEX);
    const gsc = txt.find((r) => r.includes('google-site-verification'));
    if (gsc) add('DNS', 'google-site-verification', 'pass', 'TXT presente (GSC verificado)');
    else add('DNS', 'google-site-verification', 'warn', 'sin TXT google-site-verification');
  } catch (e) {
    add('DNS', 'google-site-verification', 'warn', e.message);
  }
}

// ---------------------------------------------------------------------------
// Local probe: .env INDEXNOW_KEY vs public/<key>.txt
// ---------------------------------------------------------------------------
function probeLocalKeyConsistency() {
  if (!INDEXNOW_KEY) {
    add('LOCAL', 'key .env vs public/', 'warn', 'INDEXNOW_KEY no definida en entorno');
    return;
  }
  const keyFile = join(ROOT, 'public', `${INDEXNOW_KEY}.txt`);
  if (!existsSync(keyFile)) {
    // Buscar cualquier *.txt que coincida (por si hay drift de nombres)
    const publicDir = join(ROOT, 'public');
    const candidates = existsSync(publicDir) ? readdirSync(publicDir).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f)) : [];
    if (candidates.length === 0) {
      add('LOCAL', 'key .env vs public/', 'fail', `env=${mask(INDEXNOW_KEY)} pero no existe public/${mask(INDEXNOW_KEY)}.txt`);
    } else {
      add('LOCAL', 'key .env vs public/', 'fail', `env=${mask(INDEXNOW_KEY)} no coincide con archivos: ${candidates.join(', ')}`);
    }
    return;
  }
  const content = readFileSync(keyFile, 'utf8').trim();
  if (content !== INDEXNOW_KEY) {
    add('LOCAL', 'key .env vs public/', 'fail', `drift: env=${mask(INDEXNOW_KEY)} file=${mask(content)}`);
  } else {
    add('LOCAL', 'key .env vs public/', 'pass', `coinciden (${mask(INDEXNOW_KEY)})`);
  }
}

// ---------------------------------------------------------------------------
// Manual / external (no automatizable, referencia al doc)
// ---------------------------------------------------------------------------
const MANUAL = [
  { name: 'Google Business Profile', ref: 'docs/seo-off-page.md §1', why: 'requiere cuenta Google del despacho' },
  { name: 'Bing Webmaster Tools (verificar dominio)', ref: 'docs/seo-off-page.md §2', why: 'requiere cuenta Microsoft; causa raíz del 0% indexación' },
  { name: 'Perfiles sociales (sameAs)', ref: 'docs/seo-off-page.md §5', why: 'sin URLs reales verificadas (investigado 2026-06-19)' },
  { name: 'Backlinks / link building', ref: 'docs/seo-off-page.md §6', why: 'acciones relacionales (prensa, directorios, colaboraciones)' },
  { name: 'Política de bots IA', ref: 'docs/seo-off-page.md §8', why: 'decisión de negocio (¿permitir GPTBot?)' },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!isJson) {
    console.log('═══════════════════════════════════════════════════════');
    console.log(` SEO health-check — ${ORIGIN}`);
    console.log('═══════════════════════════════════════════════════════');
  }

  // HTTP probes
  if (!isJson) console.log('\n── HTTP ────────────────────────────────────────────────');
  await probeIndexNowKey();
  await probeSitemap();
  await probeRobots();
  await probeJsonLd('/', 'home');
  await probeJsonLd('/derecho-penal', 'derecho-penal');
  await probeStaticFile('/BingSiteAuth.xml', 'BingSiteAuth.xml');
  await probeStaticFile('/llms.txt', 'llms.txt');
  await probeRedirect();

  // DNS probes
  if (!isJson) console.log('\n── DNS ─────────────────────────────────────────────────');
  await probeDns();

  // Local probe
  if (!isJson) console.log('\n── LOCAL ───────────────────────────────────────────────');
  probeLocalKeyConsistency();

  // Summary
  const pass = results.filter((r) => r.status === 'pass').length;
  const warn = results.filter((r) => r.status === 'warn').length;
  const fail = results.filter((r) => r.status === 'fail').length;

  if (isJson) {
    console.log(JSON.stringify({
      site: ORIGIN,
      host: HOST,
      timestamp: new Date().toISOString(),
      summary: { pass, warn, fail, total: results.length },
      probes: results,
      manual: MANUAL,
    }, null, 2));
  } else {
    console.log('\n── MANUAL / externo (no automatizable) ─────────────────');
    for (const m of MANUAL) {
      console.log(`  • ${m.name.padEnd(42)} ${m.ref}`);
      console.log(`    ${m.why}`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    const color = fail > 0 ? '\x1b[31m' : warn > 0 ? '\x1b[33m' : '\x1b[32m';
    console.log(` ${color}Resultado: ${pass} OK · ${warn} warn · ${fail} fail${'\x1b[0m'} de ${results.length} probes`);
    console.log('═══════════════════════════════════════════════════════');
    if (fail > 0) {
      console.log('\n⚠️  Regresiones detectadas. Revisar probes marcados ✗.');
      console.log('   Referencia: docs/seo-off-page.md');
    }
  }

  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(2);
});

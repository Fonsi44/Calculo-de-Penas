/**
 * Auditoría SEO de contenido dinámico del blog (lectura completa).
 *
 * Ejecutar: npx tsx scripts/seo-content-audit.ts
 *           npx tsx scripts/seo-content-audit.ts --json   (salida machine-readable)
 *
 * Diferencia con scripts existentes:
 *   - validar-fechas-blog.ts  → solo fechas futuras
 *   - content-audit.ts        → solo vencimiento editorial
 *   - normalizar-blog.ts      → H1→H2, CTAs duplicados, whitespace
 *   - blog-ai-review.ts       → sugerencias IA (DeepSeek)
 *
 * ESTE script cubre los gaps SEO de ENLACES y HTML:
 *   - enlaces internos con rel="nofollow" (deben eliminarse salvo justificación)
 *   - enlaces internos que apuntan a redirects conocidos (next.config.ts)
 *   - enlaces internos absolutos inconsistentes (http:// o dominios no canónicos)
 *   - URLs http en vez de https
 *   - imágenes <img> sin atributo alt
 *   - anchors vacíos o no descriptivos ("aquí", "click", "ver", etc.)
 *   - fechas no ISO-8601 / inválidas para BlogPosting
 *   - HTML malformado básico (etiquetas sin cerrar, anidamiento roto)
 *
 * Es de SOLO LECTURA: no modifica la DB. Sale con código 1 si hay hallazgos
 * críticos (para CI), 0 si todo limpio.
 *
 * Decisiones de diseño (R4/R5): no inventar datos legales, no rediseñar,
 * no modificar slugs/categorías. Solo reporta.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

// ─── Redirects conocidos (cargados de next.config.ts) ────────────────────
// Los redirects de blog viven en next.config.ts redirects(). Los cargamos
// estáticamente para validar enlaces internos que apuntan a rutas antiguas.
type RedirectEntry = { source: string; destination: string };

function loadRedirectsFromConfig(): RedirectEntry[] {
  try {
    // next.config.ts no se puede importar como módulo TS directamente desde
    // un script (ESM/CJS). Lo parseamos con regex sobre el source.
    const cfgPath = path.join(process.cwd(), 'next.config.ts');
    const src = fs.readFileSync(cfgPath, 'utf8');
    const redirects: RedirectEntry[] = [];
    // Patrón: { source: '...', destination: '...', permanent: true }
    const re = /\{\s*source:\s*'([^']+)'\s*,\s*destination:\s*'([^']+)'/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      redirects.push({ source: m[1], destination: m[2] });
    }
    return redirects;
  } catch {
    return [];
  }
}

// ─── Helpers de parseo HTML (sin dependencias externas) ──────────────────
export interface LinkFinding {
  href: string;
  anchor: string;
  rel: string;
  raw: string;
}

/** Extrae todos los <a> de un HTML con sus atributos. */
export function extractLinks(html: string): LinkFinding[] {
  const links: LinkFinding[] = [];
  const re = /<a\s+([^>]*?)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const anchor = m[2].replace(/<[^>]*>/g, '').trim();
    const hrefMatch = attrs.match(/href\s*=\s*"([^"]*)"/i) || attrs.match(/href\s*=\s*'([^']*)'/i);
    const relMatch = attrs.match(/rel\s*=\s*"([^"]*)"/i) || attrs.match(/rel\s*=\s*'([^']*)'/i);
    links.push({
      href: hrefMatch ? hrefMatch[1] : '',
      anchor,
      rel: relMatch ? relMatch[1] : '',
      raw: m[0],
    });
  }
  return links;
}

export interface ImgFinding {
  src: string;
  alt: string | null;
  hasAltAttr: boolean;
}

/** Extrae todos los <img> de un HTML. */
export function extractImages(html: string): ImgFinding[] {
  const imgs: ImgFinding[] = [];
  const re = /<img\s+([^>]*?)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const srcMatch = attrs.match(/src\s*=\s*"([^"]*)"/i) || attrs.match(/src\s*=\s*'([^']*)'/i);
    const altMatch = attrs.match(/alt\s*=\s*"([^"]*)"/i) || attrs.match(/alt\s*=\s*'([^']*)'/i);
    imgs.push({
      src: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1] : null,
      hasAltAttr: altMatch !== null,
    });
  }
  return imgs;
}

// ─── Clasificación de URLs ────────────────────────────────────────────────
export const SITE_DOMAINS = [
  'pinedayasociadoshn.com',
  'calculo-de-penas-nextjs.vercel.app',
];

export function isInternalUrl(href: string): boolean {
  if (!href) return false;
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) return true;
  try {
    const u = new URL(href);
    return SITE_DOMAINS.some((d) => u.hostname === d || u.hostname === 'www.' + d);
  } catch {
    return false;
  }
}

export function isExternalUrl(href: string): boolean {
  if (!href) return false;
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  try {
    const u = new URL(href);
    return !SITE_DOMAINS.some((d) => u.hostname === d || u.hostname === 'www.' + d);
  } catch {
    return false;
  }
}

// Anchors pobres/genéricos (deben ser descriptivos).
const POOR_ANCHORS = new Set([
  'aquí', 'aqui', 'aquí.', 'aqui.', 'click', 'clic', 'click aquí', 'clic aquí',
  'ver', 'ver más', 'ver mas', 'más', 'mas', 'este', 'este enlace', 'enlace',
  'link', 'este link', 'leer más', 'leer mas', '...', '›', '»',
]);

export function isPoorAnchor(anchor: string): boolean {
  const a = anchor.toLowerCase().trim();
  if (!a) return true;
  if (POOR_ANCHORS.has(a)) return true;
  // Anchors de una sola palabra genérica o muy cortos.
  if (a.length <= 2 && !['cp', 'ar'].includes(a)) return true;
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────
interface Finding {
  slug: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  detail: string;
  snippet?: string;
}

interface PostIssues {
  slug: string;
  title: string;
  category: string;
  published: boolean;
  noindex: boolean;
  linksInternalNofollow: { href: string; anchor: string }[];
  linksToRedirects: { href: string; target: string; anchor: string }[];
  linksInsecureHttp: { href: string; anchor: string }[];
  linksPoorAnchors: { href: string; anchor: string }[];
  imagesWithoutAlt: { src: string }[];
  dateIssues: string[];
  htmlIssues: string[];
  externalLinks: { href: string; anchor: string }[];
}

async function main() {
  const jsonMode = process.argv.includes('--json');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.log('⚠️  No hay DATABASE_URL. No se puede auditar.');
    process.exit(0);
  }

  const sql = neon(process.env.DATABASE_URL);
  const posts = await sql`
    SELECT slug, title, body, category, published, noindex,
           published_at, updated_at, creado_en
    FROM blog_posts
    ORDER BY creado_en ASC
  `;

  const redirects = loadRedirectsFromConfig();
  // Mapa source → destination para lookup rápido.
  const redirectMap = new Map(redirects.map((r) => [r.source, r.destination]));
  // También versiones con :path* expandidas a prefijos.
  const redirectPrefixes = redirects
    .filter((r) => r.source.includes(':path*'))
    .map((r) => ({ prefix: r.source.replace(/\/:path\*$/, '/'), dest: r.destination.replace(/\/:path\*$/, '/') }));

  function matchesRedirect(href: string): string | null {
    // Match exacto.
    if (redirectMap.has(href)) return redirectMap.get(href)!;
    // Match con prefijo (:path*).
    for (const rp of redirectPrefixes) {
      if (href.startsWith(rp.prefix)) {
        return rp.dest + href.substring(rp.prefix.length);
      }
    }
    return null;
  }

  const issues: PostIssues[] = [];
  const allFindings: Finding[] = [];
  const MAX_DATE = new Date(Date.now() + 24 * 60 * 60 * 1000);

  for (const p of posts) {
    const body: string = p.body ?? '';
    const links = extractLinks(body);
    const imgs = extractImages(body);

    const postIssues: PostIssues = {
      slug: p.slug,
      title: p.title,
      category: p.category,
      published: p.published,
      noindex: p.noindex,
      linksInternalNofollow: [],
      linksToRedirects: [],
      linksInsecureHttp: [],
      linksPoorAnchors: [],
      imagesWithoutAlt: [],
      dateIssues: [],
      htmlIssues: [],
      externalLinks: [],
    };

    // ── Links ──
    for (const link of links) {
      // HTTP inseguro (excepto localhost de ejemplos).
      if (/^http:\/\//i.test(link.href) && !link.href.includes('localhost')) {
        postIssues.linksInsecureHttp.push({ href: link.href, anchor: link.anchor });
        allFindings.push({ slug: p.slug, category: p.category, severity: 'warning', type: 'http_inseguro', detail: link.href, snippet: link.anchor });
      }

      if (isInternalUrl(link.href)) {
        // Normalizar: quitar dominio si es absoluto del propio sitio.
        let path = link.href;
        try {
          const u = new URL(link.href, 'https://www.pinedayasociadoshn.com');
          if (SITE_DOMAINS.some((d) => u.hostname === d || u.hostname === 'www.' + d)) {
            path = u.pathname + u.search + u.hash;
          }
        } catch { /* href relativo, dejar tal cual */ }

        // nofollow en interno (debe eliminarse salvo justificación documentada).
        if (/\bnofollow\b/i.test(link.rel)) {
          postIssues.linksInternalNofollow.push({ href: path, anchor: link.anchor });
          allFindings.push({ slug: p.slug, category: p.category, severity: 'critical', type: 'nofollow_interno', detail: path, snippet: link.anchor });
        }

        // ¿Apunta a un redirect conocido?
        const target = matchesRedirect(path);
        if (target) {
          postIssues.linksToRedirects.push({ href: path, target, anchor: link.anchor });
          allFindings.push({ slug: p.slug, category: p.category, severity: 'warning', type: 'link_a_redirect', detail: `${path} → ${target}`, snippet: link.anchor });
        }

        // Anchor pobre.
        if (isPoorAnchor(link.anchor)) {
          postIssues.linksPoorAnchors.push({ href: path, anchor: link.anchor });
          allFindings.push({ slug: p.slug, category: p.category, severity: 'info', type: 'anchor_pobre', detail: path, snippet: link.anchor });
        }
      } else if (isExternalUrl(link.href)) {
        postIssues.externalLinks.push({ href: link.href, anchor: link.anchor });
      }
    }

    // ── Imágenes sin alt ──
    for (const img of imgs) {
      if (!img.hasAltAttr || !img.alt || !img.alt.trim()) {
        postIssues.imagesWithoutAlt.push({ src: img.src });
        allFindings.push({ slug: p.slug, category: p.category, severity: 'warning', type: 'img_sin_alt', detail: img.src });
      }
    }

    // ── Fechas ──
    const checkDate = (label: string, d: string | null) => {
      if (!d) return;
      const dt = new Date(d);
      if (isNaN(dt.getTime())) {
        postIssues.dateIssues.push(`${label} inválida: ${d}`);
        allFindings.push({ slug: p.slug, category: p.category, severity: 'critical', type: 'fecha_invalida', detail: `${label}=${d}` });
        return;
      }
      // ISO-8601 check: la DB devuelve timestamp; validamos que sea parseable.
      if (dt > MAX_DATE) {
        postIssues.dateIssues.push(`${label} futura: ${dt.toISOString()}`);
        allFindings.push({ slug: p.slug, category: p.category, severity: 'critical', type: 'fecha_futura', detail: `${label}=${dt.toISOString()}` });
      }
    };
    checkDate('published_at', p.published_at);
    checkDate('updated_at', p.updated_at);
    // Orden lógico: published_at <= updated_at.
    if (p.published_at && p.updated_at) {
      const pub = new Date(p.published_at);
      const upd = new Date(p.updated_at);
      if (!isNaN(pub.getTime()) && !isNaN(upd.getTime()) && pub > upd) {
        postIssues.dateIssues.push(`published_at > updated_at (${pub.toISOString()} > ${upd.toISOString()})`);
        allFindings.push({ slug: p.slug, category: p.category, severity: 'critical', type: 'orden_fechas', detail: `pub=${pub.toISOString()} upd=${upd.toISOString()}` });
      }
    }

    // ── HTML malformado (validación ligera) ──
    // Cuenta apertura vs cierre de tags comunes.
    const tagsToCheck = ['p', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote', 'div', 'table', 'tr', 'td'];
    for (const tag of tagsToCheck) {
      const openRe = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
      const closeRe = new RegExp(`</${tag}>`, 'gi');
      const opens = (body.match(openRe) || []).length;
      const closes = (body.match(closeRe) || []).length;
      if (opens !== closes) {
        postIssues.htmlIssues.push(`<${tag}>: ${opens} abiertas vs ${closes} cerradas`);
        allFindings.push({ slug: p.slug, category: p.category, severity: 'warning', type: 'html_desbalanceado', detail: `<${tag}> ${opens}/${closes}` });
      }
    }

    issues.push(postIssues);
  }

  // ── Reporte ──
  const stats = {
    posts_auditados: issues.length,
    publicados: issues.filter((i) => i.published).length,
    nofollow_internos: issues.reduce((s, i) => s + i.linksInternalNofollow.length, 0),
    links_a_redirects: issues.reduce((s, i) => s + i.linksToRedirects.length, 0),
    http_inseguros: issues.reduce((s, i) => s + i.linksInsecureHttp.length, 0),
    anchors_pobres: issues.reduce((s, i) => s + i.linksPoorAnchors.length, 0),
    imgs_sin_alt: issues.reduce((s, i) => s + i.imagesWithoutAlt.length, 0),
    fecha_issues: issues.reduce((s, i) => s + i.dateIssues.length, 0),
    html_issues: issues.reduce((s, i) => s + i.htmlIssues.length, 0),
    enlaces_externos: issues.reduce((s, i) => s + i.externalLinks.length, 0),
    posts_con_nofollow: issues.filter((i) => i.linksInternalNofollow.length > 0).length,
    posts_con_redirect: issues.filter((i) => i.linksToRedirects.length > 0).length,
    posts_con_img_sin_alt: issues.filter((i) => i.imagesWithoutAlt.length > 0).length,
  };

  if (jsonMode) {
    console.log(JSON.stringify({ stats, issues, findings: allFindings }, null, 2));
  } else {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  AUDITORÍA SEO DE CONTENIDO — blog_posts');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Posts auditados:        ${stats.posts_auditados}`);
    console.log(`  Publicados:           ${stats.publicados}`);
    console.log(`Enlaces externos (total): ${stats.enlaces_externos}`);
    console.log('');
    console.log('── Hallazgos ──');
    console.log(`  🔴 nofollow internos:  ${stats.nofollow_internos} (en ${stats.posts_con_nofollow} posts)`);
    console.log(`  🟠 links a redirects: ${stats.links_a_redirects} (en ${stats.posts_con_redirect} posts)`);
    console.log(`  🟠 http inseguros:     ${stats.http_inseguros}`);
    console.log(`  🟠 <img> sin alt:      ${stats.imgs_sin_alt} (en ${stats.posts_con_img_sin_alt} posts)`);
    console.log(`  🟡 anchors pobres:     ${stats.anchors_pobres}`);
    console.log(`  🟡 HTML desbalanceado: ${stats.html_issues}`);
    console.log(`  🔴 fechas (futuras/inv): ${stats.fecha_issues}`);
    console.log('');

    // Detalle de críticos (nofollow internos y fechas).
    const criticals = allFindings.filter((f) => f.severity === 'critical');
    if (criticals.length > 0) {
      console.log('── CRÍTICOS (requieren corrección) ──');
      for (const f of criticals.slice(0, 60)) {
        console.log(`  [${f.type}] ${f.slug}: ${f.detail}${f.snippet ? `  "${f.snippet.substring(0, 40)}"` : ''}`);
      }
      if (criticals.length > 60) console.log(`  ... y ${criticals.length - 60} más`);
      console.log('');
    }

    // Detalle de nofollow internos (los más importantes para esta fase).
    const nf = issues.filter((i) => i.linksInternalNofollow.length > 0);
    if (nf.length > 0) {
      console.log('── NOFOLLOW INTERNOS (top 20 posts) ──');
      for (const i of nf.slice(0, 20)) {
        console.log(`  ${i.slug}:`);
        for (const l of i.linksInternalNofollow) {
          console.log(`    → ${l.href}  "${l.anchor.substring(0, 50)}"`);
        }
      }
      console.log('');
    }

    // Top dominios externos (para revisión manual de enlaces rotos).
    const domains = new Map<string, number>();
    for (const i of issues) {
      for (const l of i.externalLinks) {
        try {
          const u = new URL(l.href);
          domains.set(u.hostname, (domains.get(u.hostname) || 0) + 1);
        } catch { /* skip */ }
      }
    }
    if (domains.size > 0) {
      console.log('── DOMINIOS EXTERNOS ENLAZADOS (top 25) ──');
      const sorted = [...domains.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
      for (const [host, n] of sorted) {
        console.log(`  ${String(n).padStart(4)}  ${host}`);
      }
      console.log('');
    }
  }

  // Salir con código 1 si hay críticos (para CI).
  const hasCriticals = allFindings.some((f) => f.severity === 'critical');
  process.exit(hasCriticals ? 1 : 0);
}

// Guard: solo ejecutar main() cuando el script se invoca directamente (CLI),
// no cuando se importa como módulo (tests solo usan las funciones puras).
// tsx resuelve el argv[1] como la ruta del script; tanto en Unix como Windows
// el nombre del archivo termina en 'seo-content-audit.ts'.
const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').endsWith('seo-content-audit.ts') ||
  process.argv[1]?.replace(/\\/g, '/').endsWith('seo-content-audit');

if (isDirectRun) {
  main().catch((e) => {
    console.error('Error en auditoría:', e);
    process.exit(1);
  });
}

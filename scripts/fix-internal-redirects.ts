/**
 * Corrige enlaces internos del blog que apuntan a rutas con redirect 301.
 *
 * Uso:
 *   npx tsx scripts/fix-internal-redirects.ts             # dry-run (solo reporta)
 *   npx tsx scripts/fix-internal-redirects.ts --aplicar    # aplica cambios en DB
 *
 * QUÉ HACE:
 *   Para cada post, localiza los <a href="/blog/..."> cuyo path coincide con
 *   un redirect declarado en next.config.ts y reemplaza el href por la URL
 *   destino canónica. Conserva el anchor y el resto de atributos (rel, target).
 *   Solo toca el atributo href: no cambia texto visible ni estructura.
 *
 * SEGURIDAD:
 *   - Dry-run por defecto: sin --aplicar no escribe en DB.
 *   - Idempotente: una vez corregido, el href apunta al destino y no vuelve
 *     a matchear ningún redirect (el destino es la URL canónica final).
 *   - Requiere backup previo (lo verifica: si no existe backup en las últimas
 *     2 horas, aborta con instrucciones).
 *   - No inventa URLs: usa exclusivamente los destinos de next.config.ts.
 *   - No toca slugs, categorías ni contenido editorial (solo hrefs).
 *
 * DECISIONES (R4/R5/R7): no inventar datos, no rediseñar, commit atómico.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

type RedirectEntry = { source: string; destination: string };

/**
 * Mapa de URLs internas rotas conocidas que NO están cubiertas por redirects
 * de next.config.ts y cuyo destino canónico (post 200 existente) es inequívoco.
 *
 * Fuentes: auditoría Ahrefs Fase 1 (Jul 2026). Estas URLs aparecen en el body
 * HTML de posts persistidos en DB (tabla blog_posts, campo body) apuntando a
 * rutas /articulos/* que nunca existieron como páginas. Se reescriben al post
 * canónico equivalente verificado (200).
 *
 * Idempotente: una vez reescrito, el href apunta al destino y no vuelve a
 * matchear (el destino no está en este mapa ni en redirects).
 */
const REWRITE_MAP: RedirectEntry[] = [
  { source: '/articulos/declaracion-isr-personas-naturales', destination: '/blog/tributario/impuesto-renta-personas-fisicas-honduras' },
  { source: '/articulos/facturacion-electronica-honduras', destination: '/blog/tributario/facturacion-electronica-requisitos-sar' },
  { source: '/articulos/isv-en-honduras', destination: '/blog/tributario/isv-impuesto-venta-tasas-obligaciones-honduras' },
  // /contacto redirige (301) a /solicitar-consulta. Reescribimos en origen
  // para evitar la cadena de redirect (mejor UX + menos hops de crawl).
  { source: '/contacto', destination: '/solicitar-consulta' },
];

function loadRedirectsFromConfig(): RedirectEntry[] {
  try {
    const cfgPath = path.join(process.cwd(), 'next.config.ts');
    const src = fs.readFileSync(cfgPath, 'utf8');
    const redirects: RedirectEntry[] = [];
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

function checkRecentBackup(): boolean {
  const dir = path.join(process.cwd(), 'auditoria-blog');
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('backup-') && f.endsWith('.json'));
  if (files.length === 0) return false;
  // Verificar que haya un backup de menos de 2 horas.
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.mtimeMs > twoHoursAgo) return true;
  }
  return false;
}

async function main() {
  const aplicar = process.argv.includes('--aplicar');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.log('⚠️  No hay DATABASE_URL.');
    process.exit(1);
  }

  if (aplicar && !checkRecentBackup()) {
    console.log('❌ ABORTADO: no hay backup reciente (<2h). Ejecuta primero:');
    console.log('   npx tsx scripts/backup-blog.ts');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const redirects = loadRedirectsFromConfig();
  const redirectMap = new Map(redirects.map((r) => [r.source, r.destination]));
  const redirectPrefixes = redirects
    .filter((r) => r.source.includes(':path*'))
    .map((r) => ({ prefix: r.source.replace(/\/:path\*$/, '/'), dest: r.destination.replace(/\/:path\*$/, '/') }));
  // Mapa de reescritura de URLs rotas conocidas (prioridad sobre redirects).
  const rewriteMap = new Map(REWRITE_MAP.map((r) => [r.source, r.destination]));

  function resolveRedirect(href: string): string | null {
    // 1. URLs rotas conocidas (/articulos/*, /contacto sin redirect-chain).
    if (rewriteMap.has(href)) return rewriteMap.get(href)!;
    // 2. Redirects declarados en next.config.ts.
    if (redirectMap.has(href)) return redirectMap.get(href)!;
    for (const rp of redirectPrefixes) {
      if (href.startsWith(rp.prefix)) {
        return rp.dest + href.substring(rp.prefix.length);
      }
    }
    return null;
  }

  const posts = await sql`
    SELECT id, slug, title, body, category, published
    FROM blog_posts
    ORDER BY creado_en ASC
  `;

  let postsModificados = 0;
  let enlacesCorregidos = 0;
  let postsBorradorModificados = 0;
  const cambios: { slug: string; de: string; a: string; anchor: string; fuente: string }[] = [];

  for (const p of posts) {
    const body: string = p.body ?? '';
    let newBody = body;
    let changed = false;

    // Regex para encontrar <a ... href="..." ...>...</a> o <a ... href='...' ...>...</a>
    // Tolerante a comillas dobles o simples (algunos posts usan href='/...').
    // Captura: pre-href (hasta '='), comilla de apertura, href, comilla de cierre,
    // atributos restantes + '>', anchor.
    const linkRe = /(<a\s+[^>]*?href\s*=\s*)(["'])([^"']*)\2([^>]*>)([\s\S]*?<\/a>)/gi;
    newBody = newBody.replace(linkRe, (full, pre, quote, href, attrs, rest) => {
      // Solo rutas internas relativas que matchean un redirect o rewrite.
      if (!href.startsWith('/')) return full;
      const target = resolveRedirect(href);
      if (!target) return full;
      changed = true;
      enlacesCorregidos++;
      const anchor = rest.replace(/<[^>]*>/g, '').trim().substring(0, 60);
      const fuente = rewriteMap.has(href) ? 'rewrite-map' : 'redirect-301';
      cambios.push({ slug: p.slug, de: href, a: target, anchor, fuente });
      // Reconstruye preservando la comilla original del href.
      return `${pre}${quote}${target}${quote}${attrs}${rest}`;
    });

    if (changed) {
      postsModificados++;
      if (!p.published) postsBorradorModificados++;
      if (aplicar) {
        // Solo actualizar updated_at en posts publicados (los borradores no
        // se exponen públicamente; no queremos alterar su fecha de revisión).
        if (p.published) {
          await sql`
            UPDATE blog_posts
            SET body = ${newBody}, updated_at = NOW()
            WHERE id = ${p.id}
          `;
        } else {
          await sql`
            UPDATE blog_posts
            SET body = ${newBody}
            WHERE id = ${p.id}
          `;
        }
      }
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CORRECCIÓN DE ENLACES INTERNOS A REDIRECTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Modo:               ${aplicar ? 'APLICAR (escritura DB)' : 'DRY-RUN (solo lectura)'}`);
  console.log(`Posts analizados:  ${posts.length}`);
  console.log(`Posts modificados: ${postsModificados} (${postsBorradorModificados} borradores)`);
  console.log(`Enlaces corregidos: ${enlacesCorregidos}`);
  console.log('');

  if (cambios.length > 0) {
    console.log('── Detalle de cambios ──');
    for (const c of cambios) {
      console.log(`  ${c.slug}  [${c.fuente}]:`);
      console.log(`    ${c.de}`);
      console.log(`    → ${c.a}  "${c.anchor}"`);
    }
  }

  if (!aplicar && cambios.length > 0) {
    console.log('');
    console.log('💡 Para aplicar estos cambios, ejecuta:');
    console.log('   1. npx tsx scripts/backup-blog.ts         (backup previo)');
    console.log('   2. npx tsx scripts/fix-internal-redirects.ts --aplicar');
  }
  if (aplicar) {
    console.log('');
    console.log('✅ Cambios aplicados. Verifica con:');
    console.log('   npx tsx scripts/seo-content-audit.ts');
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});

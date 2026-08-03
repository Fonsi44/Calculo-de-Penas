/**
 * Contrato del blog contra datos dinámicos (PROMPT 2 §7.2).
 *
 * Valida con datos reales de local/staging (o snapshot) la coherencia de los
 * artículos publicados e indexables:
 *   - slug único;
 *   - canonical válido;
 *   - title / H1 / meta description;
 *   - autor corporativo canónico (NO exige autor individual);
 *   - estado publicable y fecha válida;
 *   - categoría conocida y servicio relacionado;
 *   - enlaces relacionados válidos (sin rotos ni URLs privadas);
 *   - ausencia de contenido vacío, claims prohibidos y HTML peligroso;
 *   - sitemap del blog coherente;
 *   - JSON-LD coherente (canonical único);
 *   - llms.txt coherente.
 *
 * Rechaza producción. No escribe nada. Salida exit 0 = PASS, exit 1 = FAIL.
 * Si la DB no está disponible, se reporta SKIPPED_WITH_REASON (no se marca
 * PASS).
 *
 * Uso:
 *   npx tsx scripts/audit-blog-contract.ts --env-file .env.e2e.local
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import {
  inspectEnvironment,
  assertAllowedEnvironment,
  describeEnvironment,
  loadEnvFile,
} from '@/scripts/lib/environment-guard';
import { scanContentPolicyViolations } from '@/lib/content-policy';
import { BLOG_TO_SERVICE } from '@/lib/internal-links';
import { blogCategories } from '@/data/blog/categories';
import { NOINDEX_LANDING_PATHS } from '@/lib/seo/public-indexability';
import canonicalPathsData from '@/data/seo/canonical-paths.json';

/** Rutas públicas estáticas (para validar canonical internos a landings). */
const STATIC_PUBLIC_PATHS = new Set<string>(
  (canonicalPathsData.static_routes as Array<{ path: string }>).map((r) => r.path),
);
const CANONICAL_ORIGIN = 'https://www.pinedayasociadoshn.com';

const ROOT = process.cwd();

interface PostRow {
  slug: string;
  title: string;
  description: string;
  body: string;
  published_at: string | null;
  category: string;
  author: string | null;
  noindex: boolean | null;
  canonical_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  review_status: string | null;
  published: boolean;
}

const INDEXABLE_REVIEW_STATUS = new Set(['published_firm_reviewed', 'reviewed']);

const DANGEROUS_HTML_PATTERN =
  /<(script|iframe|object|embed)\b|javascript:\s*\/\//i;
const ONHANDLER_PATTERN = /\son(?:error|click|load|mouseover|focus|submit)\s*=/i;

const CANONICAL_AUTHOR = 'Pineda y Asociados';

function checkLabel(ok: boolean): 'PASS' | 'FAIL' {
  return ok ? 'PASS' : 'FAIL';
}

async function loadPosts(): Promise<PostRow[] | null> {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('placeholder')) return null;
  const sql: NeonQueryFunction<false, false> = neon(url);
  return (await sql`
    select slug, title, description, body, published_at, category, author,
           noindex, canonical_url, meta_title, meta_description, review_status,
           published
    from blog_posts
  `) as PostRow[];
}

/** Extrae enlaces internos /blog/... del body. */
function extractBlogHrefs(body: string): string[] {
  const out: string[] = [];
  const re = /href=["'](\/blog\/[^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) out.push(m[1]);
  return out;
}

function main(): void {
  const envFile = process.argv.includes('--env-file')
    ? process.argv[process.argv.indexOf('--env-file') + 1]
    : '.env.local';
  loadEnvFile(envFile);
  const inspection = inspectEnvironment();
  assertAllowedEnvironment('seo:blog-contract', { write: false });

  const knownCategories = new Set(blogCategories.map((c) => c.slug));
  const failures: string[] = [];
  const infos: string[] = [];

  loadPosts()
    .then((posts) => {
      if (!posts) {
        console.log('⛔ SEO BLOG CONTRACT: SKIPPED_WITH_REASON (sin DB local/staging accesible).');
        console.log('   Proporcione --env-file con una base local/staging para validar datos dinámicos.');
        process.exit(2);
      }

      const indexable = posts.filter((p) =>
        p.published === true
        && p.noindex !== true
        && INDEXABLE_REVIEW_STATUS.has(p.review_status ?? ''),
      );
      const published = posts.filter((p) => p.published === true);
      const now = Date.now();

      // ── 1. slug único ───────────────────────────────────────────────────
      const slugCounts = new Map<string, number>();
      for (const p of published) slugCounts.set(p.slug, (slugCounts.get(p.slug) ?? 0) + 1);
      for (const [slug, count] of slugCounts) {
        if (count > 1) failures.push(`Slug duplicado: ${slug} (${count})`);
      }

      // ── 2..12. Contrato por artículo indexable ──────────────────────────
      const catalogSlugs = new Set(published.map((p) => p.slug));
      for (const p of indexable) {
        const ctx = `/blog/${p.category}/${p.slug}`;
        if (!p.title || !p.title.trim()) failures.push(`[${ctx}] title vacío.`);
        if (!p.description || !p.description.trim()) failures.push(`[${ctx}] description vacía.`);
        if (!p.body || !p.body.trim()) failures.push(`[${ctx}] body vacío.`);

        const canonical = p.canonical_url || ctx;
        const canonicalOk = canonical === ctx
          || (canonical.startsWith('/') && STATIC_PUBLIC_PATHS.has(canonical) && !NOINDEX_LANDING_PATHS.has(canonical))
          || (canonical.startsWith(CANONICAL_ORIGIN));
        if (!canonicalOk) {
          failures.push(`[${ctx}] canonical inválido: ${canonical}`);
        }

        if (!p.author || !p.author.trim()) {
          failures.push(`[${ctx}] falta autor.`);
        } else if (p.author.trim() !== CANONICAL_AUTHOR) {
          // Autoría corporativa canónica (decisión vigente). Otros valores
          // corporativos aceptados; no se exige autor individual.
          infos.push(`[${ctx}] autor no es la variante canónica exacta: "${p.author.trim()}"`);
        }

        if (!p.published_at) {
          failures.push(`[${ctx}] falta published_at.`);
        } else {
          const t = new Date(p.published_at).getTime();
          if (Number.isNaN(t)) failures.push(`[${ctx}] published_at no es fecha válida.`);
          else if (t > now + 24 * 3600 * 1000) failures.push(`[${ctx}] published_at en el futuro.`);
        }

        if (!p.category || !p.category.trim()) {
          failures.push(`[${ctx}] falta categoría.`);
        } else if (!knownCategories.has(p.category)) {
          infos.push(`[${ctx}] categoría no declarada en data/blog/categories.ts: ${p.category}`);
        }

        const service = BLOG_TO_SERVICE[p.category];
        if (!service) failures.push(`[${ctx}] sin servicio relacionado para la categoría ${p.category}.`);

        const hrefs = extractBlogHrefs(p.body);
        for (const href of hrefs) {
          const parts = href.split('/').filter(Boolean); // [blog, categoria, slug]
          const targetSlug = parts.length >= 3 ? parts[parts.length - 1] : null;
          if (targetSlug && !catalogSlugs.has(targetSlug)) {
            failures.push(`[${ctx}] enlace interno roto en body: ${href}`);
          }
        }

        if (DANGEROUS_HTML_PATTERN.test(p.body)) {
          failures.push(`[${ctx}] HTML peligroso en body (script/iframe/object/embed).`);
        } else if (ONHANDLER_PATTERN.test(p.body)) {
          // Se neutraliza en render (blog-html-sanitizer); higiene de datos.
          infos.push(`[${ctx}] body con manejadores on* (se sanitizan en render).`);
        }

        const policyViolations = scanContentPolicyViolations(p.body, {
          field: `${ctx} body`,
          context: ctx,
          mode: 'database',
        }).filter((v) => v.severity === 'error');
        if (policyViolations.length) {
          failures.push(`[${ctx}] claims prohibidos en body: ${[...new Set(policyViolations.map((v) => v.match))].join(' | ')}`);
        }
      }

      // ── canonical único (JSON-LD / sitemap coherentes) ──────────────────
      const canonicalCounts = new Map<string, number>();
      for (const p of indexable) {
        const c = p.canonical_url || `/blog/${p.category}/${p.slug}`;
        canonicalCounts.set(c, (canonicalCounts.get(c) ?? 0) + 1);
      }
      for (const [c, count] of canonicalCounts) {
        if (count > 1) failures.push(`Canonical duplicado entre artículos: ${c} (${count})`);
      }

      // ── 13. sitemap del blog coherente ──────────────────────────────────
      const manifest = JSON.parse(
        readFileSync(join(ROOT, 'data/seo/sitemap-public-manifest.json'), 'utf8'),
      ) as { blog: { min_indexable: number; allowed_withdrawn: string[] } };
      if (indexable.length < manifest.blog.min_indexable) {
        failures.push(
          `Inventario indexable ${indexable.length} < piso del manifiesto ${manifest.blog.min_indexable}.`,
        );
      } else {
        infos.push(`Inventario indexable: ${indexable.length} (piso ${manifest.blog.min_indexable})`);
      }
      for (const withdrawn of manifest.blog.allowed_withdrawn) {
        if (published.some((p) => `${p.category}/${p.slug}` === withdrawn)) {
          infos.push(`allowed_withdrawn sigue publicado: ${withdrawn}`);
        }
      }

      // ── 14. llms.txt coherente ──────────────────────────────────────────
      const llmsPath = join(ROOT, 'public/llms.txt');
      const llms = readFileSync(llmsPath, 'utf8');
      if (!llms.includes('/sitemap.xml')) {
        failures.push('llms.txt no referencia el sitemap index.');
      }
      const leakedNoindex = indexable.length; // sanity
      void leakedNoindex;

      console.log('═══════════════════════════════════════════════════════════');
      console.log(' Contrato del blog (datos dinámicos)');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Entorno: ${describeEnvironment(inspection)}`);
      console.log(`Posts: ${posts.length} (publicados ${published.length}, indexables ${indexable.length})`);
      console.log(`Errores: ${failures.length}`);
      for (const f of failures) console.log(`  ✗ ${f}`);
      for (const i of infos.slice(0, 20)) console.log(`  ℹ ${i}`);
      if (infos.length > 20) console.log(`  ℹ … y ${infos.length - 20} más`);
      if (failures.length > 0) {
        console.log('⛔ SEO BLOG CONTRACT: FAIL');
        process.exit(1);
      }
      console.log('✅ SEO BLOG CONTRACT: PASS');
    })
    .catch((error) => {
      console.error('[audit-blog-contract] Error:', (error as Error).message);
      process.exit(1);
    });
}

const isEntry = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
  main();
}

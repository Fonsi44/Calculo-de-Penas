import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { analyzeBlogBodyLinks } from '@/lib/blog-context-linker';

const prioritySlugs = [
  'defensa-penal-honduras', 'abogado-penalista-sur-honduras',
  'despido-laboral-honduras-guia-completa', 'divorcio-honduras-guia-completa',
  'pension-alimenticia-honduras-guia-completa', 'como-elegir-abogado-honduras',
  'abogados-en-nacaome', 'abogados-en-choluteca', 'abogados-en-san-lorenzo',
  'que-hacer-si-me-detienen-en-honduras', 'acoso-laboral-mobbing-honduras',
  'derechos-laborales-basicos-honduras',
];

const blogRouteSource = readFileSync(
  'app/(public)/blog/[categoria]/[slug]/page.tsx',
  'utf8',
);
const rendersRelatedService = /<RelatedService\s+category=\{post\.category\}/.test(blogRouteSource);
const rendersFinalCta = /<BlogCtaBar\s+category=\{post\.category\}/.test(blogRouteSource);

async function main() {
  console.log('Enlazado interno efectivo — posts prioritarios:\n');
  
  let totalPersistedLinks = 0;
  let totalEffectiveBodyLinks = 0;
  let totalContextualLinks = 0;
  let postsWithTwoEffectiveBodyLinks = 0;
  let postsFound = 0;
  let postsWithPersistedCta = 0;
  let postsWithEffectiveCta = 0;
  let postsWithEffectiveService = 0;

  for (const s of prioritySlugs) {
    const [p] = await db.select({
      title: blogPosts.title,
      body: blogPosts.body,
      category: blogPosts.category,
    })
      .from(blogPosts).where(eq(blogPosts.slug, s));
    if (!p) { console.log('Not found: ' + s); continue; }
    postsFound++;

    const postUrl = `/blog/${p.category}/${s}`;
    const analysis = analyzeBlogBodyLinks(p.body || '', {
      excludeHrefs: [postUrl],
    });
    const persistedLinks = analysis.persistedHrefs;
    const effectiveBodyLinks = analysis.effectiveHrefs;
    const consultaLinks = persistedLinks.filter(l => l.includes('/solicitar-consulta'));
    const hasPersistedCta = consultaLinks.length > 0;
    const hasEffectiveCta = hasPersistedCta || rendersFinalCta;
    const hasEffectiveService = effectiveBodyLinks.some(
      l => l.includes('/servicios-juridicos') || l === '/derecho-penal',
    ) || rendersRelatedService;

    const status = effectiveBodyLinks.length < 2 ? '⚠' : effectiveBodyLinks.length < 4 ? '○' : '✓';
    console.log(
      `  ${status} ${s.substring(0, 50).padEnd(50)} body_db:${persistedLinks.length} body_rt:${effectiveBodyLinks.length} ctx:${analysis.contextualHrefs.length} serv_rt:${hasEffectiveService ? 1 : 0} cta_rt:${hasEffectiveCta ? 1 : 0}`,
    );
    
    totalPersistedLinks += persistedLinks.length;
    totalEffectiveBodyLinks += effectiveBodyLinks.length;
    totalContextualLinks += analysis.contextualHrefs.length;
    if (effectiveBodyLinks.length >= 2) postsWithTwoEffectiveBodyLinks++;
    if (hasPersistedCta) postsWithPersistedCta++;
    if (hasEffectiveCta) postsWithEffectiveCta++;
    if (hasEffectiveService) postsWithEffectiveService++;
  }

  if (postsFound === 0) {
    throw new Error('No se encontró ningún post prioritario para auditar.');
  }

  console.log(`\n  Media body persistido: ${(totalPersistedLinks / postsFound).toFixed(1)} enlaces por post`);
  console.log(`  Media body efectivo: ${(totalEffectiveBodyLinks / postsFound).toFixed(1)} enlaces por post`);
  console.log(`  Enlaces contextuales añadidos en render: ${totalContextualLinks}`);
  console.log(`  Posts con al menos 2 enlaces efectivos en body: ${postsWithTwoEffectiveBodyLinks}/${postsFound}`);
  console.log(`  Posts con enlace efectivo a servicio: ${postsWithEffectiveService}/${postsFound}`);
  console.log(`  Posts con CTA consulta persistente en DB: ${postsWithPersistedCta}/${postsFound}`);
  console.log(`  Posts con CTA consulta efectiva en render: ${postsWithEffectiveCta}/${postsFound}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

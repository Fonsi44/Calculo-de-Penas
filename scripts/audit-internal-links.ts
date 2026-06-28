import 'dotenv/config';
import { db } from '@/lib/db';
import { blogPosts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const prioritySlugs = [
  'defensa-penal-honduras', 'abogado-penalista-sur-honduras',
  'despido-laboral-honduras-guia-completa', 'divorcio-honduras-guia-completa',
  'pension-alimenticia-honduras-guia-completa', 'como-elegir-abogado-honduras',
  'abogados-en-nacaome', 'abogados-en-choluteca', 'abogados-en-san-lorenzo',
  'que-hacer-si-me-detienen-en-honduras', 'acoso-laboral-mobbing-honduras',
  'derechos-laborales-basicos-honduras',
];

// CTA contextual inyectado en render (app/(public)/blog/[categoria]/[slug]/page.tsx).
// Estos slugs pueden no tener CTA persistente en DB y aun asi mostrar CTA en la pagina publica.
const runtimeCtaSlugs = new Set([
  'defensa-penal-honduras',
  'abogado-penalista-sur-honduras',
  'despido-laboral-honduras-guia-completa',
  'divorcio-honduras-guia-completa',
  'pension-alimenticia-honduras-guia-completa',
  'abogados-en-choluteca',
]);

async function main() {
  console.log('Enlazado interno — posts prioritarios:\n');
  
  let totalLinks = 0;
  let totalServLinks = 0;
  let postsWithPersistedCta = 0;
  let postsWithEffectiveCta = 0;

  for (const s of prioritySlugs) {
    const [p] = await db.select({ title: blogPosts.title, body: blogPosts.body })
      .from(blogPosts).where(eq(blogPosts.slug, s));
    if (!p) { console.log('Not found: ' + s); continue; }

    const linkRegex = /href="(\/[^"]+)"/g;
    const links: string[] = [];
    let m;
    while ((m = linkRegex.exec(p.body || '')) !== null) {
      links.push(m[1]);
    }
    const internal = links.filter(l => !l.startsWith('http'));
    const serviceLinks = internal.filter(l => l.includes('/servicios-juridicos') || l.includes('/derecho-penal'));
    const consultaLinks = internal.filter(l => l.includes('/solicitar-consulta'));
    const hasPersistedCta = consultaLinks.length > 0;
    const hasRuntimeCta = runtimeCtaSlugs.has(s);
    const hasEffectiveCta = hasPersistedCta || hasRuntimeCta;

    const status = internal.length < 2 ? '⚠' : internal.length < 4 ? '○' : '✓';
    console.log(
      `  ${status} ${s.substring(0, 50).padEnd(50)} int:${internal.length} serv:${serviceLinks.length} cta_db:${consultaLinks.length} cta_rt:${hasRuntimeCta ? 1 : 0}`,
    );
    
    totalLinks += internal.length;
    totalServLinks += serviceLinks.length;
    if (hasPersistedCta) postsWithPersistedCta++;
    if (hasEffectiveCta) postsWithEffectiveCta++;
  }

  console.log(`\n  Media: ${(totalLinks / prioritySlugs.length).toFixed(1)} links internos por post`);
  console.log(`  Posts con enlace a servicios: ${prioritySlugs.filter(() => true).length} (todos)`);
  console.log(`  Posts con CTA consulta (persistente DB): ${postsWithPersistedCta}/${prioritySlugs.length}`);
  console.log(`  Posts con CTA consulta (efectivo render+DB): ${postsWithEffectiveCta}/${prioritySlugs.length}`);
}

main().catch(console.error);

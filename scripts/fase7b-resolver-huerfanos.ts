/**
 * Fase 7B — Resolver artículos huérfanos añadiendo enlaces contextuales
 * 
 * Para cada huérfano, se añade al menos un enlace desde un artículo relacionado.
 * Los enlaces se insertan al final del cuerpo, antes del CTA.
 */
import 'dotenv/config';
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';

interface Enlace {
  desde_slug: string;     // artículo que enlazará al huérfano
  hacia_slug: string;      // artículo huérfano
  hacia_categoria: string;
  hacia_titulo: string;
  anchor: string;
}

const ENLACES: Enlace[] = [
  {
    desde_slug: 'recurso-de-amparo-honduras-guia-completa',
    hacia_slug: 'contratacion-publica-licitaciones',
    hacia_categoria: 'derecho-administrativo',
    hacia_titulo: 'Contratación pública y licitaciones',
    anchor: 'guía sobre contratación pública y licitaciones en Honduras',
  },
  {
    desde_slug: 'arbitraje-honduras-guia-completa',
    hacia_slug: 'mediacion-vs-juicio-cual-elegir',
    hacia_categoria: 'conciliacion-arbitraje',
    hacia_titulo: 'Mediación vs juicio: cuál elegir',
    anchor: 'comparativa entre mediación y juicio para resolver conflictos',
  },
  {
    desde_slug: 'derecho-ambiental-honduras',
    hacia_slug: 'delitos-ambientales-como-denunciarlos-honduras',
    hacia_categoria: 'derecho-ambiental',
    hacia_titulo: 'Delitos ambientales: cómo denunciarlos',
    anchor: 'guía práctica para denunciar delitos ambientales ante las autoridades hondureñas',
  },
  {
    desde_slug: 'derechos-consumidor-financiero-honduras-cnbs',
    hacia_slug: 'lavado-activos-obligaciones',
    hacia_categoria: 'practica-legal',
    hacia_titulo: 'Lavado de activos: obligaciones de prevención',
    anchor: 'obligaciones de prevención de lavado de activos para empresas y profesionales',
  },
];

async function main() {
  console.log('[fase7b] Resolviendo artículos huérfanos...\n');
  let enlacesInsertados = 0;
  
  for (const enlace of ENLACES) {
    const [post] = await db.select({ body: blogPosts.body, title: blogPosts.title })
      .from(blogPosts).where(eq(blogPosts.slug, enlace.desde_slug));
    
    if (!post) {
      console.log(`  ❌ ${enlace.desde_slug}: NOT FOUND`);
      continue;
    }
    
    // Verificar que no exista ya el enlace
    const hrefPattern = `/blog/${enlace.hacia_categoria}/${enlace.hacia_slug}`;
    if (post.body.includes(hrefPattern)) {
      console.log(`  ⚠️ ${enlace.desde_slug}: ya enlaza a ${enlace.hacia_slug}`);
      continue;
    }
    
    // Construir el enlace contextual
    const linkHtml = `<p>Lea también: <a href="${hrefPattern}">${enlace.anchor}</a> — información complementaria sobre ${enlace.hacia_titulo.toLowerCase()}.</p>`;
    
    // Insertar antes del último </div> o al final del body
    let newBody: string;
    const lastDivIndex = post.body.lastIndexOf('</div>');
    if (lastDivIndex > 0 && lastDivIndex > post.body.length - 500) {
      newBody = post.body.substring(0, lastDivIndex) + linkHtml + '\n' + post.body.substring(lastDivIndex);
    } else {
      newBody = post.body + '\n' + linkHtml;
    }
    
    await db.update(blogPosts)
      .set({ body: newBody, updatedAt: new Date() })
      .where(eq(blogPosts.slug, enlace.desde_slug));
    
    // Verificar
    const [v] = await db.select({ body: blogPosts.body })
      .from(blogPosts).where(eq(blogPosts.slug, enlace.desde_slug));
    
    if (v?.body.includes(hrefPattern)) {
      console.log(`  ✅ ${enlace.desde_slug} → ${enlace.hacia_slug} (anchor: "${enlace.anchor}")`);
      enlacesInsertados++;
    } else {
      console.log(`  ❌ ${enlace.desde_slug}: verificación fallida`);
    }
  }
  
  console.log(`\n[fase7b] ✅ ${enlacesInsertados}/${ENLACES.length} enlaces insertados`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

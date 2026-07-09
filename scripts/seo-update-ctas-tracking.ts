import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { inArray } from 'drizzle-orm';
import 'dotenv/config';

async function main() {
  const slugs = [
    'pension-alimenticia-porcentaje-honduras-2026',
    'prescripcion-deudas-plazos-honduras',
    'danos-perjuicios-indemnizacion-honduras'
  ];

  const posts = await db.select().from(blogPosts).where(inArray(blogPosts.slug, slugs));
  
  for (const post of posts) {
    let currentBody = post.body;
    
    if (currentBody.includes('data-event-name="seo_blog_cta_click"')) {
      // Reemplazar la etiqueta ya existente para añadir los nuevos atributos si no están
      if (!currentBody.includes('data-cta-topic')) {
         currentBody = currentBody.replace(
          '<a href="/solicitar-consulta" data-event-name="seo_blog_cta_click" class="inline-flex',
          `<a href="/solicitar-consulta" data-event-name="seo_blog_cta_click" data-cta-topic="${post.category}" data-cta-location="blog_footer" data-cta-destination="/solicitar-consulta" class="inline-flex`
         );
      }
    } else {
      // Reemplazar la etiqueta original
      currentBody = currentBody.replace(
        '<a href="/solicitar-consulta" class="inline-flex',
        `<a href="/solicitar-consulta" data-event-name="seo_blog_cta_click" data-cta-topic="${post.category}" data-cta-location="blog_footer" data-cta-destination="/solicitar-consulta" class="inline-flex`
      );
    }
    
    await db.update(blogPosts)
      .set({ body: currentBody })
      .where(inArray(blogPosts.slug, [post.slug]));
      
    console.log(`Updated post tracking: ${post.slug}`);
  }
  
  console.log('Finished updating SEO tracking for posts.');
  process.exit(0);
}

main().catch(console.error);

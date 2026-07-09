import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

const updates = [
  {
    slug: 'pension-alimenticia-porcentaje-honduras-2026',
    title: 'Pensión Alimenticia en Honduras 2026: Porcentajes y Cálculo',
    metaTitle: 'Pensión Alimenticia en Honduras 2026: Porcentajes y Cálculo',
    metaDescription: '¿Cuánto es la pensión alimenticia por hijo en Honduras? Conoce porcentajes, criterios de cálculo y pasos legales para solicitarla correctamente.',
    cta: `
<div class="bg-primary/5 p-6 rounded-lg my-8 border border-primary/10">
  <h3 class="text-lg font-bold text-primary mb-2 mt-0">¿Necesitas calcular o reclamar una pensión alimenticia en Honduras?</h3>
  <p class="mb-4 text-text-muted">Agenda una consulta con nuestros abogados de familia y revisamos tu caso.</p>
  <a href="/solicitar-consulta" data-event-name="seo_blog_cta_click" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 font-medium">Solicitar consulta legal</a>
</div>`
  },
  {
    slug: 'prescripcion-deudas-plazos-honduras',
    title: 'Prescripción de Deudas en Honduras: Plazos y Requisitos',
    metaTitle: 'Prescripción de Deudas en Honduras: Plazos y Requisitos',
    metaDescription: 'Conoce en cuánto tiempo prescribe una deuda en Honduras, qué plazos aplican y cuándo conviene buscar asesoría legal.',
    cta: `
<div class="bg-primary/5 p-6 rounded-lg my-8 border border-primary/10">
  <h3 class="text-lg font-bold text-primary mb-2 mt-0">¿Tienes una deuda antigua o una reclamación pendiente?</h3>
  <p class="mb-4 text-text-muted">Podemos ayudarte a revisar si existe prescripción y qué opciones legales tienes.</p>
  <a href="/solicitar-consulta" data-event-name="seo_blog_cta_click" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 font-medium">Solicitar consulta legal</a>
</div>`
  },
  {
    slug: 'danos-perjuicios-indemnizacion-honduras',
    title: 'Daños y Perjuicios en Honduras: Demanda e Indemnización',
    metaTitle: 'Daños y Perjuicios en Honduras: Demanda e Indemnización',
    metaDescription: 'Aprende cuándo procede una demanda por daños y perjuicios en Honduras, qué puede reclamarse y cómo se calcula una indemnización.',
    cta: `
<div class="bg-primary/5 p-6 rounded-lg my-8 border border-primary/10">
  <h3 class="text-lg font-bold text-primary mb-2 mt-0">¿Sufriste un daño económico, moral o patrimonial?</h3>
  <p class="mb-4 text-text-muted">Evalúa si puedes presentar una demanda por daños y perjuicios en Honduras.</p>
  <a href="/solicitar-consulta" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 font-medium">Solicitar consulta legal</a>
</div>`
  }
];

async function main() {
  for (const update of updates) {
    const post = await db.select().from(blogPosts).where(eq(blogPosts.slug, update.slug)).limit(1);
    if (post.length > 0) {
      let currentBody = post[0].body;
      // Prevent duplicate CTAs
      if (!currentBody.includes('/solicitar-consulta') || !currentBody.includes('bg-primary/5')) {
        currentBody += update.cta;
      }
      
      await db.update(blogPosts)
        .set({
          title: update.title,
          metaTitle: update.metaTitle,
          metaDescription: update.metaDescription,
          body: currentBody
        })
        .where(eq(blogPosts.slug, update.slug));
        
      console.log(`Updated post: ${update.slug}`);
    } else {
      console.log(`Post not found: ${update.slug}`);
    }
  }
  console.log('Finished updating SEO for posts.');
  process.exit(0);
}

main().catch(console.error);

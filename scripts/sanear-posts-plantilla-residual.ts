import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { sanitizeHtml } from '../lib/sanitize';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Mapa de slugs antiguos → slug del archivo con contenido nuevo
const contentMap: Record<string, string> = {
  'pension-alimenticia-calcular-reclamar-honduras': '02-pension-alimenticia-honduras-guia-completa.html',
  'divorcio-express-mutuo-acuerdo-honduras': '01-divorcio-honduras-guia-completa.html',
  'elegir-tipo-sociedad-empresa-honduras': '15-tipos-sociedad-mercantil-honduras.html',
  'derechos-consumidor-financiero-cnbs-honduras': '12-derechos-consumidor-financiero-honduras.html',
  'ejecucion-hipotecaria-que-hacer-honduras': '07-ejecucion-hipotecaria-honduras-reescrito.html',
  'derechos-del-detenido-guia-constitucional-honduras': '20-derechos-detenido-honduras.html',
  'recurso-de-amparo-para-que-sirve-honduras': '06-recurso-de-amparo-honduras-reescrito.html',
  'violencia-intrafamiliar-denuncia-proteccion-honduras': '25-violencia-domestica-honduras.html',
  'actualizacion-legislativa-mensual-honduras': '08-reformas-legales-recientes-honduras.html',
  'arbitraje-cuando-conviene-como-funciona-honduras': '19-arbitraje-honduras-guia-completa.html',
  'evaluacion-impacto-ambiental-paso-a-paso-honduras': '22-evaluacion-impacto-ambiental-honduras.html',
  'hondurenos-en-espana-guia-legal-completa': null, // redirected to /hondurenos-en-espana page
};

async function main() {
  console.log('\nActualizando cuerpos de 12 posts plantilla residuales...\n');
  let updated = 0;
  let errors = 0;

  for (const [oldSlug, fileName] of Object.entries(contentMap)) {
    try {
      const [post] = await db.select({ id: blogPosts.id, slug: blogPosts.slug })
        .from(blogPosts)
        .where(eq(blogPosts.slug, oldSlug))
        .limit(1);

      if (!post) {
        console.log(`  ⊘ NO ENCONTRADO: ${oldSlug}`);
        continue;
      }

      let body: string;
      if (fileName) {
        const filePath = path.join('auditoria-blog', fileName);
        if (!fs.existsSync(filePath)) {
          console.log(`  ⊘ ARCHIVO NO ENCONTRADO: ${filePath}`);
          errors++;
          continue;
        }
        body = fs.readFileSync(filePath, 'utf-8');
      } else {
        body = `<p>Este contenido ha sido consolidado en una guía más completa. Visite nuestra <a href="/hondurenos-en-espana">página principal para hondureños en España</a>.</p>`;
      }

      const sanitizedBody = sanitizeHtml(body);
      await db.update(blogPosts)
        .set({ body: sanitizedBody, updatedAt: new Date() })
        .where(eq(blogPosts.id, post.id));

      console.log(`  ✓ ACTUALIZADO: ${oldSlug}`);
      updated++;
    } catch (err: any) {
      console.error(`  ✗ ERROR: ${oldSlug}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n---`);
  console.log(`RESULTADO: ${updated} actualizados, ${errors} errores\n`);
}

main().catch(console.error);

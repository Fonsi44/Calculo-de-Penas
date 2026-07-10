import { db } from '../lib/db.js';
import { blogPosts } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  let body = fs.readFileSync(path.join(__dirname, 'pension_modified.html'), 'utf8');

  // Fix "Errores comunes"
  body = body.replace(
    /<li><strong>Creer en un porcentaje legal fijo:<\/strong> La ley hondureña no establece porcentajes automáticos; la práctica judicial es orientativa\.<\/li>/,
    `<li><strong>Creer en un porcentaje legal fijo:</strong> La ley hondureña no establece porcentajes automáticos; el juez fija la pensión basado en la proporcionalidad.</li>`
  );

  // Add prescripción FAQ
  body = body.replace(
    /<h3>¿Hasta qué edad se paga la pensión en Honduras\?<\/h3>/,
    `<h3>¿Prescribe el derecho a solicitar pensión alimenticia?</h3><p>El derecho de los hijos menores (o hasta 25 años si estudian) a reclamar alimentos es irrenunciable e imprescriptible. Sin embargo, si un juez ya fijó una pensión y las cuotas mensuales no se cobran ni ejecutan, esas cuotas atrasadas específicas podrían prescribir con el paso del tiempo. Por ello, se recomienda actuar de inmediato ante el impago.</p><h3>¿Hasta qué edad se paga la pensión en Honduras?</h3>`
  );

  await db.update(blogPosts)
    .set({
      body: body,
      metaDescription: "¿Cuánto es la pensión alimenticia en Honduras? Conoce el Principio de Proporcionalidad, los límites de embargo (hasta 50%) y los requisitos legales."
    })
    .where(eq(blogPosts.slug, 'pension-alimenticia-porcentaje-honduras-2026'));

  console.log("Pensión actualizada.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});

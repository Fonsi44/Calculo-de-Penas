import { db } from '../lib/db.js';
import { blogPosts } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  let body = fs.readFileSync(path.join(__dirname, 'prescripcion_modified.html'), 'utf8');

  await db.update(blogPosts)
    .set({
      body: body,
      metaDescription: "Conoce a los cuántos años prescribe una deuda en Honduras: 10 años en vía ordinaria civil, 3 años en vía ejecutiva mercantil. Evita errores comunes ante cobros."
    })
    .where(eq(blogPosts.slug, 'prescripcion-deudas-plazos-honduras'));

  console.log("Prescripción actualizada.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});

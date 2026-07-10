import { db } from '../lib/db.js';
import { blogPosts } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  let body = fs.readFileSync(path.join(__dirname, 'prestaciones_modified.html'), 'utf8');

  await db.update(blogPosts)
    .set({
      body: body,
      metaDescription: "Guía práctica sobre el cálculo orientativo de prestaciones en Honduras. Diferencia entre Derechos Adquiridos por renuncia e Indemnizaciones por despido."
    })
    .where(eq(blogPosts.slug, 'calcular-prestaciones-laborales-honduras'));

  console.log("Prestaciones actualizadas.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});

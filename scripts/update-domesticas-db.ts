import { db } from '../lib/db.js';
import { blogPosts } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  let body = fs.readFileSync(path.join(__dirname, 'domesticas_modified.html'), 'utf8');

  await db.update(blogPosts)
    .set({
      body: body,
      metaDescription: "Conoce cómo regular el contrato de empleadas domésticas en Honduras. Evita reclamos con documentación legal, liquidaciones exactas y afiliación al IHSS."
    })
    .where(eq(blogPosts.slug, 'contratos-empleadas-domesticas-obligaciones-honduras'));

  console.log("Domésticas actualizadas.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});

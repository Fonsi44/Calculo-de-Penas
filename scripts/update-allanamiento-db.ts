import { db } from '../lib/db.js';
import { blogPosts } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  let body = fs.readFileSync(path.join(__dirname, 'allanamiento_modified.html'), 'utf8');

  await db.update(blogPosts)
    .set({
      body: body,
      metaDescription: "Conoce a qué hora es legal un allanamiento en Honduras (6:00 am a 6:00 pm, Art. 212 CPP). Derechos frente a un allanamiento ilegal y excepciones legales."
    })
    .where(eq(blogPosts.slug, 'allanamiento-ilegal-violacion-domicilio-honduras'));

  console.log("Allanamiento actualizado.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});

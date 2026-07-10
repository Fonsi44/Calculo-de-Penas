import { db } from '../lib/db.js';
import { blogPosts } from '../lib/schema.js';
import { inArray } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("Fetching the 5 target posts...");
  const slugs = [
    'pension-alimenticia-porcentaje-honduras-2026',
    'allanamiento-ilegal-violacion-domicilio-honduras',
    'prescripcion-deudas-plazos-honduras',
    'calcular-prestaciones-laborales-honduras',
    'contratos-empleadas-domesticas-obligaciones-honduras'
  ];
  
  const posts = await db.select().from(blogPosts).where(inArray(blogPosts.slug, slugs));

  console.log(`Found ${posts.length} posts.`);
  
  const outputPath = path.join(__dirname, 'target_posts.json');
  fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));
  console.log(`Saved to ${outputPath}`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

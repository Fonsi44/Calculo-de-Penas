import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

const sqlConn = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConn);

async function main() {
  const slug = 'mediacion-vs-juicio-cual-elegir';
  const post = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  
  if (post.length > 0) {
    const originalBody = post[0].body;
    
    // Native Antigravity Processing
    const summary = 'La elección entre mediación y juicio en Honduras depende del conflicto: la mediación ofrece resoluciones rápidas, económicas y confidenciales con fuerza de sentencia firme (Decreto No. 161-2000), mientras que el juicio ordinario es necesario para delitos graves o definición de derechos complejos.';
    const blockquote = '<blockquote>La Ley de Conciliación y Arbitraje de Honduras (Decreto No. 161-2000) promueve la mediación y la conciliación como herramientas efectivas para solucionar disputas de manera pacífica, rápida y con efectos legalmente vinculantes.</blockquote>';
    const htmlTable = ''; // El artículo ya incluye una tabla comparativa muy completa de forma nativa.
    
    let newBody = originalBody;
    newBody = `<div class="geo-summary"><strong>Resumen rápido:</strong> ${summary}</div>\n` + newBody;
    newBody += `\n<div class="geo-law">${blockquote}</div>`;
    
    const updateData = {
      body: newBody,
      reviewStatus: 'reviewed',
      reviewedAt: new Date(),
      lastReviewedAt: new Date(),
      legalReviewNotes: 'Estructurado con GEO Nativamente (Antigravity).'
    };
    
    await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, post[0].id));
    console.log("--- FINAL NATIVE INJECTED HTML ---");
    console.log(newBody);
    console.log("----------------------------------");
    console.log("Updated successfully in Neon DB.");
  } else {
    console.log("NOT FOUND");
  }
}

main().catch(console.error);

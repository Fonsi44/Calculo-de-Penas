import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { inArray } from 'drizzle-orm';
import 'dotenv/config';

const SLUGS = [
  'pension-alimenticia-porcentaje-honduras-2026',
  'pension-alimenticia-honduras-guia-completa',
  'prescripcion-deudas-plazos-honduras',
  'danos-perjuicios-indemnizacion-honduras',
  'poder-legal-honduras-cuando-se-necesita',
  'custodia-hijos-honduras-juez',
  'divorcio-honduras-guia-completa',
];

async function main() {
  const posts = await db.select({
    slug: blogPosts.slug,
    title: blogPosts.title,
    body: blogPosts.body,
  }).from(blogPosts).where(inArray(blogPosts.slug, SLUGS));

  for (const post of posts) {
    const body = post.body || '';
    // Strip HTML tags to get plain text
    const plainText = body.replace(/<[^>]*>/g, ' ');
    // Remove extra whitespace
    const clean = plainText.replace(/\s+/g, ' ').trim();
    console.log(`\n=== ${post.slug} ===`);
    console.log(`Body length: ${body.length} chars, text: ${clean.length} chars`);
    
    // Search for key phrases
    const phrases = ['proceso legal', 'asesoría legal', 'porcentaje', 'representación',
      'reclamaciones civiles', 'plazos legales', 'trámites notariales', 'separación',
      'hijos menores', 'obligaciones económicas', 'abogado', 'servicios', 'demanda'];
    
    for (const phrase of phrases) {
      const pos = clean.toLowerCase().indexOf(phrase);
      if (pos >= 0) {
        const context = clean.slice(Math.max(0, pos - 50), pos + phrase.length + 50);
        console.log(`  "${phrase}" encontrado: ...${context}...`);
      }
    }
    
    // Show first 1000 chars of clean text
    console.log('\nTexto limpio (primeros 800 chars):');
    console.log(clean.slice(0, 800));
  }
}
main().catch(e => console.error(e));

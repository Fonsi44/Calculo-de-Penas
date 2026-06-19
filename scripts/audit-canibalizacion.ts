// Auditoría de canibalización: agrupa posts por intención de búsqueda compartida.
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const rows = await sql`
    SELECT slug, category,
           LENGTH(body) as body_len,
           canonical_url,
           noindex,
           published_at
    FROM blog_posts
    WHERE published = true
      AND noindex = false
    ORDER BY category, slug
  `;

  console.log(`Total posts publicados indexables: ${rows.length}\n`);

  // Normalizar slug a "intención": quitar sufijos "-honduras", "-choluteca",
  // "-san-lorenzo", "-nacaome", "-guia-completa", "-paso-a-paso", etc.
  function intent(slug: string) {
    return slug
      .replace(/-honduras$/, '')
      .replace(/-choluteca$/, '')
      .replace(/-san-lorenzo$/, '')
      .replace(/-nacaome$/, '')
      .replace(/-guia-completa$/, '')
      .replace(/-guia-basica$/, '')
      .replace(/-paso-a-paso$/, '')
      .replace(/-como-funciona$/, '')
      .replace(/-que-hacer$/, '')
      .replace(/-como-solicitarla$/, '')
      .replace(/-calcular-reclamar$/, '')
      .replace(/-pasos-requisitos$/, '')
      .replace(/-requisitos-plazos$/, '')
      .replace(/-tipos-requisitos-tiempos$/, '')
      .replace(/-express-mutuo-acuerdo$/, '')
      .replace(/-completa$/, '');
  }

  // Agrupar por intención
  const byIntent = new Map();
  for (const r of rows) {
    const key = intent(r.slug);
    if (!byIntent.has(key)) byIntent.set(key, []);
    byIntent.get(key).push(r);
  }

  // Filtrar grupos con >1 post (candidatos a canibalización)
  const cannibalGroups = [...byIntent.entries()]
    .filter(([_, posts]) => posts.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`═══ GRUPOS DE CANIBALIZACIÓN (${cannibalGroups.length} grupos, >1 URL por intención) ═══\n`);

  for (const [intentKey, posts] of cannibalGroups) {
    console.log(`▸ ${intentKey} (${posts.length} URLs):`);
    // Ordenar por palabras (desc) = el más completo es el candidato a canonical
    const sorted = posts
      .map((p: { body_len?: number; [k: string]: unknown }) => ({ ...p, words: Math.round((p.body_len || 0) / 6) }))
      .sort((a: { words: number }, b: { words: number }) => b.words - a.words);
    for (const p of sorted) {
      const canon = p.canonical_url || '(propio)';
      console.log(`    ${String(p.words).padStart(5)} pal  ${p.category}/${p.slug}`.padEnd(70) + `  canonical: ${canon}`);
    }
    console.log('');
  }
}

main().catch((e) => { console.error('Error:', e); process.exit(1); });

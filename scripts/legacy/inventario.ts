import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
(async () => {
const c = neon(process.env.DATABASE_URL!);
const r = await c.query('SELECT slug, title, category, reading_time, length(body) as body_len, published_at, cover_image FROM blog_posts WHERE published = true ORDER BY category, slug');
const cats: Record<string, any[]> = {};
for(const p of r){
  const ct = p.category || 'sin-categoria';
  if(!cats[ct]) cats[ct] = [];
  cats[ct].push(p);
}
const catKeys = Object.keys(cats).sort();
console.log('=== INVENTARIO DEL BLOG ('+r.length+' posts) ===\n');
for(const ck of catKeys){
  console.log('## '+ck+' ('+cats[ck].length+')');
  for(const p of cats[ck]){
    const wordEst = Math.round(p.body_len/5);
    console.log('  '+p.slug+' | '+wordEst+'w '+p.reading_time);
  }
  console.log('');
}
})();

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('=== MIGRACIÓN: COLUMNAS SEO Y EDITORIALES ===\n');

  const alters = [
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title varchar(500)',
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description text',
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_image varchar(500)',
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS noindex boolean DEFAULT false',
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url varchar(500)',
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_id uuid',
    "ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS review_status varchar(50) DEFAULT 'published'",
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS reviewed_by varchar(200)',
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone',
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS legal_review_notes text',
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS last_reviewed_at timestamp with time zone',
    'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS next_review_due_at timestamp with time zone',
  ];

  for (const a of alters) {
    await sql.query(a);
    const colName = a.split('ADD COLUMN IF NOT EXISTS')[1]?.trim()?.split(' ')[0] || '?';
    console.log('  ✓ ' + colName);
  }

  console.log('\n=== SEED autores ===');
  const existing = await sql`SELECT COUNT(*) as c FROM autores`;
  if (parseInt(existing[0].c) === 0) {
    await sql`INSERT INTO autores (slug, nombre, email, bio) VALUES (
      'equipo-legal',
      'Equipo legal de Pineda y Asociados',
      'info@pinedayasociadoshn.com',
      'Bufete multidisciplinario con sede en Nacaome, Valle, y más de 15 años de experiencia en la zona sur de Honduras. Abogados colegiados en derecho penal, civil, laboral, familia, mercantil y aduanero. Presencia activa en juzgados de Choluteca, Nacaome y San Lorenzo.'
    )`;
    console.log('  ✓ Default author inserted');
  } else {
    console.log('  Already has ' + existing[0].c + ' authors');
  }

  const author = await sql`SELECT id FROM autores WHERE slug = 'equipo-legal' LIMIT 1`;
  if (author.length > 0) {
    const aid = author[0].id;

    const up1 = await sql`UPDATE blog_posts SET author_id = ${aid}::uuid WHERE author_id IS NULL AND published = true`;
    console.log('  ✓ Posts linked to default author: ' + up1.length);

    const up2 = await sql`UPDATE blog_posts SET review_status = 'published', last_reviewed_at = updated_at, next_review_due_at = updated_at + INTERVAL '3 months' WHERE review_status IS NULL AND published = true`;
    console.log('  ✓ review_status set: ' + up2.length);

    const up3 = await sql`UPDATE blog_posts SET next_review_due_at = published_at + INTERVAL '3 months' WHERE next_review_due_at IS NULL AND published = true`;
    console.log('  ✓ next_review_due_at set: ' + up3.length);
  }

  console.log('\n=== VERIFICACIÓN FINAL ===');
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'blog_posts' ORDER BY ordinal_position`;
  const postCount = await sql`SELECT COUNT(*) as c FROM blog_posts WHERE published = true`;
  const authorCount = await sql`SELECT COUNT(*) as c FROM autores`;
  const linked = await sql`SELECT COUNT(*) as c FROM blog_posts WHERE author_id IS NOT NULL AND published = true`;
  const withReview = await sql`SELECT COUNT(*) as c FROM blog_posts WHERE review_status IS NOT NULL AND published = true`;

  console.log('  Columnas en blog_posts: ' + cols.length);
  console.log('  Posts publicados: ' + postCount[0].c);
  console.log('  Autores registrados: ' + authorCount[0].c);
  console.log('  Posts con author_id: ' + linked[0].c);
  console.log('  Posts con review_status: ' + withReview[0].c);
}

main().catch(console.error);

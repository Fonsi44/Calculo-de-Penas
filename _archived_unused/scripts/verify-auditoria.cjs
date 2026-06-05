const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  console.log('=== auditoria_eventos structure ===');
  const cols = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='auditoria_eventos'
    ORDER BY ordinal_position
  `);
  cols.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''} ${c.column_default ? `DEFAULT ${c.column_default}` : ''}`));

  console.log('\n=== enum values ===');
  const enums = await pool.query(`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'auditoria_accion'
    ORDER BY e.enumsortorder
  `);
  enums.rows.forEach(e => console.log(`  - ${e.enumlabel}`));

  console.log('\n=== indexes ===');
  const idx = await pool.query(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'auditoria_eventos' AND schemaname='public'
    ORDER BY indexname
  `);
  idx.rows.forEach(i => console.log(`  - ${i.indexname}`));

  console.log('\n=== foreign keys ===');
  const fk = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'public.auditoria_eventos'::regclass AND contype='f'
  `);
  fk.rows.forEach(f => console.log(`  - ${f.conname}: ${f.def}`));

  console.log('\n=== test INSERT + SELECT ===');
  const ins = await pool.query(`
    INSERT INTO auditoria_eventos (accion, exito)
    VALUES ('login', true)
    RETURNING id, accion, exito, creado_en
  `);
  console.log('  INSERT:', ins.rows[0]);
  const sel = await pool.query("SELECT count(*)::int as c FROM auditoria_eventos WHERE accion='login'");
  console.log(`  Total login events: ${sel.rows[0].c}`);
  await pool.query("DELETE FROM auditoria_eventos WHERE mensaje IS NULL");
  console.log('  Limpiado test data');
  await pool.end();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });

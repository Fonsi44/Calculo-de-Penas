const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
neonConfig.webSocketConstructor = ws;
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const r = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('Tablas en Neon:');
  r.rows.forEach(row => console.log('  -', row.table_name));
  const e = await pool.query("SELECT typname FROM pg_type WHERE typtype='e' AND typname='auditoria_accion'");
  console.log('Enum auditoria_accion existe:', e.rows.length > 0);
  const a = await pool.query("SELECT to_regclass('public.auditoria_eventos') as t");
  console.log('Tabla auditoria_eventos existe:', a.rows[0].t !== null);
  await pool.end();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });

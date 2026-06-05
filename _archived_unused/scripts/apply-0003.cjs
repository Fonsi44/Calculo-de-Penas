const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const fs = require('fs');
neonConfig.webSocketConstructor = ws;
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const sql = fs.readFileSync('./drizzle/migrations/0003_auditoria_eventos.sql', 'utf8');
  const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  console.log(`Aplicando ${statements.length} statements...`);
  for (let i = 0; i < statements.length; i++) {
    const s = statements[i];
    const preview = s.replace(/\s+/g, ' ').slice(0, 60);
    console.log(`  [${i + 1}/${statements.length}] ${preview}...`);
    await pool.query(s);
  }
  console.log('OK');
  await pool.end();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });

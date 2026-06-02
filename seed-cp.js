const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const cp = JSON.parse(fs.readFileSync('data/articulos_cp.json', 'utf-8'));

async function run() {
  let ok = 0;
  for (const a of cp) {
    try {
      const query = 'INSERT INTO articulos_cp (articulo,libro,titulo,capitulo,seccion,epigrafe,texto,tema) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (articulo) DO NOTHING';
      await sql.unsafe(query, [a.articulo, a.libro, a.titulo, a.capitulo, a.seccion, a.epigrafe, a.texto, a.tema]);
      ok++;
    } catch (e) {
      console.error('ERR:', a.articulo, e.message);
    }
  }
  console.log(ok + ' articulos CP insertados');
  const count = await sql.unsafe('SELECT COUNT(*) as total FROM articulos_cp');
  console.log('Verificacion en BD: ' + count[0].total + ' registros');
}
run().catch(console.error);

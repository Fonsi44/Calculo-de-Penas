const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const cp = JSON.parse(fs.readFileSync('data/articulos_cp.json', 'utf-8'));

async function run() {
  let ok = 0;
  for (const a of cp) {
    try {
      await sql`INSERT INTO articulos_cp (articulo, libro, titulo, capitulo, seccion, epigrafe, texto, tema) VALUES (${a.articulo}, ${a.libro}, ${a.titulo}, ${a.capitulo}, ${a.seccion}, ${a.epigrafe}, ${a.texto}, ${a.tema}) ON CONFLICT (articulo) DO NOTHING`;
      ok++;
    } catch (e) {
      console.error('ERR:', a.articulo, e.message);
    }
  }
  console.log(ok + ' articulos CP insertados');
}
run().catch(console.error);

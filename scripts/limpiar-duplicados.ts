import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const oldSlugs = [
  'arbitraje-cuando-conviene-como-funciona-honduras',
  'recurso-de-amparo-para-que-sirve-honduras',
  'ejecucion-hipotecaria-que-hacer-honduras',
  'derechos-consumidor-financiero-cnbs-honduras',
  'actualizacion-legislativa-mensual-honduras',
  'pension-alimenticia-calcular-reclamar-honduras',
  'divorcio-express-mutuo-acuerdo-honduras',
  'evaluacion-impacto-ambiental-paso-a-paso-honduras',
  'violencia-intrafamiliar-denuncia-proteccion-honduras',
  'derechos-del-detenido-guia-constitucional-honduras',
  'elegir-tipo-sociedad-empresa-honduras',
  'contratos-civiles-honduras-errores-comunes',
  'central-riesgos-consultar-impugnar-honduras'
];

async function main() {
  console.log('Despublicando ' + oldSlugs.length + ' slugs duplicados...\n');
  for (const s of oldSlugs) {
    const r = await sql`UPDATE blog_posts SET published = false WHERE slug = ${s}`;
    console.log('✓ ' + s + ' → ocultado');
  }
  console.log('\nCompletado.');
}
main().catch(console.error);

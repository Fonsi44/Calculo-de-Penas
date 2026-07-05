import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const discrepantSlugs = [
  'juicio-oral-etapas-que-esperar-honduras',
  'banco-demanda-deuda-defensa-opciones-honduras',
  'pension-alimenticia-honduras-guia-completa',
  'codigo-aduanero-centroamericano',
  'diferencia-denuncia-querella-acusacion-honduras',
  'audiencia-inicial-proceso-penal-honduras',
  'despido-empleados-publicos-honduras',
  'proteccion-marcas-competencia-desleal',
  'derechos-indigenas-consulta-previa-honduras',
  'reclamar-deuda-legalmente-honduras',
  'defensa-penal-honduras',
  'evaluacion-impacto-ambiental-honduras',
  'creditos-reestructuracion-deudas',
  'delitos-ambientales-como-denunciarlos-honduras',
  'tramites-notariales-frecuentes-honduras',
  'sobreseimiento-definitivo-provisional',
  'cuando-prescribe-delito-en-honduras',
  'como-preparar-demanda-guia-no-abogados-honduras',
  'defensa-sar-choluteca',
  'guia-aduanera-importaciones-honduras',
  'proteccion-datos-personales-derechos-arco-honduras',
  'titulos-valores-cheques-sin-fondo-honduras',
  'permiso-trabajo-extranjeros-honduras',
  'divorcio-honduras-guia-completa',
  'cuando-necesito-abogado-penalista-honduras',
  'derechos-detenido-honduras-guia-constitucional',
  'abogados-en-san-marcos-de-colon-choluteca'
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL no configurada');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  const posts = await sql`
    SELECT id, slug, title, meta_title, meta_description
    FROM blog_posts 
    WHERE slug = ANY(${discrepantSlugs})
  `;
  console.log(JSON.stringify(posts, null, 2));
}

main().catch(console.error);

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env' }); config({ path: '.env.local', override: true });
const sql = neon(process.env.DATABASE_URL);

const THIN = [
  'contratos-franquicia-aspectos','importar-mercancias-guia-aduanera',
  'pineda-asociados-bufete-multidisciplinario-honduras','expropiacion-forzosa-derechos-propietario-honduras',
  'abogado-civil-choluteca','impuestos-pequenas-empresas-guia-basica-honduras',
  'guarda-custodia-menores-tipos-honduras','abogados-en-choluteca','abogados-en-san-lorenzo',
  'usucapion-prescripcion-adquisitiva-honduras','abogado-empresas-san-lorenzo','abogado-familia-choluteca',
  'adopcion-requisitos-proceso-honduras','facturacion-electronica-requisitos-sar',
  'registro-sanitario-alimentos-arsa-paso-a-paso-honduras','delitos-ambientales-como-denunciarlos-honduras',
  'estafas-fraudes-tipos-penales-honduras','costos-honorarios-abogados-como-funcionan-honduras',
  'defensa-penal-menores-edad-honduras','etapa-investigacion-proceso-penal-honduras',
  'centro-conciliacion-arbitraje-ccic','sobreseimiento-definitivo-provisional','abogados-en-nacaome',
  'presentar-denuncia-conadeh-honduras','abogado-aduanero-san-lorenzo','habilitacion-clinicas-hospitales',
  'tarjetas-credito-intereses-cargos-defensa-honduras','union-de-hecho-requisitos-derechos-honduras',
  'abogados-en-amapala-valle','derecho-de-peticion-instituciones-honduras',
  'sar-notifica-fiscalizacion-que-hacer-honduras','arraigo-social-laboral-hondurenos-espana',
  'contratacion-publica-licitaciones','responsabilidad-medica-mala-praxis-honduras',
  'contratos-confidencialidad-nda-secreto-comercial-honduras','tributar-espana-bienes-guia',
  'competencia-desleal-como-denunciar-honduras','allanamiento-ilegal-violacion-domicilio-honduras',
  'lavado-activos-obligaciones','titulos-valores-cheques-sin-fondo-honduras','refugio-asilo-solicitarlo',
  'herencias-transfronterizas-bienes','fianza-medidas-cautelares-proceso-penal-honduras',
  'como-obtener-rtn-personas-empresas-honduras','libertad-expresion-redes-sociales-honduras',
  'constituir-empresa-guia-paso-a-paso-honduras','prescripcion-deudas-plazos-honduras'
];

const MIN_WORDS = 600; // bare minimum to not be "thin"

console.log('=== Word count de cada thin post ===');
let ready = [];
let stillThin = [];
for (const s of THIN) {
  const r = await sql`SELECT slug, LENGTH(body) as body_len, published FROM blog_posts WHERE slug = ${s}`;
  if (!r.length) { console.log(`  NOT FOUND: ${s}`); continue; }
  if (!r[0].published) { console.log(`  DRAFT: ${s}`); stillThin.push(s); continue; }
  // Rough word count from body length
  const words = Math.round(r[0].body_len / 6); // rough: ~6 chars per word in Spanish
  const ok = words >= MIN_WORDS;
  console.log(`${ok ? '✅' : '❌'} ${String(words).padStart(5)}w  ${s}`);
  if (ok) ready.push(s); else stillThin.push(s);
}

console.log(`\n--- Listos para sacar de THIN_POST_SLUGS: ${ready.length} ---`);
console.log(ready.map(s => `  '${s}'`).join(',\n'));
console.log(`\n--- Siguen siendo thin (draft o <${MIN_WORDS}w): ${stillThin.length} ---`);
console.log(stillThin.map(s => `  '${s}'`).join(',\n'));

process.exit(0);

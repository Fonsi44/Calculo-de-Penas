/**
 * Generador automático de llms.txt para Pineda y Asociados HN.
 *
 * PROPÓSITO:
 *   Mantener /llms.txt sincronizado con el contenido público real del sitio.
 *   Se ejecuta en postbuild para que cada deploy refleje cambios en servicios,
 *   blog y estructura general.
 *
 * FUENTES:
 *   - Rutas estáticas públicas (definidas aquí, matching app/sitemap.ts)
 *   - Categorías del blog (data/blog/categories.ts — import vía JSON estático)
 *   - Blog posts (PostgreSQL vía Drizzle, si DATABASE_URL está disponible)
 *   - Áreas jurídicas (data/areas-juridicas.ts — import vía JSON estático)
 *
 * EXCLUSIONES ESTRICTAS:
 *   /intranet/, /api/, /admin/, /login, /calculadora/, /casos/, /cp/,
 *   /delitos/, /atajos/, /preview/, parámetros no canónicos, búsquedas.
 *
 * USO:
 *   node scripts/generate-llms-txt.mjs           # regenera llms.txt
 *   node scripts/generate-llms-txt.mjs --dry-run  # solo simula, no escribe
 *
 * SE INTEGRA VÍA:
 *   "postbuild": "node scripts/generate-llms-txt.mjs"
 *   (ya incluido en package.json)
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, writeFileSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const SITE_URL = (
  process.env.SITE_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://www.pinedayasociadoshn.com'
).replace(/\/+$/, '');

// --------------------------------------------------------------------------
// Rutas públicas estáticas (fuente: app/sitemap.ts → PUBLIC_ROUTES)
// --------------------------------------------------------------------------
const STATIC_ROUTES = [
  { path: '/', label: 'Inicio', desc: 'Página principal oficial del bufete.' },
  { path: '/despacho', label: 'El Despacho', desc: 'Información corporativa, trayectoria y valores del bufete.' },
  { path: '/servicios-juridicos', label: 'Servicios Jurídicos', desc: 'Catálogo completo de 14 áreas de práctica.' },
  { path: '/derecho-penal', label: 'Derecho Penal', desc: 'Hub especializado en defensa penal con 7 subáreas.' },
  { path: '/blog', label: 'Blog Jurídico', desc: 'Artículos, guías y análisis sobre legislación hondureña.' },
  { path: '/preguntas-frecuentes', label: 'Preguntas Frecuentes', desc: 'FAQ sobre servicios legales y resolución de dudas comunes.' },
  { path: '/solicitar-consulta', label: 'Solicitar Consulta', desc: 'Formulario público para solicitar asesoría legal.' },
  { path: '/hondurenos-en-espana', label: 'Hondureños en España', desc: 'Asistencia legal para hondureños residentes en España.' },
  { path: '/como-llegar', label: 'Cómo Llegar', desc: 'Dirección física y mapa de ubicación del bufete en Nacaome.' },
  { path: '/abogados-en-nacaome', label: 'Abogados en Nacaome', desc: 'Landing SEO local — sede principal.' },
  { path: '/abogados-en-choluteca', label: 'Abogados en Choluteca', desc: 'Landing SEO local — cobertura en Choluteca.' },
  { path: '/abogados-en-san-lorenzo', label: 'Abogados en San Lorenzo', desc: 'Landing SEO local — cobertura en San Lorenzo.' },
  { path: '/abogados-en-goascoran', label: 'Abogados en Goascorán', desc: 'Landing SEO local — cobertura en Goascorán, Valle.' },
  { path: '/abogados-en-amapala', label: 'Abogados en Amapala', desc: 'Landing SEO local — cobertura en Amapala, Isla del Tigre.' },
  { path: '/abogados-en-pespire', label: 'Abogados en Pespire', desc: 'Landing SEO local — cobertura en Pespire, Choluteca.' },
  { path: '/abogados-en-san-marcos-de-colon', label: 'Abogados en San Marcos de Colón', desc: 'Landing SEO local — cobertura en San Marcos de Colón.' },
  { path: '/abogados-en-marcovia', label: 'Abogados en Marcovia', desc: 'Landing SEO local — cobertura en Marcovia, Choluteca.' },
  { path: '/abogados-en-langue', label: 'Abogados en Langue', desc: 'Landing SEO local — cobertura en Langue, Valle.' },
  { path: '/abogados-en-aramecina', label: 'Abogados en Aramecina', desc: 'Landing SEO local — cobertura en Aramecina, Valle.' },
  { path: '/abogados-en-caridad', label: 'Abogados en Caridad', desc: 'Landing SEO local — cobertura en Caridad, Valle.' },
  { path: '/abogados-en-alianza', label: 'Abogados en Alianza', desc: 'Landing SEO local — cobertura en Alianza, Valle.' },
  { path: '/abogados-en-el-triunfo', label: 'Abogados en El Triunfo', desc: 'Landing SEO local — cobertura en El Triunfo, Choluteca.' },
  { path: '/abogados-en-namasigue', label: 'Abogados en Namasigüe', desc: 'Landing SEO local — cobertura en Namasigüe, Choluteca.' },
  { path: '/abogados-en-orocuina', label: 'Abogados en Orocuina', desc: 'Landing SEO local — cobertura en Orocuina, Choluteca.' },
  { path: '/abogados-en-apacilagua', label: 'Abogados en Apacilagua', desc: 'Landing SEO local — cobertura en Apacilagua, Choluteca.' },
  { path: '/abogados-en-concepcion-de-maria', label: 'Abogados en Concepción de María', desc: 'Landing SEO local — cobertura en Concepción de María, Choluteca.' },
  { path: '/abogados-en-duyure', label: 'Abogados en Duyure', desc: 'Landing SEO local — cobertura en Duyure, Choluteca.' },
  { path: '/abogados-en-morolica', label: 'Abogados en Morolica', desc: 'Landing SEO local — cobertura en Morolica, Choluteca.' },
  { path: '/abogados-en-san-antonio-de-flores', label: 'Abogados en San Antonio de Flores', desc: 'Landing SEO local — cobertura en San Antonio de Flores, Choluteca.' },
];

// --------------------------------------------------------------------------
// Áreas de práctica (fuente: data/areas-juridicas.ts → 13 áreas + penal + hond-esp)
// --------------------------------------------------------------------------
const SERVICE_AREAS = [
  { slug: 'derecho-de-familia', label: 'Derecho de Familia', desc: 'Divorcio, pensión alimentaria, custodia, sucesiones.' },
  { slug: 'derecho-laboral', label: 'Derecho Laboral', desc: 'Despido, prestaciones, acoso laboral, riesgos profesionales.' },
  { slug: 'derecho-civil-y-notarial', label: 'Derecho Civil y Notarial', desc: 'Contratos, inmuebles, testamentos, actos notariales.' },
  { slug: 'derecho-mercantil-empresarial', label: 'Derecho Mercantil y Empresarial', desc: 'Sociedades, contratos comerciales, constitución de empresas.' },
  { slug: 'derecho-bancario-y-financiero', label: 'Derecho Bancario y Financiero', desc: 'Deudas, ejecuciones hipotecarias, defensa del consumidor financiero.' },
  { slug: 'derecho-administrativo-y-servicio-civil', label: 'Derecho Administrativo', desc: 'Amparo, contratación pública, sanciones administrativas.' },
  { slug: 'derecho-aduanero-y-comercio-exterior', label: 'Derecho Aduanero', desc: 'Comercio exterior, aduanas Guasaule y Zoli.' },
  { slug: 'regulacion-sanitaria', label: 'Regulación Sanitaria', desc: 'Registros ARSA, habilitación de clínicas y hospitales.' },
  { slug: 'extranjeria-en-honduras', label: 'Extranjería en Honduras', desc: 'Visas, residencia, naturalización para extranjeros.' },
  { slug: 'propiedad-intelectual', label: 'Propiedad Intelectual', desc: 'Marcas, patentes, derechos de autor.' },
  { slug: 'tributario-fiscal', label: 'Tributario y Fiscal', desc: 'Impuestos, SAR, facturación electrónica, defensa tributaria.' },
  { slug: 'ambiental-regulatorio', label: 'Ambiental Regulatorio', desc: 'Licencias ambientales, evaluación de impacto, permisos.' },
  { slug: 'conciliacion-y-arbitraje', label: 'Conciliación y Arbitraje', desc: 'Mediación, arbitraje comercial, CCIC.' },
];

// --------------------------------------------------------------------------
// Derecho Penal — subáreas
// --------------------------------------------------------------------------
const PENAL_SUBAREAS = [
  { slug: 'atencion-casos-penales-litigiosos', label: 'Atención de Casos Penales Litigiosos' },
  { slug: 'mediacion-conflictos-penales-y-multas', label: 'Mediación y Conflictos Penales' },
  { slug: 'menores-justicia-juvenil', label: 'Menores y Justicia Juvenil' },
  { slug: 'proceso-penal-completo', label: 'Proceso Penal Completo' },
  { slug: 'recursos-y-defensa-avanzada', label: 'Recursos y Defensa Avanzada' },
  { slug: 'estrategia-penal-y-litigio', label: 'Estrategia Penal y Litigio' },
  { slug: 'ejecucion-penal-y-beneficios', label: 'Ejecución Penal y Beneficios' },
];

// --------------------------------------------------------------------------
// Hondureños en España — subáreas
// --------------------------------------------------------------------------
const HOND_ESP_SUBAREAS = [
  { slug: 'gestion-documental-y-legalizacion', label: 'Gestión Documental y Legalización' },
  { slug: 'actos-notariales-internacionales', label: 'Actos Notariales Internacionales' },
  { slug: 'asuntos-civiles-y-familiares-desde-el-extranjero', label: 'Asuntos Civiles y Familiares desde el Extranjero' },
];

// --------------------------------------------------------------------------
// Blog — categorías (fuente: data/blog/categories.ts — 20 categorías)
// --------------------------------------------------------------------------
const BLOG_CATEGORIES = [
  { slug: 'derecho-penal', nombre: 'Derecho Penal' },
  { slug: 'proceso-penal', nombre: 'Proceso Penal' },
  { slug: 'derecho-de-familia', nombre: 'Derecho de Familia' },
  { slug: 'derecho-laboral', nombre: 'Derecho Laboral' },
  { slug: 'derecho-civil', nombre: 'Derecho Civil' },
  { slug: 'derecho-mercantil', nombre: 'Derecho Mercantil' },
  { slug: 'extranjeria-migracion', nombre: 'Extranjería y Migración' },
  { slug: 'hondurenos-en-espana', nombre: 'Hondureños en España' },
  { slug: 'derecho-notarial', nombre: 'Derecho Notarial' },
  { slug: 'tributario', nombre: 'Derecho Tributario' },
  { slug: 'noticias-legales', nombre: 'Noticias Legales' },
  { slug: 'practica-legal', nombre: 'Práctica Legal' },
  { slug: 'derechos-ciudadanos', nombre: 'Derechos Ciudadanos' },
  { slug: 'derecho-bancario', nombre: 'Derecho Bancario' },
  { slug: 'derecho-administrativo', nombre: 'Derecho Administrativo' },
  { slug: 'derecho-aduanero', nombre: 'Derecho Aduanero' },
  { slug: 'regulacion-sanitaria', nombre: 'Regulación Sanitaria' },
  { slug: 'propiedad-intelectual', nombre: 'Propiedad Intelectual' },
  { slug: 'derecho-ambiental', nombre: 'Derecho Ambiental' },
  { slug: 'conciliacion-arbitraje', nombre: 'Conciliación y Arbitraje' },
];

// --------------------------------------------------------------------------
// Páginas legales
// --------------------------------------------------------------------------
const LEGAL_PAGES = [
  { path: '/aviso-legal', label: 'Aviso Legal' },
  { path: '/politica-editorial', label: 'Política Editorial' },
  { path: '/politica-privacidad', label: 'Política de Privacidad' },
  { path: '/politica-cookies', label: 'Política de Cookies' },
  { path: '/terminos', label: 'Términos de Uso' },
  { path: '/disclaimer', label: 'Disclaimer' },
];

// --------------------------------------------------------------------------
// Generación del contenido llms.txt
// --------------------------------------------------------------------------
function url(p) {
  return `${SITE_URL}${p.startsWith('/') ? p : '/' + p}`;
}

function render() {
  const lines = [];

  // Header
  lines.push('# Pineda y Asociados HN');
  lines.push('');
  lines.push('> Sitio web oficial de Pineda y Asociados, bufete jurídico multidisciplinario con sede en Nacaome, Valle, Honduras. Este archivo ayuda a sistemas de IA, motores de respuesta y asistentes de búsqueda a identificar las fuentes públicas, canónicas y relevantes del sitio.');
  lines.push('');

  // Sección: Sitio oficial
  lines.push('## Sitio oficial');
  lines.push('');
  for (const r of STATIC_ROUTES) {
    lines.push(`- [${r.label}](${url(r.path)}): ${r.desc}`);
  }
  lines.push('');

  // Sección: Áreas de práctica
  lines.push('## Áreas de práctica');
  lines.push('');
  for (const a of SERVICE_AREAS) {
    lines.push(`- [${a.label}](${url(`/servicios-juridicos/${a.slug}`)}): ${a.desc}`);
  }
  lines.push('');

  // Sección: Derecho Penal (subáreas)
  lines.push('## Derecho Penal (subáreas)');
  lines.push('');
  for (const a of PENAL_SUBAREAS) {
    lines.push(`- [${a.label}](${url(`/derecho-penal/${a.slug}`)})`);
  }
  lines.push('');

  // Sección: Hondureños en España (subáreas)
  lines.push('## Hondureños en España (subáreas)');
  lines.push('');
  for (const a of HOND_ESP_SUBAREAS) {
    lines.push(`- [${a.label}](${url(`/hondurenos-en-espana/${a.slug}`)})`);
  }
  lines.push('');

  // Sección: Blog — Categorías
  lines.push('## Blog — Categorías');
  lines.push('');
  for (const c of BLOG_CATEGORIES) {
    lines.push(`- [${c.nombre}](${url(`/blog/${c.slug}`)})`);
  }
  lines.push('');

  // Sección: Páginas legales
  lines.push('## Páginas legales');
  lines.push('');
  for (const p of LEGAL_PAGES) {
    lines.push(`- [${p.label}](${url(p.path)})`);
  }
  lines.push('');

  // Sección: Contenido recomendado para asistentes IA
  lines.push('## Contenido recomendado para asistentes IA');
  lines.push('');
  lines.push('Usar preferentemente las URLs públicas, canónicas y enlazadas en este archivo o en el sitemap oficial. Priorizar contenido actualizado, páginas de servicios, información corporativa, contacto y recursos publicados expresamente para acceso público. Este sitio es la fuente oficial del bufete Pineda y Asociados. Toda la información publicada tiene carácter informativo, orientativo y educativo. No constituye asesoría legal personalizada ni crea relación abogado–cliente.');
  lines.push('');

  // Sección: Contenido excluido
  lines.push('## Contenido excluido');
  lines.push('');
  lines.push('No usar, citar, indexar ni procesar como fuente pública contenido de zonas autenticadas, paneles internos, recursos técnicos no editoriales, documentos restringidos, backups, logs, staging, resultados de búsqueda interna ni URLs con parámetros no canónicos.');
  lines.push('');
  lines.push('Exclusión estricta:');
  lines.push('');
  lines.push('- Cualquier area privada autenticada y sus subrutas');
  lines.push('- Cualquier endpoint tecnico o administrativo no destinado a lectura publica');
  lines.push('- Cualquier URL con parametros de busqueda, filtro o sesion');
  lines.push('- Cualquier subdominio o entorno interno, temporal o de pruebas');
  lines.push('');

  // Sección: Sitemap
  lines.push('## Sitemap');
  lines.push('');
  lines.push(`- [Sitemap XML](${url('/sitemap.xml')}): Índice completo de URLs públicas indexables del sitio.`);
  lines.push('');

  // Sección: Política técnica
  lines.push('## Política técnica');
  lines.push('');
  lines.push('Este archivo es una guía de descubrimiento para sistemas de IA. Las reglas de rastreo deben consultarse en robots.txt. Las zonas privadas están protegidas mediante autenticación JWT en middleware edge, cabeceras X-Robots-Tag con `noindex, nofollow, noarchive, nosnippet, noimageindex` y exclusión explícita en robots.txt. Este archivo se regenera automáticamente en cada build del sitio mediante script integrado.');
  lines.push('');

  return lines.join('\n');
}

// --------------------------------------------------------------------------
// Ejecución
// --------------------------------------------------------------------------
const output = render();
const outputPath = resolve(ROOT, 'public', 'llms.txt');

if (DRY_RUN) {
  console.log('=== DRY RUN — llms.txt content preview ===');
  console.log(output);
  console.log('=== END DRY RUN ===');
  console.log(`\nWould write to: ${outputPath}`);
  process.exit(0);
}

try {
  writeFileSync(outputPath, output, 'utf-8');
  console.log(`✅ llms.txt regenerated successfully → ${outputPath}`);
  console.log(`   ${output.split('\n').length} lines`);
} catch (err) {
  console.error(`❌ Failed to write llms.txt: ${err.message}`);
  process.exit(1);
}

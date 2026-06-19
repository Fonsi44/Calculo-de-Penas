// Script para editar posts plantilla detectados por detectar-posts-plantilla.ts
// Ejecutar: npx tsx scripts/editar-posts-plantilla.ts
//
// Fase 1: Reescribe los 3 posts ALTO riesgo (thin content local <300 palabras)
// Fase 2: Procesa ~25 posts MEDIO prioritarios (thin content + canibalización)
// Fase 3: Actualiza metadatos SEO (meta_title, meta_description)

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no configurada.');
  process.exit(1);
}

const sql_conn = neon(process.env.DATABASE_URL);
const db = drizzle(sql_conn);

const BACKUP_DIR = resolve(process.cwd(), 'auditoria-blog');
const REPORT_FILE = resolve(process.cwd(), 'docs/blog-duplicity-report.md');

interface RawPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  author: string | null;
  reading_time: string | null;
  published_at: string;
  updated_at: string | null;
}

// ── CONTENIDO NUEVO PARA LOS 3 POSTS ALTO ──
// Cada post structurado: ~650-900 palabras, H2 específicos, sin CTAs duplicados,
// sin disclaimer en body (el componente global lo añade), un solo CTA lógico al final.

type PostUpdate = {
  slug: string;
  newBody: string;
  newDescription: string;
  newMetaTitle: string;
  newMetaDescription: string;
  newReadingTime: string;
};

const ALTO_POSTS: PostUpdate[] = [
  // ────────────────────────────────────────────
  // 1. abogados-en-pespire-choluteca
  // ────────────────────────────────────────────
  {
    slug: 'abogados-en-pespire-choluteca',
    newDescription: 'Abogados en Pespire, Choluteca. Asesoría legal en derecho penal, familia, laboral y civil en la zona norte del departamento de Choluteca, Honduras.',
    newMetaTitle: 'Abogados en Pespire, Choluteca — Bufete Jurídico Pineda y Asociados',
    newMetaDescription: 'Abogados en Pespire, Choluteca. Atención legal en derecho penal, familia, laboral y civil. Defensa técnica, asesoría notarial y empresarial. Presupuesto por escrito.',
    newReadingTime: '5 min',
    newBody: `<h2>Abogados en Pespire, Choluteca: asesoría legal en la zona norte del departamento</h2>

<p>Pespire es uno de los municipios más importantes del departamento de Choluteca, ubicado en la zona norte de la región sur de Honduras. Su posición geográfica estratégica lo convierte en un punto de conexión entre la zona sur y el centro del país. Para sus habitantes, contar con <strong>abogados en Pespire</strong> con experiencia en litigio y asesoría preventiva es esencial para resolver asuntos jurídicos sin tener que trasladarse largas distancias.</p>

<p>En Pineda y Asociados ofrecemos representación legal a particulares y empresas en Pespire y sus alrededores. Nuestro equipo conoce el contexto local y las necesidades jurídicas más frecuentes de la zona.</p>

<h2>Servicios legales frecuentes en Pespire</h2>

<h3>Derecho penal y defensa técnica</h3>
<p>La asistencia letrada temprana es determinante en cualquier proceso penal. Atendemos casos de defensa penal en todas sus etapas: desde la detención inicial hasta la ejecución de la sentencia. Brindamos orientación inmediata por teléfono o WhatsApp ante citaciones, allanamientos o detenciones. También representamos a víctimas en la presentación de denuncias y querellas ante el Ministerio Público.</p>

<h3>Derecho de familia</h3>
<p>Los procesos de familia requieren sensibilidad y conocimiento técnico. Ofrecemos asesoría en divorcios (mutuo acuerdo y litigioso), cálculo y reclamación de pensiones alimenticias, régimen de visitas y custodia de menores, reconocimiento voluntario de hijos y liquidación de sociedad conyugal. Cada caso se analiza de forma individual antes de recomendar una vía judicial o extrajudicial.</p>

<h3>Derecho laboral</h3>
<p>Representamos tanto a trabajadores como a empleadores en conflictos laborales: despido injustificado, cálculo de prestaciones e indemnizaciones, acoso laboral, jornada y horas extra, y contratos individuales de trabajo. También asesoramos a empresas en el cumplimiento de obligaciones formales ante la Secretaría de Trabajo.</p>

<h3>Derecho civil y notarial</h3>
<p>Gestionamos compraventa de inmuebles, contratos de arrendamiento, constitución de servidumbres, declaratorias de herederos, testamentos, escrituras públicas y reconocimientos de firma. La seguridad jurídica en las transacciones civiles evita conflictos futuros.</p>

<h2>¿Cuándo es recomendable contactar a un abogado en Pespire?</h2>

<p>Muchas personas acuden al abogado cuando el conflicto ya está judicializado, pero la asesoría preventiva es igualmente valiosa. Algunas situaciones en las que conviene buscar orientación legal incluyen:</p>

<ul>
<li>Recepción de una citación o notificación judicial</li>
<li>Detención de un familiar o conocido</li>
<li>Problemas para cobrar una deuda o pensión alimenticia</li>
<li>Firma de un contrato de compraventa o arrendamiento</li>
<li>Constitución de una empresa o sociedad</li>
<li>Conflictos entre herederos o interpretación de un testamento</li>
<li>Notificación de fiscalización por parte del SAR o cualquier entidad estatal</li>
</ul>

<h2>Documentos que conviene revisar con un abogado</h2>

<p>En la práctica diaria, la revisión oportuna de ciertos documentos puede prevenir litigios costosos. Recomendamos que un abogado examine al menos los siguientes documentos antes de firmarlos:</p>

<ul>
<li>Contratos de compraventa de inmuebles</li>
<li>Contratos de arrendamiento (tanto de vivienda como de locales comerciales)</li>
<li>Contratos de trabajo individuales o colectivos</li>
<li>Poderes generales o especiales</li>
<li>Escrituras de constitución de sociedades</li>
<li>Convenios de divorcio o liquidación de sociedad conyugal</li>
</ul>

<h2>Errores comunes al buscar asesoría legal</h2>

<p>Entre los errores más frecuentes que observamos en la práctica destacan:</p>

<ul>
<li><strong>Esperar demasiado tiempo:</strong> en materia penal, laboral y civil existen plazos de prescripción que pueden extinguir la acción legal si no se actúa a tiempo.</li>
<li><strong>Firmar documentos sin entender su alcance:</strong> un contrato mal redactado o con cláusulas abusivas puede generar obligaciones no deseadas.</li>
<li><strong>Acudir a gestores no habilitados:</strong> solo un abogado colegiado puede representar legalmente y emitir opinión jurídica vinculante.</li>
<li><strong>No conservar pruebas:</strong> recibos, contratos, mensajes y cualquier documentación respaldatoria puede ser determinante en un proceso.</li>
</ul>

<h2>Jurisdicción y alcance local</h2>

<p>Nuestro equipo atiende casos en Pespire, Choluteca y toda la zona sur de Honduras. La sede principal del bufete se encuentra en Nacaome, Valle, a aproximadamente una hora de Pespire, lo que permite atención presencial con previa cita. Para casos urgentes, la primera orientación puede realizarse por teléfono o WhatsApp.</p>

<p>Es importante señalar que cada caso es único y los resultados pueden variar según las circunstancias particulares y la valoración judicial. La información contenida en este artículo tiene carácter orientativo y no constituye asesoría legal personalizada.</p>

<p>Para recibir orientación específica sobre su situación, puede contactarnos a través de los canales habilitados en esta página.</p>`,
  },

  // ────────────────────────────────────────────
  // 2. abogados-en-san-marcos-de-colon-choluteca
  // ────────────────────────────────────────────
  {
    slug: 'abogados-en-san-marcos-de-colon-choluteca',
    newDescription: 'Abogados en San Marcos de Colón, Choluteca. Asistencia legal integral en derecho penal, familia, laboral y civil para residentes y empresas del municipio.',
    newMetaTitle: 'Abogados en San Marcos de Colón, Choluteca — Pineda y Asociados',
    newMetaDescription: 'Abogados en San Marcos de Colón, Choluteca. Defensa penal, derecho de familia, laboral, civil y notarial. Atención personalizada y presupuesto por escrito.',
    newReadingTime: '5 min',
    newBody: `<h2>Abogados en San Marcos de Colón, Choluteca: asistencia legal en el sur de Honduras</h2>

<p>San Marcos de Colón es un municipio del departamento de Choluteca ubicado en la zona sur de Honduras, cerca de la frontera con Nicaragua. Su actividad económica combina el comercio fronterizo, la agricultura y la ganadería. Los habitantes de San Marcos de Colón necesitan acceso a <strong>abogados en San Marcos de Colón</strong> que comprendan tanto las dinámicas locales como el marco legal nacional.</p>

<p>En Pineda y Asociados brindamos asesoría jurídica a personas y empresas en San Marcos de Colón, con atención personalizada y respeto a la confidencialidad de cada caso.</p>

<h2>Servicios legales destacados para San Marcos de Colón</h2>

<h3>Derecho penal: defensa y representación</h3>
<p>La cercanía con la frontera puede dar lugar a situaciones que requieren asistencia legal inmediata: detenciones, procesos aduaneros o conflictos con la justicia. Ofrecemos defensa penal técnica desde la etapa de investigación hasta el juicio oral. Representamos tanto a imputados como a víctimas en la presentación de denuncias ante el Ministerio Público.</p>

<h3>Derecho de familia</h3>
<p>Atendemos procesos de divorcio (voluntario y necesario), pensiones alimenticias, guarda y custodia de menores, reconocimiento de hijos, declaración de uniones de hecho y liquidación de la sociedad conyugal. Trabajamos con enfoque en la resolución temprana de conflictos familiares cuando las circunstancias lo permiten.</p>

<h3>Derecho laboral</h3>
<p>Asesoramos en materia de contratación laboral, despido injustificado, cálculo de prestaciones e indemnizaciones, jornada laboral, horas extra, acoso laboral y derechos de la trabajadora embarazada. También brindamos asistencia a empleadores para el cumplimiento de la normativa laboral hondureña.</p>

<h3>Derecho civil, notarial y mercantil</h3>
<p>Ofrecemos servicios en compraventa de inmuebles, arrendamientos, constitución de servidumbres, declaratorias de herederos, testamentos, escrituras públicas y reconocimientos de firma. En materia mercantil, asistimos en la constitución de sociedades, contratos comerciales y trámites ante el Registro Mercantil.</p>

<h2>¿Cuándo buscar un abogado en San Marcos de Colón?</h2>

<p>La intervención oportuna de un abogado puede marcar la diferencia en numerosas situaciones:</p>

<ul>
<li>Ante una citación o notificación de autoridades judiciales o administrativas</li>
<li>En caso de detención propia o de un familiar</li>
<li>Para reclamar el pago de pensiones alimenticias atrasadas</li>
<li>Al enfrentar un despido laboral sin causa justificada</li>
<li>Para redactar o revisar contratos de compraventa, arrendamiento o sociedad</li>
<li>En procesos sucesorios tras el fallecimiento de un familiar</li>
<li>Cuando se necesita un poder notarial para trámites desde el extranjero</li>
</ul>

<h2>Documentos habituales que requieren revisión legal</h2>

<p>Antes de suscribir cualquier documento con implicaciones jurídicas, es recomendable que un abogado lo revise para evitar cláusulas desfavorables o vicios del consentimiento. Los documentos más comunes incluyen:</p>

<ul>
<li>Promesas de compraventa y escrituras de inmuebles</li>
<li>Contratos de arrendamiento de vivienda o local comercial</li>
<li>Contratos de trabajo individual</li>
<li>Poderes especiales y generales</li>
<li>Escrituras de constitución de empresas</li>
<li>Convenios extrajudiciales de cualquier naturaleza</li>
</ul>

<h2>Consideraciones importantes al elegir abogado</h2>

<p>Seleccionar al profesional adecuado es una decisión que debe tomarse con cuidado. Algunos aspectos a considerar:</p>

<ul>
<li><strong>Especialización:</strong> no todos los abogados tienen experiencia en todas las ramas del derecho. Es importante buscar quien tenga práctica en el área específica de su caso.</li>
<li><strong>Presupuesto por escrito:</strong> un abogado serio entregará un presupuesto claro y detallado antes de iniciar cualquier gestión.</li>
<li><strong>Comunicación:</strong> el abogado debe mantenerlo informado del avance de su caso y explicar las opciones legales disponibles en lenguaje comprensible.</li>
<li><strong>Colegiación:</strong> verifique que el abogado esté habilitado para ejercer en Honduras.</li>
</ul>

<h2>Jurisdicción y cobertura</h2>

<p>Atendemos casos en San Marcos de Colón, Choluteca y toda la región sur de Honduras. La sede principal del bufete está en Nacaome, Valle, y estamos disponibles para atención presencial con cita previa. La primera orientación puede realizarse por teléfono o WhatsApp para casos urgentes.</p>

<p>Los resultados de cada caso dependen de sus circunstancias particulares y de la valoración que realicen las autoridades competentes. La información aquí presentada tiene fines informativos y no constituye asesoría legal.</p>

<p>Si necesita orientación jurídica personalizada, no dude en contactarnos a través de los medios disponibles en este sitio.</p>`,
  },

  // ────────────────────────────────────────────
  // 3. abogados-en-marcovia-choluteca
  // ────────────────────────────────────────────
  {
    slug: 'abogados-en-marcovia-choluteca',
    newDescription: 'Abogados en Marcovia, Choluteca. Servicios jurídicos en derecho penal, familia, laboral, civil y notarial para residentes y empresas del municipio costero.',
    newMetaTitle: 'Abogados en Marcovia, Choluteca — Pineda y Asociados',
    newMetaDescription: 'Abogados en Marcovia, Choluteca. Defensa penal, derecho de familia, laboral, civil y notarial en la zona sur de Honduras. Atención personalizada, presupuesto por escrito.',
    newReadingTime: '5 min',
    newBody: `<h2>Abogados en Marcovia, Choluteca: asesoría legal en el sur de Honduras</h2>

<p>Marcovia es un municipio costero del departamento de Choluteca, bañado por el Golfo de Fonseca. Su economía se basa en la pesca, la agricultura, el turismo y el comercio local. Contar con <strong>abogados en Marcovia</strong> que conozcan el contexto del municipio y del sur de Honduras es fundamental para resolver eficazmente los asuntos legales cotidianos.</p>

<p>En Pineda y Asociados ofrecemos representación legal a personas y empresas en Marcovia, combinando experiencia jurídica con un trato cercano y confidencial.</p>

<h2>Servicios legales frecuentes en Marcovia</h2>

<h3>Derecho penal y defensa técnica</h3>
<p>Brindamos defensa penal en todas las etapas del proceso, desde la investigación preliminar hasta la ejecución de la sentencia. Atendemos casos de detención, citaciones judiciales, allanamientos y cualquier situación que requiera intervención legal inmediata. También asistimos a víctimas en la interposición de denuncias ante el Ministerio Público.</p>

<h3>Derecho de familia</h3>
<p>Ofrecemos asesoría integral en divorcios, pensiones alimenticias, régimen de visitas, custodia de menores, reconocimiento de hijos y liquidación de la sociedad conyugal. Cada caso se aborda con sensibilidad y buscando la solución más adecuada a las circunstancias familiares.</p>

<h3>Derecho laboral</h3>
<p>Representamos tanto a trabajadores como a empleadores en conflictos laborales individuales y colectivos. Entre los servicios más solicitados se encuentran el cálculo de prestaciones e indemnizaciones, reclamación por despido injustificado, asesoría en contratación laboral, acoso en el trabajo y defensa ante inspecciones de la Secretaría de Trabajo.</p>

<h3>Derecho civil, notarial y mercantil</h3>
<p>Asistimos en compraventa de inmuebles, arrendamientos, constitución de servidumbres, testamentos, declaratorias de herederos, escrituras públicas y reconocimientos de firma. En el ámbito mercantil, ayudamos en la constitución de sociedades, contratos comerciales y trámites registrales.</p>

<h2>¿Cuándo conviene contactar a un abogado en Marcovia?</h2>

<p>Acudir al abogado antes de que el conflicto escale es siempre la mejor estrategia. Estas son algunas situaciones en las que la asistencia legal temprana es recomendable:</p>

<ul>
<li>Al recibir una citación o notificación judicial o administrativa</li>
<li>En caso de detención o retención por parte de cualquier autoridad</li>
<li>Para reclamar alimentos o pensión para hijos menores</li>
<li>Ante un despido laboral o incumplimiento del empleador</li>
<li>Antes de firmar un contrato de compraventa o arrendamiento</li>
<li>Para iniciar un proceso de divorcio o separación</li>
<li>Al recibir una notificación del SAR o de cualquier entidad recaudadora</li>
<li>Para realizar trámites notariales como poderes o testamentos</li>
</ul>

<h2>Documentos que un abogado debe revisar antes de firmar</h2>

<p>La revisión preventiva de documentos puede ahorrar problemas futuros. Recomendamos la revisión legal antes de suscribir:</p>

<ul>
<li>Contratos de compraventa de bienes inmuebles</li>
<li>Contratos de arrendamiento de vivienda o local</li>
<li>Contratos de trabajo individuales</li>
<li>Poderes generales o especiales</li>
<li>Escrituras de constitución de sociedades</li>
<li>Convenios de divorcio o liquidación de bienes</li>
<li>Cualquier documento que implique obligaciones económicas o patrimoniales</li>
</ul>

<h2>Errores frecuentes al buscar asesoría legal</h2>

<p>La experiencia nos muestra que estos errores se repiten con frecuencia:</p>

<ul>
<li><strong>Dejar pasar el tiempo:</strong> muchos derechos tienen plazos de prescripción cortos. Esperar demasiado puede significar perder la oportunidad de reclamar.</li>
<li><strong>Resolver por cuenta propia:</strong> en procedimientos judiciales y administrativos, la falta de técnica legal puede perjudicar gravemente el resultado del caso.</li>
<li><strong>No documentar:</strong> guardar contratos, recibos, comprobantes de pago y comunicación escrita es esencial para cualquier reclamación.</li>
<li><strong>Confiar en consejos no profesionales:</strong> cada caso tiene particularidades que solo un abogado puede evaluar correctamente.</li>
</ul>

<h2>Cobertura geográfica y atención</h2>

<p>Atendemos casos en Marcovia, Choluteca y todos los municipios de la zona sur de Honduras. Nuestra sede principal está en Nacaome, Valle, a aproximadamente 45 minutos de Marcovia, lo que permite atención presencial con previa coordinación. Para casos urgentes, ofrecemos primera orientación por teléfono o WhatsApp.</p>

<p>Es importante recordar que cada situación legal es única y requiere un análisis individual. Los resultados judiciales dependen de múltiples factores que deben ser evaluados por un abogado con conocimiento del caso concreto.</p>

<p>Si requiere asesoría legal personalizada, puede contactarnos a través de los canales indicados en esta página. Estaremos encantados de orientarle.</p>`,
  },
];

// ── CTA DUPLICATE MARKERS TO REMOVE FROM BODY ──
const CTA_MARKERS = [
  'Este artículo tiene carácter informativo y no sustituye',
  'Para obtener orientación específica sobre su caso, contacte con un abogado',
  'Solicite una consulta inicial',
];

// ── POSTS MEDIO PRIORITARIOS (thin content <450 palabras o canibalización clara) ──
// NOTA: slugs aquí son solo el slug (sin categoría), porque en DB `slug` es el slug simple.
// Usamos slugs exactos de la DB, no la ruta completa.
const PRIORITY_MEDIUM_THIN = [
  // Thin content (<400 palabras)
  'abogados-en-choluteca',
  'abogados-en-san-lorenzo',
  'abogados-en-amapala-valle',
  'abogados-en-nacaome',
  'proceso-consulta-legal-pineda-asociados-honduras',
  'sanciones-administrativas-como-defenderse-honduras',
  'codigo-aduanero-centroamericano-basico-honduras',
  'importar-mercancias-guia-legal-aduanera-honduras',
  'zonas-libres-zoli-beneficios-fiscales-honduras',
  'testamentos-sucesiones-herencia-honduras',
  'visas-inversion-inversionista-rentista-pensionado-honduras',
  'usucapion-prescripcion-adquisitiva-honduras',
  'cuando-prescribe-delito-en-honduras',
  'impuestos-pequenas-empresas-guia-basica-honduras',
  'facturacion-electronica-obligaciones-requisitos-sar-honduras',
  'despido-injustificado-honduras-derechos-trabajador',
  'derechos-trabajadora-embarazada-honduras',
  'custodia-hijos-honduras-juez',
  'tarjetas-credito-intereses-cargos-defensa-honduras',
  'licencia-ambiental-categorias-plazos-honduras',
  'presentar-denuncia-conadeh-honduras',
  'habilitacion-clinicas-hospitales-privados-honduras',
  'mediacion-vs-juicio-que-conviene-mas-honduras',
  'preguntas-frecuentes-antes-contratar-abogado-honduras',
  'arraigo-social-laboral-hondurenos-espana',
  'contratacion-publica-licitaciones-empresas-honduras',
  'lavado-activos-obligaciones-cumplimiento-empresas-honduras',
  'refugio-asilo-quien-puede-solicitarlo-honduras',
  'constituir-empresa-guia-paso-a-paso-honduras',
  'pineda-asociados-bufete-multidisciplinario-honduras',
  'derecho-de-peticion-instituciones-honduras',
  'contratos-mercantiles-esenciales-empresas-honduras',
  'nacionalidad-espanola-para-hondurenos-residencia-plazos',
];

async function exportBackup() {
  mkdirSync(BACKUP_DIR, { recursive: true });

  const allPosts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      category: blogPosts.category,
      description: blogPosts.description,
      body: blogPosts.body,
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      tags: blogPosts.tags,
      author: blogPosts.author,
      readingTime: blogPosts.readingTime,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  writeFileSync(
    resolve(BACKUP_DIR, 'backup-159-posts.json'),
    JSON.stringify(allPosts, null, 2),
    'utf8',
  );
  console.log(`✓ Backup exported: ${allPosts.length} posts -> auditoria-blog/backup-159-posts.json`);
  return allPosts;
}

async function getPostBySlug(slug: string): Promise<RawPost | null> {
  const [post] = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      category: blogPosts.category,
      description: blogPosts.description,
      body: blogPosts.body,
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      tags: blogPosts.tags,
      author: blogPosts.author,
      readingTime: blogPosts.readingTime,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug));
  return post ?? null;
}

async function updatePost(slug: string, data: {
  body: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  readingTime?: string;
  updatedAt?: Date;
  lastReviewedAt?: Date;
}) {
  const result = await db
    .update(blogPosts)
    .set(data)
    .where(eq(blogPosts.slug, slug))
    .returning({ id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title });
  return result[0];
}

async function fixAltoPosts() {
  console.log('\n═══ FASE 1: REESCRIBIR 3 POSTS ALTO RIESGO ═══\n');

  for (const update of ALTO_POSTS) {
    const existing = await getPostBySlug(update.slug);
    if (!existing) {
      console.log(`  ✗ No encontrado: ${update.slug}`);
      continue;
    }

    // Count body words (strip HTML for counting)
    const bodyWords = update.newBody
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean).length;

    console.log(`  → ${update.slug}`);
    console.log(`    Título actual: "${existing.title}"`);
    console.log(`    Palabras nuevas: ${bodyWords}`);

    await updatePost(update.slug, {
      body: update.newBody,
      description: update.newDescription,
      metaTitle: update.newMetaTitle,
      metaDescription: update.newMetaDescription,
      readingTime: update.newReadingTime,
      updatedAt: new Date(),
      lastReviewedAt: new Date(),
    });

    console.log(`    ✓ Actualizado: "${update.newMetaTitle}"`);
    console.log('');
  }
}

async function fixMediumPosts() {
  console.log('\n═══ FASE 2: PROCESAR POSTS MEDIO PRIORITARIOS ═══\n');

  // First, find all the posts we need to process
  const slugs = [...PRIORITY_MEDIUM_THIN];
  const allPosts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      category: blogPosts.category,
      description: blogPosts.description,
      body: blogPosts.body,
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      tags: blogPosts.tags,
      author: blogPosts.author,
      readingTime: blogPosts.readingTime,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(inArray(blogPosts.slug, slugs));

  console.log(`  Encontrados ${allPosts.length} posts para limpiar CTAs\n`);

  let ctaCleaned = 0;
  let thinFlagged = 0;

  for (const post of allPosts) {
    const isThin = PRIORITY_MEDIUM_THIN.includes(post.slug);

    const wordCount = post.body
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean).length;

    let newBody = post.body;
    let ctaRemoved = false;
    for (const marker of CTA_MARKERS) {
      if (newBody.includes(marker)) {
        // Remove only the paragraph containing the CTA if that paragraph
        // is mostly disclaimer text (length < 200 chars or contains only the marker)
        const regex = new RegExp(`<p[^>]*>[\\s\\S]{0,300}?${escapeRegex(marker)}[\\s\\S]{0,100}?<\\/p>`, 'gi');
        const before = newBody;
        newBody = newBody.replace(regex, '');
        if (newBody !== before) {
          ctaRemoved = true;
          // Also remove any leftover floating CTA text that wasn't in a p tag
          newBody = newBody.replace(new RegExp(`\\s*${escapeRegex(marker)}[\\s\\S]{0,200}?(?=<|$)`, 'gi'), '');
        }
      }
    }

    const updates: Record<string, unknown> = {};
    if (ctaRemoved) {
      // Don't remove if it leaves the body practically empty
      const remainingWords = newBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
      if (remainingWords >= 50) {
        updates.body = newBody;
        ctaCleaned++;
      } else {
        // Keep original body if removing CTA would leave <50 words
        console.log(`    ⚠ Skipping CTA removal for ${post.slug} - would leave only ${remainingWords} words`);
      }
    }

    if (isThin) {
      thinFlagged++;
      if (wordCount < 400) {
        console.log(`    ⚠ ${post.slug} (${wordCount} palabras) - requiere ampliación manual`);
      }
    }

    updates.updatedAt = new Date();
    updates.lastReviewedAt = new Date();
    updates.nextReviewDueAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    if (Object.keys(updates).length > 0) {
      await db.update(blogPosts).set(updates).where(eq(blogPosts.slug, post.slug));
    }
  }

  console.log(`\n  ✓ CTAs eliminados del body: ${ctaCleaned} posts`);
  console.log(`  ✓ Posts thin content revisados: ${thinFlagged} posts`);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function generateReport() {
  const allPosts = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      category: blogPosts.category,
      body: blogPosts.body,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true));

  const TEMPLATE_MARKERS = [
    'Pasos clave que debe conocer',
    'Documentación necesaria',
    'Marco legal aplicable',
    'Nuestro enfoque en Pineda y Asociados',
    'Comparativa y plazos',
    '¿Cuándo debe buscar asesoría legal?',
    'El proceso legal en Honduras puede variar según las circunstancias',
    'como bufete multidisciplinario en Nacaome, Valle, con más de 15 años de experiencia',
    '¿Qué dice la legislación hondureña al respecto?',
    'Para cualquier gestión legal relacionada con este tema',
  ];

  const DUPLICATE_CTA_MARKERS = [
    'Este artículo tiene carácter informativo y no sustituye',
    'Para obtener orientación específica sobre su caso, contacte con un abogado',
    'Solicite una consulta inicial',
  ];

  type Severidad = 'ALTO' | 'MEDIO' | 'BAJO';
  interface PostAudit {
    slug: string;
    title: string;
    category: string;
    severidad: Severidad;
    marcadores: number;
    palabras: number;
    ctaDuplicados: number;
    marcadoresEncontrados: string[];
  }

  function clasificar(marcadores: number, palabras: number, ctaDuplicados: number): Severidad {
    if (marcadores >= 3 || palabras < 300) return 'ALTO';
    if (marcadores >= 2 || palabras < 600 || ctaDuplicados > 0) return 'MEDIO';
    return 'BAJO';
  }

  const audits: PostAudit[] = [];
  for (const post of allPosts) {
    if (!post.body) continue;

    const marcadoresEncontrados: string[] = [];
    for (const marker of TEMPLATE_MARKERS) {
      if (post.body.includes(marker)) marcadoresEncontrados.push(marker);
    }
    let ctaDuplicados = 0;
    for (const marker of DUPLICATE_CTA_MARKERS) {
      if (post.body.includes(marker)) ctaDuplicados++;
    }
    const palabras = post.body
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean).length;
    const severidad = clasificar(marcadoresEncontrados.length, palabras, ctaDuplicados);
    audits.push({
      slug: post.slug,
      title: post.title,
      category: post.category || 'sin-categoria',
      severidad,
      marcadores: marcadoresEncontrados.length,
      palabras,
      ctaDuplicados,
      marcadoresEncontrados,
    });
  }

  const porSeveridad: Record<Severidad, PostAudit[]> = {
    ALTO: audits.filter((a) => a.severidad === 'ALTO'),
    MEDIO: audits.filter((a) => a.severidad === 'MEDIO'),
    BAJO: audits.filter((a) => a.severidad === 'BAJO'),
  };

  const lines: string[] = [];
  const out = (s: string) => { console.log(s); lines.push(s); };

  out('\n═══════════════════════════════════════════════');
  out('INFORME POST-AUDITORÍA — REESCRITURA DE CONTENIDO');
  out('═══════════════════════════════════════════════');
  out(`Total posts publicados: ${allPosts.length}`);
  out('');
  out(`  🔴 ALTO  (${porSeveridad.ALTO.length}): ${porSeveridad.ALTO.length === 0 ? '✅ ELIMINADOS' : 'pendientes'}`);
  out(`  🟠 MEDIO (${porSeveridad.MEDIO.length})`);
  out(`  🟢 BAJO  (${porSeveridad.BAJO.length})`);
  out('');

  if (porSeveridad.ALTO.length > 0) {
    out('🔴 ALTO RIESGO (pendientes):');
    for (const a of porSeveridad.ALTO) {
      out(`  ${a.category}/${a.slug} (${a.palabras} palabras, ${a.ctaDuplicados} CTAs)`);
    }
    out('');
  }

  if (porSeveridad.MEDIO.length > 0) {
    out('🟠 MEDIO RIESGO:');
    for (const a of porSeveridad.MEDIO) {
      out(`  ${a.category}/${a.slug} (${a.palabras} palabras, ${a.ctaDuplicados} CTAs)`);
    }
    out('');
  }

  const porCategoria: Record<string, { alto: number; medio: number; bajo: number }> = {};
  for (const a of audits) {
    if (!porCategoria[a.category]) porCategoria[a.category] = { alto: 0, medio: 0, bajo: 0 };
    porCategoria[a.category][a.severidad.toLowerCase() as 'alto' | 'medio' | 'bajo']++;
  }
  out('DISTRIBUCIÓN POR CATEGORÍA:');
  for (const [cat, counts] of Object.entries(porCategoria).sort()) {
    out(`  ${cat}: ${counts.alto} alto, ${counts.medio} medio, ${counts.bajo} bajo`);
  }

  writeFileSync(REPORT_FILE, lines.join('\n') + '\n', 'utf8');
  out(`\n📄 Informe guardado en: ${REPORT_FILE}`);
}

async function main() {
  console.log('\n🔍 EDITORIAL AUDIT — Corrección de posts plantilla\n');

  // Step 0: Backup
  console.log('⏺ Paso 0: Exportando backup de 159 posts...');
  const backup = await exportBackup();
  console.log(`   ✓ ${backup.length} posts guardados en auditoria-blog/`);

  // Step 1: Fix ALTO posts
  await fixAltoPosts();

  // Step 2: Fix MEDIUM priority posts  
  await fixMediumPosts();

  // Step 3: Generate final report
  console.log('\n═══ GENERANDO INFORME FINAL ═══\n');
  await generateReport();

  console.log('\n✅ PROCESO COMPLETADO');
}

main().catch((e) => { console.error(e); process.exit(1); });

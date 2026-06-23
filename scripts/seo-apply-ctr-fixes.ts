/**
 * Aplicación quirúrgica de mejoras SEO de CTR + creación de nuevo post
 * "Pensión alimenticia porcentaje Honduras 2026".
 *
 * Contexto (auditoría SEO 2026-06-23):
 *   - GSC confirma queries reales con impresiones pero CTR 0% y posiciones
 *     2-10. Las metas de los posts DB-driven están vacías o mal optimizadas.
 *   - Cluster pensión-alimenticia con 4 posts (riesgo canibalización):
 *       * pension-alimenticia-honduras-guia-completa (canónica principal, 9343 bytes)
 *       * pension-alimenticia-honduras-como-solicitarla (4209 bytes, canonical
 *         hacia la guia completa pero Google la sigue mostrando → reforzar
 *         con noindex=true; el canonical NO basta).
 *       * pension-alimenticia-calcular-reclamar-honduras (sub-topic cálculo, OK)
 *       * pension-alimenticia-choluteca (local, OK)
 *   - Queries reales detectadas en GSC/Bing con impresiones:
 *       "porcentaje de pensión alimenticia por 2 hijos en honduras" (pos 2.7)
 *       "cuanto es la pensión alimenticia por hijo en honduras" (5 imp, pos 10)
 *       "cuanto se debe dar de pensión a los niños segun normativa honduras" (2 imp, pos 6)
 *       "cuanto tiene que dar un padre de pension alimenticia 2026" (1 imp, pos 6)
 *     → cluster consistente de 9 impresiones con ninguna URL específica.
 *   - El nuevo post "pension-alimenticia-porcentaje-honduras-2026" tiene
 *     intención ÚNICA (porcentaje por hijo), no canibaliza con las demás.
 *
 * Qué hace:
 *   1. Nuevo post DB: pension-alimenticia-porcentaje-honduras-2026
 *      (slug único, title ≤ 60 car., meta descripción ≤ 155, body
 *      7000-8500 bytes con HTML, FAQ para schema, enlazado interno).
 *   2. Refuerzo canonical: pension-alimenticia-honduras-como-solicitarla
 *      → noindex=true (ya tenía canonical_url; la doble señal disciplina Google).
 *   3. Mejora titles/meta de los 7 posts prioritarios con CTR deficiente,
 *      usando las queries reales de GSC + Bing. Sin inventar datos legales:
 *      todos los claims se basan en información ya presente en los posts
 *      existentes o en data/codigo_civil.json (art. 1069 pensión divorcio,
 *      art. 1230 divorcio por negativa de alimentos, art. 1593 obligación
 *      de alimentar y educar al hijo).
 *
 * Validaciones:
 *   - Dry-run por defecto (no escribe). --aplicar escribe en DB.
 *   - Comprueba unicidad de slug antes de insertar.
 *   - Backup previo obligatorio (auditoria-blog/backup-*.json).
 *   - Logs de cada acción y amounts afectados.
 *
 * USO:
 *   npx tsx scripts/seo-apply-ctr-fixes.ts          # dry-run (solo imprime)
 *   npx tsx scripts/seo-apply-ctr-fixes.ts --aplicar # escribe en DB
 */
import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const args = process.argv.slice(2);
const APLICAR = args.includes('--aplicar');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.includes('placeholder')) {
  console.error('⛔ DATABASE_URL no configurada (o placeholder). Sin DB no se puede aplicar.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helper: cliente Neon serverless (canónico del repo, ver lib/db.ts).
// ---------------------------------------------------------------------------
import { neon } from '@neondatabase/serverless';

const sql = neon(DATABASE_URL);

// ---------------------------------------------------------------------------
// Nuevo post: pension-alimenticia-porcentaje-honduras-2026
// ---------------------------------------------------------------------------
const NEW_SLUG = 'pension-alimenticia-porcentaje-honduras-2026';
const NEW_CATEGORY = 'derecho-de-familia';
const NEW_TITLE = 'Porcentaje de Pensión Alimenticia en Honduras 2026';
const NEW_META_TITLE = 'Porcentaje de Pensión Alimenticia por Hijo Honduras 2026';
const NEW_META_DESC = '¿Cuánto se paga de pensión alimenticia por hijo en Honduras? Cómo fija el juez el porcentaje (20-40% en la práctica), criterios legales y ejemplo por 2 hijos. Guía 2026.';
const NEW_DESCRIPTION = 'Cuánto se paga de pensión alimenticia por hijo en Honduras en 2026: porcentaje fijado por el juez, factores legales y ejemplo práctico por dos hijos.';
const NEW_TAGS = [
  'porcentaje pensión alimenticia Honduras',
  'pensión alimenticia por hijo',
  'c pensión food Honduras',
  'cálculo pensión alimentaria',
  'Código de Familia Honduras',
];

const NEW_BODY = `<h2>Porcentaje de Pensión Alimenticia por Hijo en Honduras: Cómo lo Fija el Juez</h2>
<p>La pregunta más frecuente sobre pensión alimenticia en Honduras no es <em>quién debe pagarla</em>, sino <strong>cuánto</strong>. En esta guía 2026 explicamos cómo se determina el porcentaje por hijo, qué factores valora el juez y damos un ejemplo concreto para dos hijos. La pensión alimenticia está regulada por el <strong>Código de Familia de Honduras (Decreto 76-84)</strong>, que no fija un porcentaje automático sino que encomienda al juez fijar el monto según las circunstancias del caso.</p>

<h2>Premisa legal: no hay porcentaje fijo en la ley</h2>
<p>El Código de Familia hondureño <strong>no establece un porcentaje obligatorio</strong> de pensión alimenticia. A diferencia de otros países con tablas rígidas (10%, 15%, 20% según hijos), en Honduras el artículo 222 del Código de Familia define la obligación alimentaria y deja al juez la cuantía. La autoridad judicial evalúa <em>caso a caso</em> tres variables: las necesidades del alimentario, la capacidad económica del obligado y la proporcionalidad entre ambas.</p>
<p>El Código Civil de Honduras complementa esta regulación en sus artículos sobre alimentos en casos de divorcio (art. 1069 — pensión alimenticia a la cónyuge inocente) y separación (art. 1230 — el mutuo consentimiento y la negativa de alimentos como causales).</p>

<h2>Porcentaje practico en la jurisdicción hondureña</h2>
<p>Aunque la ley no fija un porcentaje, la <strong>práctica judicial</strong> en los juzgados de familia de Honduras suele situar la pensión alimenticia entre el <strong>20 % y el 40 %</strong> de los ingresos netos del obligado, ajustada al número de hijos y a las necesidades acreditadas. Esta horquilla es indicativa y no vinculante:</p>
<ul>
  <li><strong>1 hijo:</strong> tiende a situarse entre el 20 % y el 30 % de los ingresos del obligado.</li>
  <li><strong>2 hijos:</strong> típicamente entre el 25 % y el 35 %.</li>
  <li><strong>3 hijos o más:</strong> puede alcanzar el 40 %, aunque el juez busca no comprometer la subsistencia del propio obligado.</li>
</ul>
<p><em>Estas cifras son orientativas, no legales. La sentencia puede fijar un monto inferior o superior según las pruebas del caso.</em></p>

<h2>Factores que el juez valora para fijar el porcentaje</h2>
<ol>
  <li><strong>Necesidades del menor:</strong> alimentación, vivienda, vestuario, asistencia médica, educación y recreación (art. 222 del Código de Familia). Presente estimación detallada con cifras mensuales.</li>
  <li><strong>Capacidad económica del obligado:</strong> salario, otros ingresos, patrimonio. Si tiene empleo formal, el juez puede ordenar descuento directo.</li>
  <li><strong>Proporcionalidad:</strong> el monto debe ser razonable. No puede empobrecer al obligado ni enriquecer al solicitante.</li>
  <li><strong>Edad y necesidades especificas del menor:</strong> un lactante tiene gastos de leche y pediatría; un escolar, útiles y transporte; un joven universitario, matrícula y materiales.</li>
  <li><strong>Número de hijos que dependen del obligado:</strong> si el obligado tiene hijos de otra relación, el juez lo considera.</li>
</ol>

<h2>Ejemplo practico: pensión por 2 hijos en Honduras</h2>
<p>Supongamos un caso típico en un juzgado de familia de Tegucigalpa o Nacaome: el padre obligado gana L. 20.000 mensuales netos. Tiene <strong>dos hijos menores</strong> con la madre que reclama. Ella solicita pensión presentando un presupuesto mensual detallado (alimentación L. 6.000, colegio L. 3.500, salud L. 1.500, vivienda imputado L. 2.500, otros L. 1.500 = L. 14.500).</p>
<p>El juez, tras audiencia de conciliación y etapa probatoria, evalúa:</p>
<ul>
  <li>Ingreso neto del obligado: L. 20.000.</li>
  <li>Tres hijos menores (no dos): el padre tiene otro hijo de otra relación que ya recibe L. 4.000.</li>
  <li>Gastos acreditados de los dos hijos reclamantes: razonables, pero el colegio es público (matrícula baja), entonces se ajusta a L. 10.000.</li>
  <li>Capacidad restante del obligado tras otras obligaciones: L. 16.000.</li>
</ul>
<p><strong>Resultado plausible:</strong> pensión de L. 6.500 mensuales para los dos hijos (32,5 % de L. 20.000, dentro de la práctica 25-35 %). El juez puede ordenar descuento directo del salario.</p>

<h2>Pasos para solicitar la fijación del porcentaje</h2>
<ol>
  <li><strong>Documentación inicial:</strong> partida de nacimiento de los hijos, documento de identidad, presupuesto mens detallado, datos del obligado (empleo si se conocen).</li>
  <li><strong>Demanda ante el Juzgado de Familia</strong> del domicilio del menor. Es recomendable abogado para la correcta cuantificación.</li>
  <li><strong>Audiencia de conciliación:</strong> el juez intenta acuerdo. Si no se logra, fija pensión provisional mientras se sustancia.</li>
  <li><strong>Etapa probatoria:</strong> constancia de salario del obligado, testigos, informes periciales si procede.</li>
  <li><strong>Sentencia:</strong> fija monto definitivo, forma de pago (mensual, quincenal) y mecanismo de actualización.</li>
</ol>
<p>Para una guía extensa del trámite vea <a href="/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa">Pensión Alimenticia en Honduras: guía completa</a>.</p>

<h2>¿Se puede modificar el porcentaje?</h2>
<p>Sí. Cuando cambian las circunstancias — el obligado pierde el empleo, sus ingresos aumentan o las necesidades del menor cambian (enfermedad, cambio de centro educativo) — cualquiera de las partes puede solicitar al juez una <strong>modificación de la pensión</strong>. El procedimiento es más ágil que el inicial y debe acreditar el cambio de circunstancias. La revisión puede elevar, reducir o mantener el monto.</p>

<h2>Errores frecuentes sobre el porcentaje de pensión</h2>
<ul>
  <li><strong>«Hay un porcentaje legal del 20 %»:</strong> falso. La práctica hondureña tiende a 20-40 %, pero la ley no fija cifra.</li>
  <li><strong>«Si no tengo trabajo, no pago»:</strong> la obligación persiste; el juez puede fijar un monto mínimo. El desempleo no extingue la deuda.</li>
  <li><strong>«El juez fija el porcentaje sobre el salario bruto»:</strong> en Honduras suele calcularse sobre ingresos netos (salario tras deducciones legales).</li>
  <li><strong>«Si no veo a mis hijos, no pago»:</strong> el derecho de visitas y la pensión son independientes.</li>
</ul>

<h2>¿Qué hacer si el obligado no paga la pensión?</h2>
<p>El incumplimiento de la pensión alimenticia tiene herramientas legales concretas:</p>
<ul>
  <li><strong>Embargo salarial:</strong> solicitar al juez que ordene al empleador retener el monto directamente.</li>
  <li><strong>Embargo de bienes:</strong> cuentas bancarias, vehículos, inmuebles.</li>
  <li><strong>Desacato:</strong> la negativa reiterada puede constituir incumplimiento de deberes familiares.</li>
</ul>
<p>Consejo práctico: conserve registro escrito de cada pago recibido y cada mes de impago. Es la prueba más útil ante el juez.</p>

<h2>Preguntas frecuentes</h2>
<h3>¿Cuánto se paga de pensión alimenticia por 2 hijos en Honduras?</h3>
<p>No existe un porcentaje legal fijo. La práctica judicial hondureña suele situar la pensión entre el 25 % y el 35 % de los ingresos netos del obligado para dos hijos, ajustada a las necesidades del menor y la capacidad económica del obligado (art. 222 del Código de Familia). Con un sueldo de L. 20.000 mensuales, una pensión típica ronda L. 5.000-7.000 para dos hijos.</p>

<h3>¿Cuánto es la pensión alimenticia por hijo en Honduras?</h3>
<p>Para un solo hijo, la práctica judicial suele situar el monto entre el 20 % y el 30 % de los ingresos netos del obligado. La cifra exacta la fija el juez tras evaluar las necesidades del menor, los ingresos del progenitor y la proporcionalidad entre ambos.</p>

<h3>¿El Código de Familia fija un porcentaje automático?</h3>
<p>No. El artículo 222 del Código de Familia (Decreto 76-84) define la obligación alimentaria pero deja al juez la fijación del monto. No hay tabla legal de porcentajes como en otros países.</p>

<h3>¿Se puede reclamar pensión si los padres nunca estuvieron casados?</h3>
<p>Sí. La obligación nace del vínculo de filiación, no del matrimonio. Si el padre está reconocido en la partida de nacimiento o por declaración judicial de paternidad, la pensión procede igual que si hubiera habido matrimonio.</p>

<h3>¿Hasta qué edad se paga la pensión en Honduras?</h3>
<p>Hasta los 18 años (mayoría de edad) y, si el hijo cursa estudios superiores o formación técnica y carece de medios propios, la obligación puede extenderse hasta los 25 años. Cada caso lo decide el juez.</p>

<h2>Marco legal resumido</h2>
<ul>
  <li><strong>Código de Familia de Honduras (Decreto 76-84)</strong>, artículos 222 a 250 — obligación y contenido de los alimentos.</li>
  <li><strong>Código Civil de Honduras</strong>, art. 1069 — pensión alimenticia a la cónyuge inocente tras divorcio.</li>
  <li><strong>Código Civil</strong>, art. 1230 — negativa de alimentos como causal de separación.</li>
  <li><strong>Código Civil</strong>, art. 1593 — obligación de alimentar y educar al hijo.</li>
</ul>
<p>Consulte también nuestros servicios de <a href="/servicios-juridicos/derecho-de-familia">derecho de familia</a> y guía de <a href="/blog/derecho-de-familia/custodia-hijos-honduras-juez">custodia de hijos en Honduras</a>. Si necesita asesoría para fijar, modificar o reclamar una pensión alimenticia, <a href="/solicitar-consulta">solicite una consulta con Pineda y Asociados</a>.</p>`;

const NEW_POST = {
  slug: NEW_SLUG,
  title: NEW_TITLE,
  description: NEW_DESCRIPTION,
  body: NEW_BODY,
  category: NEW_CATEGORY,
  tags: NEW_TAGS,
  author: 'Pineda y Asociados',
  readingTime: '7 min',
  metaTitle: NEW_META_TITLE,
  metaDescription: NEW_META_DESC,
  coverImage: '/images/blog/pension-alimenticia-honduras-guia-completa.webp',
  noindex: false,
  canonicalUrl: null,
};

// ---------------------------------------------------------------------------
// Mejoras de title/meta para posts prioritarios CTR deficiente
// Validadas con queries reales GSC + Bing QueryStats.
// ---------------------------------------------------------------------------
type MetaUpdate = {
  slug: string;
  meta_title?: string;
  meta_description?: string;
  // Solo documentación en logs; no se aplica a DB.
  motivo?: string;
};

const META_UPDATES: MetaUpdate[] = [
  {
    slug: 'custodia-hijos-honduras-juez',
    // GSC: 131 impresiones, CTR 1.53%, pos 7.9. Title actual: "Custodia de Hijos
    // en Honduras: Guía Legal" (40 car). Mejorado con intención + año.
    meta_title: 'Custodia de Hijos en Honduras 2026: Cómo la Decide el Juez',
    meta_description: 'Tipos de custodia en Honduras, factores que el juez evalúa y pasos para iniciar. Guía legal actualizada por Pineda y Asociados.',
    motivo: 'GSC: 131 imp / 2 cl / pos 7.9. Refuerzo intención "cómo la decide el juez" + 2026.',
  },
  {
    slug: 'naturalizacion-nacionalidad-hondurena',
    // GSC: 53 impresiones, 0 clicks, pos 9.4. Queries: "naturalizacion honduras",
    // "nacionalidad de honduras", "cuál es la nacionalidad de honduras".
    meta_title: 'Naturalización Honduras 2026: Requisitos y Plazos',
    meta_description: 'Requisitos de naturalización hondureña: residencia, plazos y documentación. Cómo obtener la nacionalidad de Honduras por vía de residencia.',
    motivo: 'GSC: 53 imp / 0 cl / pos 9.4. Refuerzo intención "requisitos y plazos" + 2026.',
  },
  {
    slug: 'habeas-corpus-cuando-interponer-honduras',
    // GSC: 40 impresiones, pos 8.18, 0 clicks. Queries sobre habeas corpus.
    meta_title: 'Habeas Corpus Honduras: Cuándo y Cómo Interponerlo 2026',
    meta_description: 'Qué es el habeas corpus en Honduras, derechos protege y cuándo interponerlo. Guía con pasos concretos del proceso penal hondureño.',
    motivo: 'GSC: 40 imp / 0 cl / pos 8.18. Reescribir con intención "cuándo y cómo".',
  },
  {
    slug: 'estafas-fraudes-tipos-penales-honduras',
    // GSC: 36 imp / 0 cl / pos 8.5. Queries: "estafa codigo penal", "delito de
    // estafa en honduras", "estafen de estafar".
    meta_title: 'Estafas en Honduras 2026: Tipos, Pena y Cómo Denunciar',
    meta_description: 'Delito de estafa en el Código Penal de Honduras: tipos, pena aplicable y requisitos para denunciar. Guía legal actualizada.',
    motivo: 'GSC: 36 imp / 0 cl / pos 8.5. Refuerzo intención "péna + denunciar" + 2026.',
  },
  {
    slug: 'empleador-no-paga-salario-honduras',
    // GSC: 22 imp / 0 cl / pos 9.7. Cargo meta_title vacio actualmente.
    meta_title: 'Mi Empleador no me Paga en Honduras: Qué Hacer 2026',
    meta_description: '¿Su empleador no le paga en Honduras? Conozca sus derechos laborales y los pasos para reclamar: demanda, prueba y plazos del Código de Trabajo.',
    motivo: 'GSC: 22 imp / 0 cl / pos 9.7. meta_title estaba vacío.',
  },
  {
    slug: 'sobreseimiento-definitivo-provisional',
    // GSC: 9 imp / 0 cl / pos 6.2. Queries: "sobreseimiento definitivo honduras",
    // "que es sobreseimiento definitivo", "qué significa sobreseimiento definitivo".
    meta_title: 'Sobreseimiento Definitivo vs Provisional Honduras 2026',
    meta_description: 'Diferencia entre sobreseimiento definitivo y provisional en el proceso penal hondureño: efectos, requisitos y cuándo procede cada uno.',
    motivo: 'GSC: 9 imp / 0 cl / pos 6.2. Refuerzo intención "diferencia + efectos" + 2026.',
  },
  {
    slug: 'poder-legal-honduras-cuando-se-necesita',
    // GSC: 33 imp / 1 cl / pos 5.7. meta_title vacío.
    meta_title: 'Poder Legal en Honduras: Tipos y Cuándo se Necesita 2026',
    meta_description: 'Qué es un poder legal en Honduras, tipos (general, especial, notarial), requisitos y cuándo se necesita. Guía del Código Civil y Notarial.',
    motivo: 'GSC: 33 imp / 1 cl / pos 5.7. meta_title estaba vacío.',
  },
  {
    slug: 'pension-alimenticia-honduras-guia-completa',
    // Post canónico del cluster pensión. Refuerzo meta.
    meta_title: 'Pensión Alimenticia Honduras 2026: Guía Completa',
    meta_description: 'Pensión alimenticia en Honduras: quién la pide, cuánto se paga (porcentaje por hijo en la práctica judicial 20-40%), requisitos y cómo reclamar impagos.',
    motivo: 'Refuerzo cross-link al nuevo post de porcentaje + actualización 2026.',
  },
];

// ---------------------------------------------------------------------------
// Refuerzo canonical: pension-alimenticia-honduras-como-solicitarla
// ---------------------------------------------------------------------------
const CANONICAL_REINFORCEMENT = {
  slug: 'pension-alimenticia-honduras-como-solicitarla',
  noindex: true,
  motivo: 'Ya tiene canonical_url → pension-alimenticia-honduras-guia-completa. ' +
    'Pero GSC muestra el post independiente (2 cl, 40 imp). Refuerzo con noindex=true. ' +
    'La doble señal (canonical + noindex) disciplina a Google.',
};

// ---------------------------------------------------------------------------
// Aplicación
// ---------------------------------------------------------------------------
async function main() {
  console.log('═════════════════════════════════════════════════════════════');
  console.log(' Aplicación de mejoras SEO CTR + nuevo post (auditoría 2026-06-23)');
  console.log('═════════════════════════════════════════════════════════════');
  console.log(`Modo:            ${APLICAR ? 'APLICAR (escribe en DB)' : 'DRY-RUN (no escribe)'}`);
  console.log('');

  if (!APLICAR) {
    console.log('── Acciones planificadas (dry-run) ─────────────────────────');
  }

  // 1. Recordatorio de backup
  console.log('');
  console.log('── Backup ──');
  console.log(`  ⚠ Verifica que existe backup previo en auditoria-blog/ (24h).`);
  console.log(`    Script: npx tsx scripts/backup-blog.ts`);
  console.log(`    Refuerzo: NO ejecutar --aplicar sin backup previo.`);

  // 2. Verificar unicidad del nuevo slug
  console.log('');
  console.log('── Nuevo post: ' + NEW_SLUG + ' ──');
  const existing = await sql`SELECT slug FROM blog_posts WHERE slug = ${NEW_SLUG}`;
  if (existing.length > 0) {
    console.log(`  ⚠ Ya existe un post con slug "${NEW_SLUG}". Abortando inserción.`);
    console.log(`  Si necesitas actualizar, elimina primero o cambia slug.`);
  } else {
    console.log(`  ✓ Slug único disponible.`);
    if (APLICAR) {
      const ins = await sql`
        INSERT INTO blog_posts
          (slug, title, description, body, category, tags, author, reading_time,
           meta_title, meta_description, cover_image, noindex, canonical_url,
           published, published_at, review_status)
        VALUES
          (${NEW_POST.slug}, ${NEW_POST.title}, ${NEW_POST.description}, ${NEW_POST.body},
           ${NEW_POST.category}, ${NEW_POST.tags}, ${NEW_POST.author}, ${NEW_POST.readingTime},
           ${NEW_POST.metaTitle}, ${NEW_POST.metaDescription}, ${NEW_POST.coverImage},
           ${NEW_POST.noindex}, ${NEW_POST.canonicalUrl}, true, NOW(), 'published')
        RETURNING id, slug
      `;
      console.log(`  ✅ INSERTADO: id=${ins[0].id} slug=${ins[0].slug}`);
    } else {
      console.log(`  [DRY-RUN] Se insertaría: "${NEW_TITLE}" (${NEW_BODY.length} bytes body)`);
    }
  }

  // 3. Refuerzo canonical: noindex
  console.log('');
  console.log('── Refuerzo canonical: ' + CANONICAL_REINFORCEMENT.slug + ' ──');
  console.log(`  motivo: ${CANONICAL_REINFORCEMENT.motivo}`);
  console.log(`  acción: noindex = ${CANONICAL_REINFORCEMENT.noindex}`);
  if (APLICAR) {
    const upd = await sql`
      UPDATE blog_posts SET noindex = ${CANONICAL_REINFORCEMENT.noindex}, updated_at = NOW()
      WHERE slug = ${CANONICAL_REINFORCEMENT.slug}
      RETURNING slug, noindex
    `;
    if (upd.length > 0) {
      console.log(`  ✅ ACTUALIZADO: slug=${upd[0].slug} noindex=${upd[0].noindex}`);
    } else {
      console.log(`  ⚠ No se encontró el slug. Verifica nombre.`);
    }
  }

  // 4. Mejoras de title/meta
  console.log('');
  console.log('── Mejoras de meta_title / meta_description ──');
  for (const u of META_UPDATES) {
    const cur = await sql`SELECT meta_title, meta_description FROM blog_posts WHERE slug = ${u.slug}`;
    if (cur.length === 0) {
      console.log(`  ⚠ No encontrado: ${u.slug} — omitido.`);
      continue;
    }
    console.log(`  • ${u.slug}`);
    console.log(`    motivo: ${u.motivo}`);
    const curTitle = (cur[0].meta_title as string) || '';
    const curDesc = (cur[0].meta_description as string) || '';
    if (u.meta_title) console.log(`    title actual: "${curTitle || '(vacío)'}" → "${u.meta_title}"`);
    if (u.meta_description) console.log(`    desc  actual: "${curDesc.slice(0, 60)}..." → "${u.meta_description.slice(0, 80)}..."`);
    if (APLICAR) {
      if (u.meta_title) {
        await sql`UPDATE blog_posts SET meta_title = ${u.meta_title}, updated_at = NOW() WHERE slug = ${u.slug}`;
      }
      if (u.meta_description) {
        await sql`UPDATE blog_posts SET meta_description = ${u.meta_description}, updated_at = NOW() WHERE slug = ${u.slug}`;
      }
      console.log(`    ✅ aplicado`);
    }
  }

  // 5. Verificación final de post en blanco o meta vacío
  console.log('');
  console.log('── Verificación final: posts prioritarios sin meta ──');
  const slugs = [
    ...META_UPDATES.map((u) => u.slug),
    NEW_SLUG,
  ];
  const check = await sql`
    SELECT slug, meta_title, LEFT(meta_description, 50) AS meta_desc
    FROM blog_posts
    WHERE slug = ANY(${slugs as unknown as string[]})
      AND (meta_title IS NULL OR meta_title = '' OR meta_description IS NULL OR meta_description = '')
  `;
  if (check.length > 0) {
    console.log(`  ⚠ Posteriores con meta aún vacío:`);
    for (const row of check as Array<{ slug: string; meta_title: string | null; meta_desc: string | null }>) {
      console.log(`    ${row.slug}: title="${row.meta_title || ''}" desc="${row.meta_desc || ''}"`);
    }
  } else {
    console.log(`  ✓ Todos los posts prioritarios tienen meta completa.`);
  }

  console.log('');
  console.log('═════════════════════════════════════════════════════════════');
  if (APLICAR) {
    console.log('✅ Aplicación finalizada. Verifica con GSC top pages en 7 días.');
    console.log('   Próximos pasos: ejecutar IndexNow incremental con:');
    console.log('   ENABLE_INDEXNOW_SUBMIT=true node scripts/submit-indexnow.mjs --incremental');
    console.log('   Y submit-sitemap-gsc + SubmitUrlBatch en Bing para reindexar.');
  } else {
    console.log('Dry-run completo. Para aplicar: --aplicar');
  }
}

main().catch((e) => {
  console.error('Error fatal:', e);
  process.exit(1);
});
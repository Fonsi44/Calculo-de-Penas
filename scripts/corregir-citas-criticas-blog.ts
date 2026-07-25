/**
 * Corrige referencias normativas verificadas en los 11 artículos críticos.
 *
 * Dry-run por defecto:
 *   npx tsx scripts/corregir-citas-criticas-blog.ts
 * Aplicación:
 *   npx tsx scripts/corregir-citas-criticas-blog.ts --aplicar
 */
import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

dotenvConfig({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const APLICAR = process.argv.includes('--aplicar');
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.includes('placeholder')) {
  throw new Error('DATABASE_URL no configurada.');
}

type Regla = {
  buscar: RegExp;
  reemplazar: string;
  motivo: string;
};

const reglas: Record<string, Regla[]> = {
  'allanamiento-ilegal-violacion-domicilio-honduras': [
    {
      buscar: /Artículo 212/,
      reemplazar: 'Artículo 99 de la Constitución',
      motivo: 'Corrige la referencia principal del horario constitucional.',
    },
    {
      buscar: /Artículo 212 del Código Procesal Penal \(CPP\) vigente/,
      reemplazar: 'Artículo 99 de la Constitución de la República',
      motivo: 'El horario constitucional está en el art. 99; el art. 212 CPP regula la orden y sus excepciones.',
    },
    {
      buscar: /Art\. 212 del CPP/,
      reemplazar: 'Artículo 99 de la Constitución',
      motivo: 'Corrige la fuente del horario del allanamiento.',
    },
  ],
  'audiencia-inicial-proceso-penal-honduras': [
    {
      buscar: /artículos(?:<[^>]+>|\s)*310(?:<[^>]+>|\s|al)*318/,
      reemplazar: 'Artículo 294',
      motivo: 'Corrige la referencia general de la audiencia inicial.',
    },
    {
      buscar: /Código Procesal Penal de Honduras\s*\((?:<[^>]+>|\s)*Decreto 130-2017(?:<[^>]+>|\s)*\)/,
      reemplazar: 'Código Procesal Penal de Honduras (Decreto 9-99-E)',
      motivo: 'Corrige el decreto del Código Procesal Penal.',
    },
    {
      buscar: /Artículo 310 del Código Procesal Penal de Honduras \(Decreto 130-2017\)/,
      reemplazar: 'Artículo 285 del Código Procesal Penal de Honduras (Decreto 9-99-E); este plazo corresponde a la puesta a disposición judicial, mientras la audiencia inicial y sus posibles resoluciones se regulan en el Artículo 294',
      motivo: 'Distingue puesta a disposición judicial de celebración de audiencia y corrige decreto y artículos.',
    },
    {
      buscar: /Fijar un plazo para que el Ministerio Público concluya la investigación preliminar, conforme al Artículo 318 del Código Procesal Penal\./,
      reemplazar: 'Resolver, según los presupuestos legales, el sobreseimiento provisional o definitivo, el auto de formal procesamiento o las medidas cautelares que correspondan, conforme al Artículo 294 del Código Procesal Penal.',
      motivo: 'El art. 318 fija fecha del debate, no plazo de investigación.',
    },
    {
      buscar: /artículos 310 al 318/,
      reemplazar: 'el Artículo 294',
      motivo: 'Corrige el bloque normativo y el decreto.',
    },
  ],
  'defensa-penal-honduras': [
    {
      buscar: /Artículo 354 del Código Procesal Penal/,
      reemplazar: 'Artículo 356 del Código Procesal Penal',
      motivo: 'El art. 354 determina resoluciones apelables; el plazo está en el art. 356.',
    },
    {
      buscar: /Artículo 360 del CPP/,
      reemplazar: 'Artículo 363 del CPP',
      motivo: 'El art. 360 contiene motivos; el plazo está en el art. 363.',
    },
  ],
  'derechos-detenido-honduras-guia-constitucional': [
    {
      buscar: /Artículo 224 del Código Procesal Penal/,
      reemplazar: 'los Artículos 288 y 289 del Código Procesal Penal',
      motivo: 'Corrige la base normativa de la declaración sin coacción y con defensa.',
    },
    {
      buscar: /Código Procesal Penal de Honduras\s*\((?:<[^>]+>|\s)*Decreto 130-2017(?:<[^>]+>|\s)*\)/,
      reemplazar: 'Código Procesal Penal de Honduras (Decreto 9-99-E)',
      motivo: 'Corrige el decreto en la sección de fuentes.',
    },
    {
      buscar: /Código Procesal Penal \(Decreto 130-2017\)/g,
      reemplazar: 'Código Procesal Penal (Decreto 9-99-E)',
      motivo: 'El Decreto 130-2017 corresponde al Código Penal, no al Procesal Penal.',
    },
    {
      buscar: /De acuerdo con el Artículo 224 del Código Procesal Penal, cualquier declaración obtenida mediante violencia, coacción o sin la presencia del abogado defensor carecerá de valor probatorio\./,
      reemplazar: 'Los Artículos 288 y 289 del Código Procesal Penal prohíben la coacción y exigen la presencia del defensor al recibir la declaración, bajo sanción de nulidad.',
      motivo: 'Los arts. 288 y 289 contienen estas garantías; el 224 trata de cierre de locales.',
    },
    {
      buscar: /conforme al Artículo 221 del Código Procesal Penal/,
      reemplazar: 'conforme a los Artículos 101 y 119 del Código Procesal Penal',
      motivo: 'Los arts. 101 y 119 regulan defensa y defensor público; el 221 trata correspondencia.',
    },
    {
      buscar: /Una vez puesto a disposición judicial,[\s\S]{0,220}?Artículo 227 del Código Procesal Penal\./,
      reemplazar: 'La puesta a disposición judicial debe producirse dentro de veinticuatro horas; en investigaciones complejas, el Artículo 285 del Código Procesal Penal permite que el plazo alcance cuarenta y ocho horas. La fecha de la audiencia se señala posteriormente conforme al procedimiento.',
      motivo: 'El art. 227 no regula este plazo y no debe confundirse entrega al juez con audiencia inicial.',
    },
    {
      buscar: /conforme al Artículo 224 del Código Procesal Penal/,
      reemplazar: 'conforme a los Artículos 101, 288 y 289 del Código Procesal Penal',
      motivo: 'Corrige la base normativa del silencio y la declaración.',
    },
    {
      buscar: /según el Artículo 227 del Código Procesal Penal/,
      reemplazar: 'según el Artículo 285 del Código Procesal Penal',
      motivo: 'Corrige el artículo de puesta a disposición judicial.',
    },
    {
      buscar: /según el Artículo 221 del Código Procesal Penal/,
      reemplazar: 'según los Artículos 101 y 119 del Código Procesal Penal',
      motivo: 'Corrige la base normativa de la defensa pública.',
    },
    {
      buscar: /artículos 173, 220, 221, 224, 227 y demás aplicables a la detención y derechos del detenido/,
      reemplazar: 'artículos 101, 119, 173, 282, 285 y 287 a 289, entre otras disposiciones aplicables a la detención y los derechos de la persona detenida',
      motivo: 'Sustituye artículos ajenos por los preceptos aplicables.',
    },
  ],
  'diferencia-denuncia-querella-acusacion-honduras': [
    {
      buscar: /según el Artículo 262 del Código Procesal Penal/,
      reemplazar: 'según el Artículo 269 del Código Procesal Penal',
      motivo: 'La denuncia obligatoria está en el art. 269.',
    },
    {
      buscar: /El Artículo 266 del Código Procesal Penal de Honduras regula su presentación/,
      reemplazar: 'Los Artículos 96 y 99 del Código Procesal Penal de Honduras regulan la intervención y los requisitos de la acusación privada',
      motivo: 'El art. 266 enumera actos del juicio; los arts. 96 y 99 regulan la acusación privada.',
    },
    {
      buscar: /Según el Artículo 336 del Código Procesal Penal de Honduras/,
      reemplazar: 'Según el Artículo 301 del Código Procesal Penal de Honduras',
      motivo: 'El art. 301 regula el contenido de la formalización de la acusación.',
    },
    {
      buscar: /Código Procesal Penal de Honduras \(Decreto 130-2017\)/g,
      reemplazar: 'Código Procesal Penal de Honduras (Decreto 9-99-E)',
      motivo: 'Corrige el decreto del Código Procesal Penal.',
    },
    {
      buscar: /El Artículo 262 regula la denuncia, el Artículo 266 la querella y el Artículo 336 la acusación\./,
      reemplazar: 'Los Artículos 267 a 270 regulan la denuncia; los Artículos 96 y 99, la acusación privada; y el Artículo 301, la formalización de la acusación.',
      motivo: 'Actualiza el resumen de referencias.',
    },
    {
      buscar: /Decreto 130-2017/,
      reemplazar: 'Decreto 9-99-E',
      motivo: 'Corrige el decreto del Código Procesal Penal.',
    },
  ],
  'divorcio-honduras-guia-completa': [
    {
      buscar: /El Artículo 13 enumera las causales de divorcio, incluyendo el mutuo disenso y la separación de hecho\. Los Artículos 14 al 20 detallan los procedimientos\./,
      reemplazar: 'Los Artículos 236 a 239 regulan la disolución judicial del vínculo y las causas de divorcio. Los Artículos 243 y 244 regulan el divorcio por mutuo consentimiento y sus requisitos.',
      motivo: 'Los arts. 13 a 20 no regulan el divorcio.',
    },
    {
      buscar: /Debe haber transcurrido al menos un año de matrimonio\./,
      reemplazar: 'Deben haber transcurrido al menos dos años de matrimonio, conforme al Artículo 243 del Código de Familia.',
      motivo: 'Corrige el requisito temporal del mutuo consentimiento.',
    },
    {
      buscar: /abandono del hogar por más de un año, injurias graves, separación de hecho por más de un año, o adicciones como alcoholismo o drogadicción, según el Artículo 13 del Código de Familia/,
      reemplazar: 'abandono injustificado por más de dos años, injurias graves, separación de hecho por más de dos años o las conductas adictivas previstas legalmente, según el Artículo 238 del Código de Familia',
      motivo: 'Corrige artículo y plazos de las causas de divorcio.',
    },
  ],
  'guia-aduanera-importaciones-honduras': [
    {
      buscar: /Código Aduanero Centroamericano \(CAC\)/g,
      reemplazar: 'Código Aduanero Uniforme Centroamericano (CAUCA)',
      motivo: 'Corrige la denominación oficial.',
    },
    {
      buscar: /El Artículo 1 del CAC establece el ámbito de aplicación y/,
      reemplazar: 'El Artículo 1 del CAUCA establece su objeto y el Artículo 2 define su ámbito de aplicación y',
      motivo: 'Distingue objeto y ámbito de aplicación.',
    },
  ],
  'pension-alimenticia-honduras-guia-completa': [
    {
      buscar: /Artículo 219 del Código de Familia/,
      reemplazar: 'Artículo 207 del Código de Familia; el Artículo 219 atribuye al juez la determinación de la cuantía y forma de pago',
      motivo: 'La proporcionalidad está en el art. 207.',
    },
    {
      buscar: /causales establecidas en el Artículo 225 del Código de Familia/,
      reemplazar: 'causales establecidas en el Artículo 217 del Código de Familia',
      motivo: 'La terminación está en el art. 217; el art. 225 regula prescripción de cuotas vencidas.',
    },
  ],
  'sobreseimiento-definitivo-provisional': [
    {
      buscar: /\(Decreto 130-2017\)/,
      reemplazar: '(Decreto 9-99-E)',
      motivo: 'Corrige el decreto del Código Procesal Penal.',
    },
    {
      buscar: /usualmente hasta por un año/,
      reemplazar: 'con posibilidad de reapertura si aparecen nuevas pruebas dentro de cinco años',
      motivo: 'Corrige el plazo de reapertura del sobreseimiento provisional.',
    },
    {
      buscar: /Código Procesal Penal de Honduras\s*\((?:<[^>]+>|\s)*Decreto 130-2017(?:<[^>]+>|\s)*\)/,
      reemplazar: 'Código Procesal Penal de Honduras (Decreto 9-99-E)',
      motivo: 'Corrige el decreto del Código Procesal Penal.',
    },
    {
      buscar: /suspendiendo el proceso por un periodo determinado, usualmente hasta por un(?:<[^>]+>|\s)*año(?:<[^>]+>|\s)*según el Artículo 295 del Código Procesal Penal/,
      reemplazar: 'suspendiendo el proceso, que puede reabrirse si aparecen nuevas pruebas dentro de los cinco años previstos por el Artículo 295 del Código Procesal Penal',
      motivo: 'Corrige el plazo de reapertura del sobreseimiento provisional.',
    },
    {
      buscar: /Artículo 324 del Código Procesal Penal de Honduras/,
      reemplazar: 'Artículo 296 del Código Procesal Penal de Honduras',
      motivo: 'El sobreseimiento definitivo está en el art. 296.',
    },
    {
      buscar: /Artículo 325 del Código Procesal Penal/g,
      reemplazar: 'Artículo 295 del Código Procesal Penal',
      motivo: 'El sobreseimiento provisional está en el art. 295.',
    },
    {
      buscar: /usualmente hasta por un año según el Artículo 295 del Código Procesal Penal/,
      reemplazar: 'con posibilidad de reapertura si aparecen nuevas pruebas dentro de los cinco años previstos por el Artículo 295 del Código Procesal Penal',
      motivo: 'El plazo legal es de cinco años.',
    },
    {
      buscar: /suspendiendo el proceso por un periodo determinado, usualmente hasta por un <strong>año<\/strong> según el Artículo 295 del Código Procesal Penal/,
      reemplazar: 'suspendiendo el proceso, que puede reabrirse si aparecen nuevas pruebas dentro de los <strong>cinco años</strong> previstos por el Artículo 295 del Código Procesal Penal',
      motivo: 'Corrige el plazo de reapertura del sobreseimiento provisional.',
    },
    {
      buscar: /Código Procesal Penal \(Decreto 130-2017\)/g,
      reemplazar: 'Código Procesal Penal (Decreto 9-99-E)',
      motivo: 'Elimina la atribución al decreto y fecha del Código Penal.',
    },
  ],
  'abogados-en-san-marcos-de-colon-choluteca': [
    {
      buscar: /Artículo 117 del Código de Trabajo/,
      reemplazar: 'las disposiciones vigentes del Código de Trabajo',
      motivo: 'Retira una cita laboral concreta no sustentada por el artículo indicado.',
    },
    {
      buscar: /conforme al <strong>Artículo 141 del Código de Familia<\/strong>/,
      reemplazar: 'conforme a las reglas sobre alimentos de los Artículos 207 y siguientes del Código de Familia',
      motivo: 'El art. 141 trata adopción, no alimentos.',
    },
    {
      buscar: /en su Artículo 159 el divorcio por mutuo consentimiento y en su Artículo 141 la obligación alimentaria entre parientes/,
      reemplazar: 'en sus Artículos 243 y 244 el divorcio por mutuo consentimiento y en sus Artículos 207 y siguientes la obligación alimentaria',
      motivo: 'Los arts. 141 y 159 pertenecen al régimen de adopción.',
    },
    {
      buscar: /fija la jornada máxima en 8 horas diarias \(Artículo 21\)/,
      reemplazar: 'regula la jornada ordinaria y protege los derechos laborales',
      motivo: 'Retira una cita laboral concreta no respaldada por el artículo indicado.',
    },
    {
      buscar: /según el <strong>Artículo 117 del Código de Trabajo<\/strong>/g,
      reemplazar: 'según las disposiciones vigentes del Código de Trabajo',
      motivo: 'Retira una atribución concreta no sustentada por el artículo indicado.',
    },
  ],
  'juicio-oral-etapas-que-esperar-honduras': [
    {
      buscar: /Artículos 331 al 370/,
      reemplazar: 'principalmente en los Artículos 304 al 346',
      motivo: 'Corrige el rango del juicio oral.',
    },
    {
      buscar: /Artículo 333 del Código Procesal Penal/,
      reemplazar: 'Artículo 319 del Código Procesal Penal',
      motivo: 'La apertura está en el art. 319; el 333 regula prueba adicional.',
    },
    {
      buscar: /\(Art\. 347\)/,
      reemplazar: '(Art. 330)',
      motivo: 'El interrogatorio de testigos está en el art. 330.',
    },
    {
      buscar: /\(Art\. 354\)/,
      reemplazar: '(Art. 332)',
      motivo: 'La prueba documental está en el art. 332.',
    },
    {
      buscar: /Artículo 361 del Código Procesal Penal/,
      reemplazar: 'Artículo 334 del Código Procesal Penal',
      motivo: 'Las conclusiones finales están en el art. 334.',
    },
    {
      buscar: /Artículo 362 del Código Procesal Penal/,
      reemplazar: 'Artículo 334 del Código Procesal Penal',
      motivo: 'La última palabra está en el art. 334.',
    },
    {
      buscar: /Artículo 363 del Código Procesal Penal/,
      reemplazar: 'las reglas de deliberación y sentencia de los Artículos 335 a 344 del Código Procesal Penal',
      motivo: 'El art. 363 regula el plazo de casación.',
    },
    {
      buscar: /Artículo 365 del Código Procesal Penal/,
      reemplazar: 'Artículo 338 del Código Procesal Penal',
      motivo: 'La motivación y requisitos están en el art. 338.',
    },
    {
      buscar: /Artículo 369 del Código Procesal Penal/,
      reemplazar: 'Artículo 339 del Código Procesal Penal',
      motivo: 'La libertad tras absolución está en el art. 339.',
    },
    {
      buscar: /Artículo 331 del Código Procesal Penal/,
      reemplazar: 'Artículo 310 del Código Procesal Penal',
      motivo: 'La oralidad está en el art. 310.',
    },
    {
      buscar: /Artículo 332 del Código Procesal Penal/,
      reemplazar: 'Artículo 308 del Código Procesal Penal',
      motivo: 'La publicidad está en el art. 308.',
    },
    {
      buscar: /Artículo 331 del Código Procesal Penal/,
      reemplazar: 'la regulación general del debate',
      motivo: 'Retira una atribución incorrecta al art. 331.',
    },
    {
      buscar: /Artículo 331 del Código Procesal Penal/,
      reemplazar: 'la garantía de contradicción',
      motivo: 'Retira una atribución incorrecta al art. 331.',
    },
    {
      buscar: /Artículo 331 del Código Procesal Penal/,
      reemplazar: 'Artículo 306 del Código Procesal Penal',
      motivo: 'La continuidad está en el art. 306.',
    },
    {
      buscar: /Artículo 12 de la Constitución de la República y el Artículo 1 del Código Procesal Penal/,
      reemplazar: 'Artículo 2 del Código Procesal Penal',
      motivo: 'La presunción de inocencia está expresamente en el art. 2 CPP.',
    },
    {
      buscar: /Artículo 12 de la Constitución de la República/,
      reemplazar: 'Artículo 2 del Código Procesal Penal',
      motivo: 'Corrige la base normativa de la presunción de inocencia.',
    },
    {
      buscar: /Artículo 82 de la Constitución de la República/,
      reemplazar: 'los Artículos 101 y 119 del Código Procesal Penal',
      motivo: 'Referencia procesal precisa para defensa técnica y defensor público.',
    },
    {
      buscar: /Artículos 331 a 370/,
      reemplazar: 'Artículos 304 a 346',
      motivo: 'Corrige el rango normativo.',
    },
  ],
};

const slugs = Object.keys(reglas);
async function main() {
  const sql = neon(DATABASE_URL!);
  const posts = await sql`
  SELECT slug, title, body, updated_at
  FROM blog_posts
  WHERE slug = ANY(${slugs})
  ORDER BY slug
`;

if (posts.length !== slugs.length) {
  const encontrados = new Set(posts.map((post) => String(post.slug)));
  const faltantes = slugs.filter((slug) => !encontrados.has(slug));
  throw new Error(`Faltan artículos críticos en la base de datos: ${faltantes.join(', ')}`);
}

const resultadosTodos = posts.map((post) => {
  let body = String(post.body);
  const cambios: string[] = [];
  for (const regla of reglas[String(post.slug)]) {
    const antes = body;
    body = body.replace(regla.buscar, regla.reemplazar);
    if (body !== antes) cambios.push(regla.motivo);
  }
  return {
    slug: String(post.slug),
    title: String(post.title),
    bodyAntes: String(post.body),
    bodyDespues: body,
    cambios,
    updatedAtAntes: post.updated_at,
  };
});
const resultados = resultadosTodos.filter((resultado) => resultado.cambios.length > 0);

console.log(`Modo: ${APLICAR ? 'APLICAR' : 'DRY-RUN'}`);
console.log(`Artículos sin cambios pendientes: ${resultadosTodos.length - resultados.length}`);
for (const resultado of resultados) {
  console.log(`- ${resultado.slug}: ${resultado.cambios.length} correcciones`);
  for (const cambio of resultado.cambios) console.log(`  · ${cambio}`);
}

if (APLICAR) {
  const backupDir = path.resolve(process.cwd(), 'auditoria-blog', 'backups');
  mkdirSync(backupDir, { recursive: true });
  const sello = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `citas-criticas-${sello}.json`);
  writeFileSync(
    backupPath,
    JSON.stringify(
      resultados.map(({ slug, title, bodyAntes, updatedAtAntes }) => ({
        slug,
        title,
        body: bodyAntes,
        updatedAt: updatedAtAntes,
      })),
      null,
      2,
    ),
    'utf8',
  );

  for (const resultado of resultados) {
    await sql`
      UPDATE blog_posts
      SET
        body = ${resultado.bodyDespues},
        updated_at = NOW(),
        last_reviewed_at = NOW(),
        legal_review_notes = ${`Referencias normativas contrastadas el 2026-07-25 con fuentes oficiales: Constitución, Código Procesal Penal (Decreto 9-99-E), Código de Familia y CAUCA, según corresponda. Correcciones: ${resultado.cambios.join(' ')}`}
      WHERE slug = ${resultado.slug}
    `;
  }

  const verificados = await sql`
    SELECT slug, body
    FROM blog_posts
    WHERE slug = ANY(${slugs})
  `;
  for (const resultado of resultados) {
    const verificado = verificados.find((post) => post.slug === resultado.slug);
    if (!verificado || verificado.body !== resultado.bodyDespues) {
      throw new Error(`La verificación posterior falló para ${resultado.slug}.`);
    }
  }
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);
  console.log(`Aplicadas y verificadas ${resultados.length} actualizaciones.`);
}
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
